import XLSX from 'xlsx'
import { supabaseAdmin } from '../../lib/supabase.js'
import { normalizeAcademicYearLabel } from '../../utils/academicYear.js'
import {
  getScopedFiliereIdsForDepartement,
  getScopedFilieresForDepartement,
  isFiliereInDepartementScope
} from './filiereScopeService.js'

// Obtenir tous les modules d'un département
export const getModulesByDepartement = async (departementId, filiereId = null) => {
  try {
    const filiereIds = await getScopedFiliereIdsForDepartement(departementId)
    if (!filiereIds.length) {
      return { success: true, modules: [] }
    }

    let query = supabaseAdmin
      .from('modules')
      .select(`
        *,
        filieres (code, nom),
        promotions (id, annee, statut),
        affectations_module_enseignant (*, enseignants (*))
      `)
      .in('filiere_id', filiereIds)
      .order('code', { ascending: true })

    if (filiereId) {
      query = query.eq('filiere_id', filiereId)
    }

    const { data: modules, error } = await query

    if (error) throw error

    return {
      success: true,
      modules: (modules || []).map(mod => {
        // Gérer le cas où affectations_module_enseignant n'est pas un tableau
        const affectations = Array.isArray(mod.affectations_module_enseignant)
          ? mod.affectations_module_enseignant
          : (mod.affectations_module_enseignant ? [mod.affectations_module_enseignant] : [])

        const promo = Array.isArray(mod.promotions) ? mod.promotions[0] : mod.promotions
        return {
          id: mod.id,
          code: mod.code,
          nom: mod.nom,
          credit: mod.credit,
          semestre: mod.semestre,
          filiere: mod.filieres ? `${mod.filieres.code} - ${mod.filieres.nom}` : '-',
          filiereId: mod.filiere_id,
          promotionId: mod.promotion_id || null,
          anneeAcademique: promo?.annee || null,
          promotionStatut: promo?.statut || null,
          ue: mod.ue || 'UE1',
          nom_ue: mod.nom_ue || '',
          enseignants: affectations.map(aff => ({
            id: aff.enseignants?.id,
            nom: aff.enseignants?.nom,
            prenom: aff.enseignants?.prenom
          })),
          actif: mod.actif
        }
      })
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des modules:', error)
    console.error('❌ Message d\'erreur:', error.message)
    console.error('❌ Stack:', error.stack)
    return {
      success: false,
      error: `Erreur lors de la récupération des modules: ${error.message}`
    }
  }
}

// Créer un nouveau module
export const createModule = async (data, departementId) => {
  try {
    const { code, nom, credit, semestre, filiereId, ue, nom_ue, promotionId } = data

    if (!code || !nom || !credit || !semestre || !filiereId || !ue || !promotionId) {
      return {
        success: false,
        error: 'Tous les champs obligatoires doivent être remplis (y compris l\'année académique)'
      }
    }

    const { data: promotionRow, error: promoErr } = await supabaseAdmin
      .from('promotions')
      .select('id')
      .eq('id', promotionId)
      .maybeSingle()

    if (promoErr || !promotionRow) {
      return {
        success: false,
        error: 'Année académique (promotion) introuvable'
      }
    }

    // Vérifier que la filière appartient au département
    const { data: filiere } = await supabaseAdmin
      .from('filieres')
      .select('*')
      .eq('id', filiereId)
      .single()

    const filiereInScope = filiere ? await isFiliereInDepartementScope(departementId, filiere.id) : false
    if (!filiere || !filiereInScope) {
      return {
        success: false,
        error: 'Filière introuvable ou n\'appartient pas à votre département'
      }
    }

    if (filiere.type_filiere === 'groupe') {
      return {
        success: false,
        error: 'Choisissez un parcours (sous-filière), pas la filière parente seule.'
      }
    }

    const { data: existing } = await supabaseAdmin
      .from('modules')
      .select('id')
      .eq('code', code)
      .eq('filiere_id', filiereId)
      .eq('semestre', semestre)
      .eq('promotion_id', promotionId)
      .maybeSingle()

    if (existing) {
      return {
        success: false,
        error: 'Un module avec ce code existe déjà pour cette filière, ce semestre et cette année académique'
      }
    }

    const { data: module, error } = await supabaseAdmin
      .from('modules')
      .insert({
        code,
        nom,
        credit: parseInt(credit),
        semestre,
        filiere_id: filiereId,
        promotion_id: promotionId,
        departement_id: departementId,
        ue,
        nom_ue,
        actif: data.actif !== undefined ? data.actif : true
      })
      .select('*, filieres (*), promotions (id, annee, statut)')
      .single()

    if (error) throw error

    const insPromo = Array.isArray(module.promotions) ? module.promotions[0] : module.promotions
    return {
      success: true,
      module: {
        id: module.id,
        code: module.code,
        nom: module.nom,
        credit: module.credit,
        semestre: module.semestre,
        filiere: module.filieres ? `${module.filieres.code} - ${module.filieres.nom}` : '-',
        filiereId: module.filiere_id,
        promotionId: module.promotion_id,
        anneeAcademique: insPromo?.annee || null,
        ue: module.ue,
        nom_ue: module.nom_ue,
        actif: module.actif
      }
    }
  } catch (error) {
    console.error('Erreur lors de la création du module:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la création du module'
    }
  }
}

// Mettre à jour un module
export const updateModule = async (id, data, departementId) => {
  try {
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('modules')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing || existing.departement_id !== departementId) {
      return {
        success: false,
        error: 'Module introuvable ou n\'appartient pas à votre département'
      }
    }

    let updateData = {
      code: data.code,
      nom: data.nom,
      credit: data.credit ? parseInt(data.credit) : existing.credit,
      semestre: data.semestre,
      ue: data.ue || existing.ue || 'UE1',
      nom_ue: data.nom_ue !== undefined ? data.nom_ue : existing.nom_ue,
      actif: data.actif !== undefined ? data.actif : existing.actif
    }

    if (data.promotionId !== undefined) {
      if (!data.promotionId) {
        return {
          success: false,
          error: 'L\'année académique est obligatoire'
        }
      }
      const { data: pr, error: prErr } = await supabaseAdmin
        .from('promotions')
        .select('id')
        .eq('id', data.promotionId)
        .maybeSingle()
      if (prErr || !pr) {
        return {
          success: false,
          error: 'Année académique (promotion) introuvable'
        }
      }
      updateData.promotion_id = data.promotionId
    }

    // Si filiereId est fourni et différent, vérifier qu'elle appartient au département
    if (data.filiereId && data.filiereId !== existing.filiere_id) {
      const { data: filiere } = await supabaseAdmin
        .from('filieres')
        .select('*')
        .eq('id', data.filiereId)
        .single()

      const filiereInScope = filiere ? await isFiliereInDepartementScope(departementId, filiere.id) : false
      if (!filiere || !filiereInScope) {
        return {
          success: false,
          error: 'Filière introuvable ou n\'appartient pas à votre département'
        }
      }

      if (filiere.type_filiere === 'groupe') {
        return {
          success: false,
          error: 'Choisissez un parcours (sous-filière), pas la filière parente seule.'
        }
      }

      updateData.filiere_id = data.filiereId
    }

    const codeFinal = updateData.code
    const filiereIdFinal = updateData.filiere_id ?? existing.filiere_id
    const semestreFinal = updateData.semestre ?? existing.semestre
    const promotionIdFinal =
      updateData.promotion_id !== undefined ? updateData.promotion_id : existing.promotion_id

    if (!promotionIdFinal) {
      return {
        success: false,
        error: 'Associez une année académique au module (promotion manquante en base)'
      }
    }

    const { data: dup } = await supabaseAdmin
      .from('modules')
      .select('id')
      .eq('code', codeFinal)
      .eq('filiere_id', filiereIdFinal)
      .eq('semestre', semestreFinal)
      .eq('promotion_id', promotionIdFinal)
      .neq('id', id)
      .maybeSingle()

    if (dup) {
      return {
        success: false,
        error: 'Un module avec ce code existe déjà pour cette filière, ce semestre et cette année académique'
      }
    }

    const { data: module, error } = await supabaseAdmin
      .from('modules')
      .update(updateData)
      .eq('id', id)
      .select('*, filieres (*), promotions (id, annee, statut)')
      .single()

    if (error) throw error

    const promoIdSync = module.promotion_id || promotionIdFinal
    if (data.nom_ue !== undefined && data.nom_ue !== existing.nom_ue && promoIdSync) {
      await supabaseAdmin
        .from('modules')
        .update({ nom_ue: data.nom_ue })
        .eq('ue', updateData.ue)
        .eq('filiere_id', module.filiere_id)
        .eq('semestre', module.semestre)
        .eq('promotion_id', promoIdSync)
        .eq('departement_id', departementId)
    }

    const upPromo = Array.isArray(module.promotions) ? module.promotions[0] : module.promotions

    return {
      success: true,
      module: {
        id: module.id,
        code: module.code,
        nom: module.nom,
        credit: module.credit,
        semestre: module.semestre,
        filiere: module.filieres ? `${module.filieres.code} - ${module.filieres.nom}` : '-',
        filiereId: module.filiere_id,
        promotionId: module.promotion_id,
        anneeAcademique: upPromo?.annee || null,
        ue: module.ue,
        nom_ue: module.nom_ue,
        actif: module.actif
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du module:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la mise à jour du module'
    }
  }
}

// Supprimer un module
export const deleteModule = async (id, departementId) => {
  try {
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('modules')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing || existing.departement_id !== departementId) {
      return {
        success: false,
        error: 'Module introuvable ou n\'appartient pas à votre département'
      }
    }

    // Vérifier les notes
    const { count: notesCount } = await supabaseAdmin
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('module_id', id)

    if ((notesCount || 0) > 0) {
      return {
        success: false,
        error: 'Impossible de supprimer un module qui contient des notes'
      }
    }

    const { error } = await supabaseAdmin
      .from('modules')
      .delete()
      .eq('id', id)

    if (error) throw error

    return {
      success: true,
      message: 'Module supprimé avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du module:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la suppression du module'
    }
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeHeaderKey (k) {
  return String(k)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, '_')
}

function normalizeKeysRow (row) {
  const out = {}
  for (const [k, v] of Object.entries(row)) {
    out[normalizeHeaderKey(k)] = v
  }
  return out
}

function pickField (normRow, ...aliases) {
  for (const a of aliases) {
    const nk = normalizeHeaderKey(a)
    if (Object.prototype.hasOwnProperty.call(normRow, nk)) {
      const v = normRow[nk]
      if (v !== '' && v != null) return v
    }
  }
  for (const a of aliases) {
    const nk = normalizeHeaderKey(a)
    if (Object.prototype.hasOwnProperty.call(normRow, nk)) return normRow[nk]
  }
  return ''
}

function normalizeSemestre (raw) {
  const t = String(raw).trim().toUpperCase()
  if (/^S[1-6]$/.test(t)) return t
  const n = String(raw).replace(/\D/g, '')
  if (n && Number(n) >= 1 && Number(n) <= 6) return `S${Number(n)}`
  return t
}

function parseActifCell (v) {
  if (v === '' || v == null) return true
  const s = String(v).trim().toLowerCase()
  if (['non', 'n', '0', 'false', 'faux', 'no'].includes(s)) return false
  return true
}

function allocateModuleCode (nom, semestre, usedCodes) {
  if (!nom || !semestre) return null
  const cleanNom = String(nom).toUpperCase().replace(/[^A-Z\s]/g, '')
  const words = cleanNom.split(/\s+/).filter(w => w.length > 0)

  let prefix = ''
  if (words.length >= 2) {
    let acronym = words.map(w => w[0]).join('')
    if (acronym.length < 3) {
      const lastWord = words[words.length - 1]
      acronym += lastWord.substring(1, 1 + (3 - acronym.length))
    }
    prefix = acronym.substring(0, 3)
  } else if (words.length === 1) {
    prefix = words[0].substring(0, 3)
  } else {
    prefix = 'XXX'
  }
  prefix = prefix.padEnd(3, 'X')

  const semestreNum = String(semestre).replace(/\D/g, '') || '1'
  let suffix = 1
  const generateFullCode = (p, s, suf) => {
    const suffixStr = suf < 10 ? `0${suf}` : `${suf}`
    return `${p}-${s}${suffixStr}`
  }
  let candidate = generateFullCode(prefix, semestreNum, suffix)
  while (usedCodes.has(candidate)) {
    suffix++
    candidate = generateFullCode(prefix, semestreNum, suffix)
  }
  usedCodes.add(candidate)
  return candidate
}

/**
 * Import groupé depuis un fichier Excel (feuille « Modules » ou la 1ère feuille).
 * Colonnes attendues : filiere_code (ou filiere_id), nom, credit, semestre, ue, nom_ue, annee_academique, actif
 */
export async function importModulesFromExcelBuffer (buffer, departementId, defaultFiliereId = null) {
  const errors = []
  let created = 0

  try {
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const sheetName =
      wb.SheetNames.find((n) => String(n).trim().toLowerCase() === 'modules') || wb.SheetNames[0]
    if (!sheetName) {
      return { created: 0, errors: [], error: 'Classeur Excel vide' }
    }
    const sheet = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
    if (!rows.length) {
      return { created: 0, errors: [{ line: 1, message: 'Aucune ligne de données sous les en-têtes' }], error: null }
    }

    const scopedFilieres = await getScopedFilieresForDepartement(departementId)
    const eligible = scopedFilieres.filter((f) => f.type_filiere !== 'groupe')
    const eligibleIds = new Set(eligible.map((f) => f.id))
    const byCodeUpper = new Map()
    for (const f of eligible) {
      byCodeUpper.set(String(f.code).trim().toUpperCase(), f)
    }

    if (!eligible.length) {
      return { created: 0, errors: [], error: "Aucune filière (parcours) disponible pour l'import dans votre département" }
    }

    if (defaultFiliereId && !eligibleIds.has(defaultFiliereId)) {
      return { created: 0, errors: [], error: 'Filière par défaut non autorisée pour votre département' }
    }

    const { data: promotions, error: promoErr } = await supabaseAdmin
      .from('promotions')
      .select('id, annee')

    if (promoErr || !promotions?.length) {
      return { created: 0, errors: [], error: 'Impossible de charger les années académiques (promotions)' }
    }

    const findPromotionId = (label) => {
      const t = normalizeAcademicYearLabel(String(label))
      if (!t) return null
      const hit = promotions.find((p) => normalizeAcademicYearLabel(p.annee) === t)
      return hit?.id || null
    }

    const scopedIdList = [...eligibleIds]
    let existingMods = []
    if (scopedIdList.length > 0) {
      const { data: modRows, error: modErr } = await supabaseAdmin
        .from('modules')
        .select('code, filiere_id, semestre, promotion_id')
        .in('filiere_id', scopedIdList)
      if (modErr) throw modErr
      existingMods = modRows || []
    }

    const collisionByKey = new Map()
    const keyOf = (fid, sem, pid) => `${fid}|${sem}|${pid}`
    for (const m of existingMods) {
      if (!m.promotion_id) continue
      const k = keyOf(m.filiere_id, m.semestre, m.promotion_id)
      if (!collisionByKey.has(k)) collisionByKey.set(k, new Set())
      collisionByKey.get(k).add(m.code)
    }

    for (let i = 0; i < rows.length; i++) {
      const line = i + 2
      const norm = normalizeKeysRow(rows[i])

      const nom = String(pickField(norm, 'nom', 'name', 'module', 'intitule') || '').trim()
      if (!nom || /^exemple\s*:/i.test(nom)) continue

      const filiereCodeRaw = pickField(norm, 'filiere_code', 'code_filiere', 'code filiere', 'filiere')
      const filiereIdRaw = pickField(norm, 'filiere_id', 'id_filiere')

      let filiereId = null
      const idStr = String(filiereIdRaw || '').trim()
      if (idStr && UUID_RE.test(idStr) && eligibleIds.has(idStr)) {
        filiereId = idStr
      } else {
        const codeStr = String(filiereCodeRaw || '').trim().toUpperCase()
        if (codeStr) {
          const hit = byCodeUpper.get(codeStr)
          if (!hit) {
            errors.push({ line, message: `Code filière inconnu ou non autorisé : ${filiereCodeRaw}` })
            continue
          }
          filiereId = hit.id
        } else if (defaultFiliereId) {
          filiereId = defaultFiliereId
        } else {
          errors.push({ line, message: 'filiere_code manquant (ou renseignez une filière par défaut dans la fenêtre)' })
          continue
        }
      }

      const creditRaw = pickField(norm, 'credit', 'credits', 'ects', 'crédits', 'crédit')
      const credit = Number.parseInt(String(creditRaw).replace(',', '.'), 10)
      if (!Number.isFinite(credit) || credit < 0) {
        errors.push({ line, message: 'credit invalide (entier attendu)' })
        continue
      }

      const semRaw = pickField(norm, 'semestre', 'sem', 'semestre_academique')
      const semestre = normalizeSemestre(semRaw)
      if (!/^S[1-6]$/.test(semestre)) {
        errors.push({ line, message: `semestre invalide : ${semRaw} (attendu S1…S6)` })
        continue
      }

      const ue = String(pickField(norm, 'ue', 'code_ue') || 'UE1').trim() || 'UE1'
      const nomUe = String(pickField(norm, 'nom_ue', 'nom ue', 'intitule_ue') || '').trim()

      const anneeRaw = pickField(norm, 'annee_academique', 'annee', 'promotion', 'annee_universitaire')
      const promotionId = findPromotionId(anneeRaw)
      if (!promotionId) {
        errors.push({
          line,
          message: `annee_academique introuvable : « ${anneeRaw} » (même format qu'en base, ex. 2025-2026)`
        })
        continue
      }

      const actif = parseActifCell(pickField(norm, 'actif', 'active', 'est_actif'))

      const ck = keyOf(filiereId, semestre, promotionId)
      if (!collisionByKey.has(ck)) collisionByKey.set(ck, new Set())
      const used = collisionByKey.get(ck)

      const code = allocateModuleCode(nom, semestre, used)
      if (!code) {
        errors.push({ line, message: 'Impossible de générer le code module' })
        continue
      }

      const result = await createModule(
        {
          code,
          nom,
          credit,
          semestre,
          filiereId,
          ue,
          nom_ue: nomUe || null,
          promotionId,
          actif
        },
        departementId
      )

      if (!result.success) {
        used.delete(code)
        errors.push({ line, message: result.error || 'Création refusée' })
        continue
      }
      created++
    }

    if (created === 0 && errors.length === 0) {
      errors.push({ line: 0, message: 'Aucune ligne importée (vérifiez les en-têtes et supprimez les lignes d\'exemple)' })
    }

    return { created, errors, error: null }
  } catch (e) {
    console.error('importModulesFromExcelBuffer:', e)
    return { created: 0, errors: [], error: e.message || 'Erreur de lecture du fichier Excel' }
  }
}
