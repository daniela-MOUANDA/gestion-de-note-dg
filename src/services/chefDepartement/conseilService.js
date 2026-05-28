import { supabaseAdmin } from '../../lib/supabase.js'
import { getBulletinData, moduleEstProjetStage } from './relevesService.js'
import { decisionAnnuelleDetails, decisionPhaseL2L3 } from './plancheAnnuelService.js'
import { getScopedFilieresForDepartement } from './filiereScopeService.js'

const NIVEAU_SEMESTRES = {
  L1: ['S1', 'S2'],
  L2: ['S3', 'S4'],
  L3: ['S5', 'S6']
}

const LICENCE_BLOCKS = {
  L1: [{ label: 'Licence 1', licenceYear: 1, semestres: ['S1', 'S2'] }],
  L2: [
    { label: 'Licence 1', licenceYear: 1, semestres: ['S1', 'S2'] },
    { label: 'Licence 2', licenceYear: 2, semestres: ['S3', 'S4'] }
  ],
  L3: [
    { label: 'Licence 1', licenceYear: 1, semestres: ['S1', 'S2'] },
    { label: 'Licence 2', licenceYear: 2, semestres: ['S3', 'S4'] },
    { label: 'Licence 3', licenceYear: 3, semestres: ['S5', 'S6'] }
  ]
}

const toNum = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const round2 = (v) => Math.round(toNum(v) * 100) / 100

function semestreLabel(sem) {
  const m = String(sem || '').match(/^S(\d+)$/i)
  return m ? `Semestre ${m[1]}` : sem
}

function decisionBadgeClass(kind) {
  if (kind === 'ADMIS') return 'green'
  if (kind === 'PASSAGE_CONDITIONNEL') return 'amber'
  if (kind === 'REDOUBLE') return 'red'
  return 'slate'
}

// ─── Helpers admissibilité stage ─────────────────────────────────────────────

/**
 * Retourne les modules d'une UE donnée depuis un row bulletin.
 */
function getModsUE(row, ueCode) {
  return (row?.modules || []).filter(
    (m) => String(m.ue || '').toUpperCase() === ueCode.toUpperCase()
  )
}

/**
 * Vérifie si une UE est entièrement validée (tous ses crédits acquis).
 */
function ueEstValidee(row, ueCode) {
  const ues = row?.uesValidees || []
  const ue = ues.find((u) => String(u.ue || '').toUpperCase() === ueCode.toUpperCase())
  return !!ue?.valide
}

/**
 * Détermine si on est "avant soutenance" au niveau classe en examinant les notes
 * du module de stage dans l'UE cible (UE2 de S4 pour L2, UE2 de S6 pour L3).
 *
 * Règle :
 *   - Si TOUS les étudiants ont 0 (ou absence de note) pour le(s) module(s) stage → avant soutenance
 *   - Si AU MOINS UN a une note > 0 → après soutenance (les notes ont été saisies)
 *
 * @param {Map}    rowMap    Map(etudiantId → row) du semestre clé
 * @param {string} ueCode    Code UE cible ('UE2')
 * @param {Array}  etudiants Liste des étudiants
 * @returns {boolean} true = avant soutenance
 */
function detecterAvantSoutenance(rowMap, ueCode, etudiants) {
  if (!rowMap || rowMap.size === 0) return true   // Pas de données → avant soutenance par défaut

  for (const etu of etudiants) {
    const row = rowMap.get(etu.id)
    if (!row) continue

    const modsUE = getModsUE(row, ueCode)
    // Cibler le module stage/projet ; sinon vérifier tous les modules de l'UE
    const stageMods = modsUE.filter((m) => moduleEstProjetStage(m))
    const modsAVerifier = stageMods.length > 0 ? stageMods : modsUE

    if (
      modsAVerifier.some(
        (m) => m.moyenne !== null && m.moyenne !== undefined && Number(m.moyenne) > 0
      )
    ) {
      return false  // Au moins un étudiant a une note réelle → après soutenance
    }
  }

  return true  // Tous à 0 ou sans note → avant soutenance
}

/**
 * Vérifie si une UE serait validée en simulant 12/20 pour les modules de stage
 * dont la note vaut 0 (non encore soutenus).
 *
 * Règle LMD :
 *   - Tous les modules (simulés) ≥ 10  OU
 *   - Moyenne pondérée UE ≥ 10  ET  aucun module < 6
 *
 * @param {Array}   modsUE             Modules de l'UE
 * @param {boolean} stageNotYetGraded  true = avant soutenance → remplace 0 par 12 pour le stage
 */
function simulerValidationUEAvecNote12(modsUE, stageNotYetGraded = true) {
  if (!modsUE || modsUE.length === 0) return true

  const mods = modsUE.map((m) => {
    const grade = m.moyenne !== null && m.moyenne !== undefined ? Number(m.moyenne) : null
    let moy

    if (stageNotYetGraded && (grade === null || grade === 0)) {
      // Avant soutenance : 0 signifie "pas encore noté" → simuler 12
      moy = 12
    } else {
      // Après soutenance ou module avec note réelle différente de 0
      moy = grade !== null ? grade : 0
    }
    return { credit: toNum(m.credit), moy }
  })

  const credits = mods.reduce((s, m) => s + m.credit, 0)
  if (credits <= 0) return true

  const points   = mods.reduce((s, m) => s + m.moy * m.credit, 0)
  const moyenneUE = points / credits

  const tousOK         = mods.every((m) => m.moy >= 10)
  const hasEliminatoire = mods.some((m) => m.moy < 6)

  return tousOK || (moyenneUE >= 10 && !hasEliminatoire)
}

/**
 * Admissibilité en stage pour L2 — avant soutenance.
 *
 * Critères :
 *   1. L1 entièrement validée (S1+S2)
 *   2. S3 : UE1 ET UE2 validées
 *   3. S4 : UE1 validée
 *   4. S4 : UE2 validée OU simulation concluante avec 12/20 pour le stage
 *
 * Nuance "après soutenance détectée dans la classe" (stageNotYetGraded = false) :
 *   - L'étudiant a 0 pour le stage → il redouble directement (note réelle)
 *   - L'étudiant a une note > 0 → évaluation avec sa note réelle
 *
 * @param {{ [sem: string]: object|null }} rowByS
 * @param {boolean} stageNotYetGraded  Résultat de detecterAvantSoutenance pour la classe
 */
function admissibiliteStageL2(rowByS, stageNotYetGraded = true) {
  // 1. L1 validée
  const crS1  = toNum(rowByS.S1?.totalCreditsValides)
  const crS2  = toNum(rowByS.S2?.totalCreditsValides)
  const attS1 = toNum(rowByS.S1?.totalCreditsAttendusSemestre)
  const attS2 = toNum(rowByS.S2?.totalCreditsAttendusSemestre)
  if (attS1 + attS2 > 0 && crS1 + crS2 < attS1 + attS2) return false

  // 2. S3 — UE1 et UE2 validées
  if (!ueEstValidee(rowByS.S3, 'UE1')) return false
  if (!ueEstValidee(rowByS.S3, 'UE2')) return false

  // 3. S4 — UE1 validée
  if (!ueEstValidee(rowByS.S4, 'UE1')) return false

  // 4. S4 — UE2
  if (ueEstValidee(rowByS.S4, 'UE2')) return true

  const modsUE2 = getModsUE(rowByS.S4, 'UE2')

  // Après soutenance détectée : si cet étudiant a 0 pour le module stage → REDOUBLE direct
  if (!stageNotYetGraded) {
    const stageMods   = modsUE2.filter((m) => moduleEstProjetStage(m))
    const modsCheck   = stageMods.length > 0 ? stageMods : modsUE2
    const aZeroStage  = modsCheck.some(
      (m) => m.moyenne === null || m.moyenne === undefined || Number(m.moyenne) === 0
    )
    if (aZeroStage) return false   // Note réelle de 0 → redoublement
  }

  return simulerValidationUEAvecNote12(modsUE2, stageNotYetGraded)
}

/**
 * Admissibilité en stage pour L3 — avant soutenance (même principe que L2 sur S6 UE2).
 *
 * Critères :
 *   1. L1+L2 entièrement validées (S1+S2+S3+S4)
 *   2. S5 : UE1 ET UE2 validées
 *   3. S6 : toutes les UEs sauf UE2 validées
 *   4. S6 : UE2 validée OU simulation concluante avec 12/20 pour la soutenance
 *
 * @param {{ [sem: string]: object|null }} rowByS
 * @param {boolean} stageNotYetGraded
 */
function admissibiliteStageL3(rowByS, stageNotYetGraded = true) {
  // 1. L1+L2 validées
  const crS1  = toNum(rowByS.S1?.totalCreditsValides)
  const crS2  = toNum(rowByS.S2?.totalCreditsValides)
  const crS3  = toNum(rowByS.S3?.totalCreditsValides)
  const crS4  = toNum(rowByS.S4?.totalCreditsValides)
  const attS1 = toNum(rowByS.S1?.totalCreditsAttendusSemestre)
  const attS2 = toNum(rowByS.S2?.totalCreditsAttendusSemestre)
  const attS3 = toNum(rowByS.S3?.totalCreditsAttendusSemestre)
  const attS4 = toNum(rowByS.S4?.totalCreditsAttendusSemestre)
  const attL1L2 = attS1 + attS2 + attS3 + attS4
  if (attL1L2 > 0 && crS1 + crS2 + crS3 + crS4 < attL1L2) return false

  // 2. S5 — UE1 et UE2 validées
  if (!ueEstValidee(rowByS.S5, 'UE1')) return false
  if (!ueEstValidee(rowByS.S5, 'UE2')) return false

  // 3. S6 — toutes les UEs sauf UE2 validées
  const uesS6 = rowByS.S6?.uesValidees || []
  const autresUesS6 = uesS6.filter((u) => String(u.ue || '').toUpperCase() !== 'UE2')
  if (autresUesS6.some((u) => !u.valide)) return false

  // 4. S6 — UE2
  if (ueEstValidee(rowByS.S6, 'UE2')) return true

  const modsUE2 = getModsUE(rowByS.S6, 'UE2')

  // Après soutenance détectée : si cet étudiant a 0 pour la soutenance → REDOUBLE direct
  if (!stageNotYetGraded) {
    const stageMods  = modsUE2.filter((m) => moduleEstProjetStage(m))
    const modsCheck  = stageMods.length > 0 ? stageMods : modsUE2
    const aZeroStage = modsCheck.some(
      (m) => m.moyenne === null || m.moyenne === undefined || Number(m.moyenne) === 0
    )
    if (aZeroStage) return false
  }

  return simulerValidationUEAvecNote12(modsUE2, stageNotYetGraded)
}

/**
 * Données du conseil de classe : parcours multi-années, décisions jury, statistiques.
 */
export const getConseilClasseData = async (classeId, departementId, phase = null) => {
  try {
    const { data: classe, error: classeError } = await supabaseAdmin
      .from('classes')
      .select('*, filieres(id, code, nom), niveaux(id, code), formations(id, code, nom)')
      .eq('id', classeId)
      .single()

    if (classeError || !classe) {
      return { success: false, error: 'Classe introuvable' }
    }

    const niveauCode = classe.niveaux?.code || ''
    const blocks = LICENCE_BLOCKS[niveauCode]
    if (!blocks) {
      return {
        success: false,
        error: `Le niveau ${niveauCode || 'inconnu'} n'est pas pris en charge pour le conseil (L1, L2, L3).`
      }
    }

    const { data: inscriptions, error: insError } = await supabaseAdmin
      .from('inscriptions')
      .select('etudiant_id, etudiants(id, nom, prenom, matricule, sexe, date_naissance)')
      .eq('classe_id', classeId)
      .eq('statut', 'INSCRIT')
      .order('date_inscription', { ascending: true })

    if (insError) throw insError

    const etudiants = (inscriptions || [])
      .map((i) => i.etudiants)
      .filter((e) => e && e.actif !== false)

    const semestresNiveauActuel = NIVEAU_SEMESTRES[niveauCode] || []
    const semestreRowMaps = new Map()

    const allSemestres = [...new Set(blocks.flatMap((b) => b.semestres))]

    for (const semestre of allSemestres) {
      const allowCross = !semestresNiveauActuel.includes(semestre)
      const res = await getBulletinData(classeId, semestre, departementId, {
        allowCrossNiveauSemestre: allowCross
      })

      if (!res.success) {
        semestreRowMaps.set(semestre, new Map())
        continue
      }

      semestreRowMaps.set(
        semestre,
        new Map((res.data || []).map((row) => [row.etudiant?.id, row]))
      )
    }

    // Phase active uniquement pour L2/L3 avec un paramètre phase explicite
    const phaseActive = phase && (niveauCode === 'L2' || niveauCode === 'L3')

    // Détection "avant soutenance" au niveau classe :
    // Tous les étudiants ont 0 pour le module stage dans UE2 du semestre clé ?
    let stageNotYetGraded = true
    if (phaseActive && phase === 'avant_soutenance') {
      const semStage = niveauCode === 'L2' ? 'S4' : 'S6'
      stageNotYetGraded = detecterAvantSoutenance(
        semestreRowMaps.get(semStage),
        'UE2',
        etudiants
      )
    }

    const etudiantsConseil = etudiants.map((etu) => {
      const annees = blocks.map((block) => {
        const semestres = block.semestres.map((sem) => {
          const row = semestreRowMaps.get(sem)?.get(etu.id)
          return {
            semestre: sem,
            semestreLabel: semestreLabel(sem),
            moyenne: row?.moyenneGenerale ?? null,
            credits: toNum(row?.totalCreditsValides),
            creditsAttendus: toNum(row?.totalCreditsAttendusSemestre),
            statut: row?.statut || 'NON_SAISI',
            avisJury: row?.avisJury || null,
            avisJuryKind: row?.avisJuryKind || null
          }
        })

        const creditsAnnuel = semestres.reduce((s, x) => s + toNum(x.credits), 0)
        const moyennes = semestres
          .map((s) => s.moyenne)
          .filter((m) => m != null && Number.isFinite(Number(m)))
        const moyenneAnnuelle =
          moyennes.length > 0
            ? round2(moyennes.reduce((a, b) => a + Number(b), 0) / moyennes.length)
            : null

        const semestreA = block.semestres[0]
        const { text: decision, kind: decisionKind } = decisionAnnuelleDetails(
          creditsAnnuel,
          semestreA
        )

        return {
          label: block.label,
          licenceYear: block.licenceYear,
          semestres,
          creditsAnnuel,
          moyenneAnnuelle,
          decision,
          decisionKind,
          decisionBadge: decisionBadgeClass(decisionKind)
        }
      })

      // Pour L2/L3 avec phase : recalculer la décision de l'année courante
      if (phaseActive) {
        const lastAnnee = annees[annees.length - 1]

        let text, kind

        if (phase === 'avant_soutenance') {
          // Reconstruction des lignes par semestre pour accéder aux UEs et modules
          const rowByS = {}
          for (const sem of allSemestres) {
            rowByS[sem] = semestreRowMaps.get(sem)?.get(etu.id) || null
          }
          const admis = niveauCode === 'L2'
            ? admissibiliteStageL2(rowByS, stageNotYetGraded)
            : admissibiliteStageL3(rowByS, stageNotYetGraded)
          text = admis ? 'Admis en stage' : 'Non admis en stage'
          kind = admis ? 'ADMIS' : 'REDOUBLE'
        } else {
          // après soutenance — critère sur les crédits (L2 : 60 cr, L3 : 180 cr cumulés)
          const totalCreditsAll = annees.reduce((sum, a) => sum + a.creditsAnnuel, 0)
          const res = decisionPhaseL2L3(lastAnnee.creditsAnnuel, phase, niveauCode, totalCreditsAll)
          text = res.text
          kind = res.kind
        }

        lastAnnee.decision = text
        lastAnnee.decisionKind = kind
        lastAnnee.decisionBadge = decisionBadgeClass(kind)
      }

      const anneeCourante = annees[annees.length - 1]

      return {
        etudiant: {
          id: etu.id,
          nom: etu.nom,
          prenom: etu.prenom,
          matricule: etu.matricule,
          sexe: etu.sexe
        },
        annees,
        decisionCourante: anneeCourante?.decision || '—',
        decisionKindCourante: anneeCourante?.decisionKind || null
      }
    })

    const effectif = etudiantsConseil.length
    let admis = 0
    let passageConditionnel = 0
    let redouble = 0

    etudiantsConseil.forEach((row) => {
      const k = row.decisionKindCourante
      if (k === 'ADMIS') admis += 1
      else if (k === 'PASSAGE_CONDITIONNEL') passageConditionnel += 1
      else if (k === 'REDOUBLE') redouble += 1
    })

    const pct = (n) => (effectif > 0 ? Math.round((n / effectif) * 1000) / 10 : 0)

    // Libellés adaptatifs selon la phase
    let admisLabel = 'Admis'
    let redoubleLabel = 'Redouble'
    if (phaseActive && phase === 'avant_soutenance') {
      admisLabel = 'Admis en stage'
      redoubleLabel = 'Non admis en stage'
    } else if (phaseActive && phase === 'apres_soutenance') {
      admisLabel = niveauCode === 'L2' ? 'Diplômé admis en L3' : 'Diplôme Licence'
      redoubleLabel = niveauCode === 'L2' ? 'Redouble la L2' : 'Redouble la L3'
    }

    const stats = {
      effectif,
      admis,
      passageConditionnel,
      redouble,
      nonDecide: Math.max(0, effectif - admis - passageConditionnel - redouble),
      tauxReussite: pct(admis),
      tauxEchec: pct(redouble),
      tauxPassageConditionnel: pct(passageConditionnel),
      afficherPassageConditionnel: niveauCode === 'L1',
      phase: phase || null,
      admisLabel,
      redoubleLabel
    }

    const chartData = phaseActive
      ? [
          { name: admisLabel, value: admis, fill: '#22c55e' },
          { name: redoubleLabel, value: redouble, fill: '#ef4444' }
        ].filter((d) => d.value > 0 || effectif === 0)
      : [
          { name: 'Admis', value: admis, fill: '#22c55e' },
          { name: 'Passage conditionnel', value: passageConditionnel, fill: '#f59e0b' },
          { name: 'Redouble', value: redouble, fill: '#ef4444' }
        ].filter((d) => d.value > 0 || effectif === 0)

    const filiereObj = Array.isArray(classe.filieres) ? classe.filieres[0] : classe.filieres
    const promoObj = Array.isArray(classe.promotions) ? classe.promotions[0] : classe.promotions
    const formationObj = Array.isArray(classe.formations) ? classe.formations[0] : classe.formations

    return {
      success: true,
      meta: {
        classe: {
          id: classe.id,
          code: classe.code,
          nom: classe.nom,
          niveau: niveauCode,
          filiere: filiereObj?.code,
          filiereNom: filiereObj?.nom,
          formation: formationObj?.code || null,
          formationId: formationObj?.id || classe.formation_id || null
        },
        formationNom: formationObj?.nom || null,
        formationCode: formationObj?.code || null,
        anneeAcademique: promoObj?.annee || null,
        promotionId: promoObj?.id || classe.promotion_id,
        niveauCode,
        blocks: blocks.map((b) => ({
          label: b.label,
          licenceYear: b.licenceYear,
          semestres: b.semestres
        }))
      },
      stats,
      chartData,
      etudiants: etudiantsConseil
    }
  } catch (error) {
    console.error('Erreur getConseilClasseData:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la récupération des données du conseil'
    }
  }
}

function mapClasseRow(classe, promotion = null) {
  const filiereEmbed = Array.isArray(classe.filieres) ? classe.filieres[0] : classe.filieres
  const niveauEmbed = Array.isArray(classe.niveaux) ? classe.niveaux[0] : classe.niveaux
  const formationEmbed = Array.isArray(classe.formations) ? classe.formations[0] : classe.formations

  return {
    id: classe.id,
    code: classe.code,
    nom: classe.nom,
    niveau: niveauEmbed?.code,
    filiere: filiereEmbed?.code,
    filieres: filiereEmbed
      ? { id: filiereEmbed.id, nom: filiereEmbed.nom, code: filiereEmbed.code }
      : null,
    effectif: classe.effectif,
    nombreModules: classe.nombre_modules || 0,
    filiereId: classe.filiere_id,
    niveauId: classe.niveau_id,
    formationId: classe.formation_id,
    formation: formationEmbed
      ? { id: formationEmbed.id, code: formationEmbed.code, nom: formationEmbed.nom }
      : null,
    promotion_id: promotion?.id || null,
    promotion: promotion
      ? { id: promotion.id, annee: promotion.annee, statut: promotion.statut }
      : null
  }
}

/**
 * Classes Conseil : même logique que la requête SQL validée (inscriptions + promo + FI + L2 + MMI).
 */
export const getClassesForConseil = async (departementId, filters = {}) => {
  try {
    const {
      promotionId,
      promotionAnnee,
      formationId,
      formationCode,
      filiereId,
      niveauId,
      niveauCode
    } = filters

    const filieres = await getScopedFilieresForDepartement(departementId)
    const filiereIds = new Set()

    if (filiereId) {
      filiereIds.add(filiereId)
      for (const f of filieres) {
        if (f.parent_filiere_id === filiereId) filiereIds.add(f.id)
      }
      const anchor = filieres.find((f) => f.id === filiereId)
      const anchorCode = (anchor?.code || '').toUpperCase()
      if (anchorCode === 'MMI' || anchorCode.startsWith('MMI')) {
        for (const f of filieres) {
          const c = (f.code || '').toUpperCase()
          if (c === 'MMI' || c.startsWith('MMI-') || c.startsWith('MMI')) {
            filiereIds.add(f.id)
          }
        }
      }
    }

    if (filiereIds.size === 0) {
      return { success: true, classes: [] }
    }

    let resolvedFormationId = formationId || null
    if (!resolvedFormationId && formationCode) {
      const { data: fo } = await supabaseAdmin
        .from('formations')
        .select('id')
        .eq('code', formationCode)
        .maybeSingle()
      resolvedFormationId = fo?.id || null
    }

    let resolvedNiveauId = niveauId || null
    if (!resolvedNiveauId && niveauCode) {
      const { data: nv } = await supabaseAdmin
        .from('niveaux')
        .select('id')
        .eq('code', niveauCode)
        .maybeSingle()
      resolvedNiveauId = nv?.id || null
    }

    let query = supabaseAdmin
      .from('classes')
      .select('*, filieres(id, code, nom, type_filiere), niveaux(id, code, nom), formations(id, code, nom)')
      .in('filiere_id', [...filiereIds])

    if (resolvedNiveauId) query = query.eq('niveau_id', resolvedNiveauId)
    if (resolvedFormationId) query = query.eq('formation_id', resolvedFormationId)

    const { data: classes, error } = await query.order('code', { ascending: true })
    if (error) throw error

    let promoIdFilter = promotionId || null
    let promoMeta = null
    if (!promoIdFilter && promotionAnnee) {
      const { data: pr } = await supabaseAdmin
        .from('promotions')
        .select('id, annee, statut')
        .eq('annee', promotionAnnee)
        .maybeSingle()
      promoIdFilter = pr?.id || null
      promoMeta = pr
    } else if (promoIdFilter) {
      const { data: pr } = await supabaseAdmin
        .from('promotions')
        .select('id, annee, statut')
        .eq('id', promoIdFilter)
        .maybeSingle()
      promoMeta = pr
    }

    let result = classes || []

    if (promoIdFilter && result.length > 0) {
      const classeIds = result.map((c) => c.id)
      const { data: insRows, error: insErr } = await supabaseAdmin
        .from('inscriptions')
        .select('classe_id')
        .in('classe_id', classeIds)
        .eq('statut', 'INSCRIT')
        .eq('promotion_id', promoIdFilter)

      if (insErr) throw insErr
      const allowed = new Set((insRows || []).map((r) => r.classe_id))
      result = result.filter((c) => allowed.has(c.id))
    }

    const mapped = result.map((c) => mapClasseRow(c, promoMeta))

    return { success: true, classes: mapped }
  } catch (error) {
    console.error('Erreur getClassesForConseil:', error)
    return {
      success: false,
      error: error.message || 'Erreur lors de la recherche des classes pour le conseil'
    }
  }
}
