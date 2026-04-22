import { supabaseAdmin } from '../../lib/supabase.js'
import bcrypt from 'bcrypt'
import { notifyInscriptionFinalisee } from '../notificationService.js'

// Récupérer toutes les formations
export const getFormations = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('formations')
      .select('*')
      .order('code', { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erreur lors de la récupération des formations:', error)
    throw error
  }
}

// Récupérer toutes les filières
// excludeGroupes: masque les filières « groupe » (ex. MMI parent) pour listes d'inscription / filtres
export const getFilieres = async ({ excludeGroupes = false } = {}) => {
  try {
    let query = supabaseAdmin
      .from('filieres')
      .select('*')
      .order('code', { ascending: true })

    if (excludeGroupes) {
      query = query.neq('type_filiere', 'groupe')
    }

    const { data, error } = await query

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erreur lors de la récupération des filières:', error)
    throw error
  }
}

/** Parcours en Initiale 2 avec L1–L3 (tronc + options en L3) : code racine ou sous-parcours GI-*, RT-*, MTIC-*, ou tout parcours département MTIC. */
const isFiliereInitial2TriennaleComplete = (filiereRow) => {
  if (!filiereRow) return false
  const dept = filiereRow.departements
  const deptCode = Array.isArray(dept) ? dept[0]?.code : dept?.code
  if (deptCode === 'MTIC') return true
  const c = String(filiereRow.code || '').trim().toUpperCase()
  if (['MTIC', 'GI', 'RT'].includes(c)) return true
  if (c.startsWith('GI-') || c.startsWith('RT-') || c.startsWith('MTIC-')) return true
  return false
}

// Remonte à la filière racine (tronc commun) pour appliquer les règles même si l’ID pointe vers une option ou une entrée mal rattachée.
const resolveFilierePourRegleNiveaux = async (filiereId) => {
  let row = null
  let currentId = filiereId
  const seen = new Set()
  while (currentId && !seen.has(currentId)) {
    seen.add(currentId)
    const { data, error } = await supabaseAdmin
      .from('filieres')
      .select('id, code, parent_filiere_id, departements(code)')
      .eq('id', currentId)
      .single()
    if (error || !data) break
    row = data
    if (!data.parent_filiere_id) break
    currentId = data.parent_filiere_id
  }
  return row
}

// Récupérer les niveaux disponibles selon la formation et la filière
export const getNiveauxDisponibles = async (formationId, filiereId) => {
  try {
    // Récupérer la formation
    const { data: formation, error: formError } = await supabaseAdmin
      .from('formations')
      .select('*')
      .eq('id', formationId)
      .single()

    if (formError) throw formError

    if (formation?.code === 'INITIAL_2') {
      const filierePourRegle = await resolveFilierePourRegleNiveaux(filiereId)
      if (!filierePourRegle) {
        const { data, error } = await supabaseAdmin
          .from('niveaux')
          .select('*')
          .eq('code', 'L1')
        if (error) throw error
        return data
      }

      if (isFiliereInitial2TriennaleComplete(filierePourRegle)) {
        const { data, error } = await supabaseAdmin
          .from('niveaux')
          .select('*')
          .order('code', { ascending: true })
        if (error) throw error
        return data
      } else {
        // Autres filières Initial 2 n'ont que L1
        const { data, error } = await supabaseAdmin
          .from('niveaux')
          .select('*')
          .eq('code', 'L1')
        if (error) throw error
        return data
      }
    } else {
      // Initial 1 a tous les niveaux
      const { data, error } = await supabaseAdmin
        .from('niveaux')
        .select('*')
        .order('code', { ascending: true })
      if (error) throw error
      return data
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des niveaux:', error)
    throw error
  }
}

// Récupérer les classes d'une filière et d'un niveau
export const getClasses = async (filiereId, niveauId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('classes')
      .select(`
        *,
        filieres (*),
        niveaux (*)
      `)
      .eq('filiere_id', filiereId)
      .eq('niveau_id', niveauId)
      .order('code', { ascending: true })

    if (error) throw error

    // Mapper les noms de colonnes pour la compatibilité
    return data.map(c => ({
      id: c.id,
      code: c.code,
      nom: c.nom,
      filiereId: c.filiere_id,
      niveauId: c.niveau_id,
      effectif: c.effectif,
      filiere: c.filieres,
      niveau: c.niveaux
    }))
  } catch (error) {
    console.error('Erreur lors de la récupération des classes:', error)
    throw error
  }
}

// Récupérer les étudiants par filière et niveau (sans classe)
export const getEtudiantsParFiliereNiveau = async (filiereId, niveauId, promotionId, formationId, typeInscription) => {
  try {
    // IMPORTANT : Filtrer UNIQUEMENT par la formation sélectionnée
    // Ne pas inclure toutes les formations Initiale 1 et Initiale 2
    if (!formationId) {
      throw new Error('Formation ID est requis')
    }

    const { data: inscriptions, error } = await supabaseAdmin
      .from('inscriptions')
      .select(`
        *,
        etudiants (*),
        formations (*),
        filieres (*),
        niveaux (*)
      `)
      .eq('filiere_id', filiereId)
      .eq('niveau_id', niveauId)
      .eq('promotion_id', promotionId)
      .eq('formation_id', formationId) // Filtrer UNIQUEMENT par la formation sélectionnée
      .eq('type_inscription', typeInscription === 'inscription' ? 'INSCRIPTION' : 'REINSCRIPTION')
      .order('etudiants(nom)', { ascending: true })

    if (error) throw error

    return inscriptions.map(inscription => ({
      id: inscription.etudiants.id,
      inscriptionId: inscription.id,
      matricule: inscription.etudiants.matricule,
      nom: inscription.etudiants.nom,
      prenom: inscription.etudiants.prenom,
      email: inscription.etudiants.email,
      telephone: inscription.etudiants.telephone,
      photo: inscription.etudiants.photo || null,
      dateNaissance: inscription.etudiants.date_naissance ?
        inscription.etudiants.date_naissance.split('T')[0] : null,
      lieuNaissance: inscription.etudiants.lieu_naissance || null,
      adresse: inscription.etudiants.adresse || null,
      formation: inscription.formations.nom,
      filiere: inscription.filieres.nom,
      niveau: inscription.niveaux.nom,
      inscrit: inscription.statut === 'INSCRIT',
      statut: inscription.statut,
      dateInscription: inscription.date_inscription,
      documents: {
        acteNaissance: inscription.copie_acte_naissance ? { nom: 'acte_naissance.pdf', uploaded: true, url: inscription.copie_acte_naissance } : null,
        photo: inscription.photo_identite ? { nom: 'photo.jpg', uploaded: true, url: inscription.photo_identite } : null,
        quittance: inscription.quittance ? { nom: 'quittance.pdf', uploaded: true, url: inscription.quittance } : null,
        pieceIdentite: inscription.piece_identite ? { nom: 'cni.pdf', uploaded: true, url: inscription.piece_identite } : null,
        releveBac: inscription.copie_releve ? { nom: 'releve_bac.pdf', uploaded: true, url: inscription.copie_releve } : null,
        attestationReussiteBac: inscription.copie_diplome ? { nom: 'attestation_reussite_bac.pdf', uploaded: true, url: inscription.copie_diplome } : null
      }
    }))
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants:', error)
    throw error
  }
}

// Récupérer les étudiants d'une classe avec leur statut d'inscription (gardé pour compatibilité)
export const getEtudiantsParClasse = async (classeId, promotionId, typeInscription) => {
  try {
    const { data: inscriptions, error } = await supabaseAdmin
      .from('inscriptions')
      .select(`
        *,
        etudiants (*),
        formations (*),
        filieres (*),
        niveaux (*)
      `)
      .eq('classe_id', classeId)
      .eq('promotion_id', promotionId)
      .eq('type_inscription', typeInscription === 'inscription' ? 'INSCRIPTION' : 'REINSCRIPTION')
      .order('etudiants(nom)', { ascending: true })

    if (error) throw error

    return inscriptions.map(inscription => ({
      id: inscription.etudiants.id,
      inscriptionId: inscription.id,
      matricule: inscription.etudiants.matricule,
      nom: inscription.etudiants.nom,
      prenom: inscription.etudiants.prenom,
      email: inscription.etudiants.email,
      telephone: inscription.etudiants.telephone,
      photo: inscription.etudiants.photo || null,
      dateNaissance: inscription.etudiants.date_naissance ?
        inscription.etudiants.date_naissance.split('T')[0] : null,
      lieuNaissance: inscription.etudiants.lieu_naissance || null,
      adresse: inscription.etudiants.adresse || null,
      formation: inscription.formations.nom,
      filiere: inscription.filieres.nom,
      niveau: inscription.niveaux.nom,
      inscrit: inscription.statut === 'INSCRIT',
      statut: inscription.statut,
      dateInscription: inscription.date_inscription,
      documents: {
        acteNaissance: inscription.copie_acte_naissance ? { nom: 'acte_naissance.pdf', uploaded: true, url: inscription.copie_acte_naissance } : null,
        photo: inscription.photo_identite ? { nom: 'photo.jpg', uploaded: true, url: inscription.photo_identite } : null,
        quittance: inscription.quittance ? { nom: 'quittance.pdf', uploaded: true, url: inscription.quittance } : null,
        pieceIdentite: inscription.piece_identite ? { nom: 'cni.pdf', uploaded: true, url: inscription.piece_identite } : null,
        releveBac: inscription.copie_releve ? { nom: 'releve_bac.pdf', uploaded: true, url: inscription.copie_releve } : null,
        attestationReussiteBac: inscription.copie_diplome ? { nom: 'attestation_reussite_bac.pdf', uploaded: true, url: inscription.copie_diplome } : null
      }
    }))
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants:', error)
    throw error
  }
}

/**
 * Liste des inscriptions avec étudiants (scolarité) — filtres optionnels par promotion, filière, niveau.
 */
export const getListeEtudiantsInscriptions = async ({ promotionId, filiereId, niveauId } = {}) => {
  try {
    let query = supabaseAdmin
      .from('inscriptions')
      .select(`
        id,
        statut,
        date_inscription,
        filiere_id,
        niveau_id,
        promotion_id,
        formation_id,
        classe_id,
        etudiants ( id, matricule, nom, prenom, email, telephone ),
        filieres ( id, nom, code ),
        niveaux ( id, nom, code ),
        promotions ( id, annee ),
        formations ( id, nom, code ),
        classes ( id, nom )
      `)
      .order('date_inscription', { ascending: false })

    if (promotionId) query = query.eq('promotion_id', promotionId)
    if (filiereId) query = query.eq('filiere_id', filiereId)
    if (niveauId) query = query.eq('niveau_id', niveauId)

    const { data, error } = await query.limit(8000)

    if (error) throw error

    const rows = (data || [])
      .filter((row) => row.etudiants)
      .map((row) => ({
        inscriptionId: row.id,
        etudiantId: row.etudiants.id,
        matricule: row.etudiants.matricule,
        nom: row.etudiants.nom,
        prenom: row.etudiants.prenom,
        email: row.etudiants.email,
        telephone: row.etudiants.telephone,
        statutInscription: row.statut,
        filiereId: row.filiere_id,
        filiereNom: row.filieres?.nom ?? '',
        filiereCode: row.filieres?.code ?? '',
        niveauId: row.niveau_id,
        niveauCode: row.niveaux?.code ?? '',
        niveauNom: row.niveaux?.nom ?? '',
        promotionId: row.promotion_id,
        anneeAcademique: row.promotions?.annee ?? '',
        formationNom: row.formations?.nom ?? '',
        formationCode: row.formations?.code ?? '',
        classeNom: row.classes?.nom ?? ''
      }))

    rows.sort((a, b) => {
      const c = (a.nom || '').localeCompare(b.nom || '', 'fr', { sensitivity: 'base' })
      if (c !== 0) return c
      return (a.prenom || '').localeCompare(b.prenom || '', 'fr', { sensitivity: 'base' })
    })

    return rows
  } catch (error) {
    console.error('Erreur liste étudiants inscriptions:', error)
    throw error
  }
}

// Valider une inscription
export const validerInscription = async (inscriptionId, agentId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('inscriptions')
      .update({
        statut: 'VALIDEE',
        date_validation: new Date().toISOString(),
        agent_valideur_id: agentId
      })
      .eq('id', inscriptionId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erreur lors de la validation de l\'inscription:', error)
    throw error
  }
}

// Générer un mot de passe aléatoire sécurisé
const generatePassword = () => {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*'
  let password = ''

  // S'assurer qu'il y a au moins une majuscule, une minuscule, un chiffre et un caractère spécial
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
  password += '0123456789'[Math.floor(Math.random() * 10)]
  password += '!@#$%&*'[Math.floor(Math.random() * 7)]

  // Remplir le reste avec des caractères aléatoires
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }

  // Mélanger les caractères
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// Finaliser une inscription (scolarité soldée)
export const finaliserInscription = async (inscriptionId, agentId) => {
  try {
    // Récupérer l'inscription avec les données de l'étudiant
    const { data: inscription, error: inscError } = await supabaseAdmin
      .from('inscriptions')
      .select(`
        *,
        etudiants (*),
        promotions (annee)
      `)
      .eq('id', inscriptionId)
      .single()

    if (inscError || !inscription) {
      throw new Error('Inscription non trouvée')
    }

    if (!inscription.etudiants) {
      throw new Error('Étudiant non trouvé pour cette inscription')
    }

    const etudiant = inscription.etudiants

    // Vérifier que l'étudiant a un email
    if (!etudiant.email || etudiant.email.trim() === '') {
      throw new Error('L\'étudiant doit avoir une adresse email pour recevoir ses identifiants de connexion')
    }

    // Générer un mot de passe automatique
    const generatedPassword = generatePassword()
    console.log(`🔑 Mot de passe généré pour ${[etudiant.prenom, etudiant.nom].filter(Boolean).join(' ').trim()}: ${generatedPassword}`)

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(generatedPassword, 10)

    // Vérifier si un compte Utilisateur existe déjà pour cet étudiant
    const { data: existingUser } = await supabaseAdmin
      .from('utilisateurs')
      .select('*')
      .or(`email.eq.${etudiant.email.trim().toLowerCase()},username.eq.${etudiant.matricule.trim()}`)
      .single()

    // Récupérer le rôle ETUDIANT
    const { data: roleEtudiant, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('code', 'ETUDIANT')
      .single()

    if (roleError || !roleEtudiant) {
      throw new Error('Rôle ETUDIANT non trouvé')
    }

    let utilisateur = existingUser

    // Créer ou mettre à jour le compte Utilisateur
    if (utilisateur) {
      // Mettre à jour le mot de passe si le compte existe déjà
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('utilisateurs')
        .update({
          password: hashedPassword,
          email: etudiant.email.trim().toLowerCase(),
          actif: true,
          role_id: roleEtudiant.id
        })
        .eq('id', utilisateur.id)
        .select()
        .single()

      if (updateError) throw updateError
      utilisateur = updatedUser
      console.log('✅ Compte Utilisateur mis à jour pour l\'étudiant:', utilisateur.email)
    } else {
      // Créer un nouveau compte Utilisateur
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('utilisateurs')
        .insert({
          nom: etudiant.nom,
          prenom: (etudiant.prenom != null && String(etudiant.prenom).trim() !== '')
            ? String(etudiant.prenom).trim()
            : '',
          email: etudiant.email.trim().toLowerCase(),
          username: etudiant.matricule.trim().toLowerCase(),
          password: hashedPassword,
          role_id: roleEtudiant.id,
          actif: true,
          photo: etudiant.photo || null,
          telephone: etudiant.telephone || null,
          adresse: etudiant.adresse || null
        })
        .select()
        .single()

      if (createError) throw createError
      utilisateur = newUser
      console.log('✅ Compte Utilisateur créé pour l\'étudiant:', utilisateur.email)
    }

    // Mettre à jour le statut de l'inscription
    const { data: inscriptionUpdated, error: updateInscError } = await supabaseAdmin
      .from('inscriptions')
      .update({
        statut: 'INSCRIT',
        date_validation: new Date().toISOString(),
        agent_valideur_id: agentId
      })
      .eq('id', inscriptionId)
      .select()
      .single()

    if (updateInscError) throw updateInscError

    // Retourner le mot de passe généré pour l'afficher à l'utilisateur
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ INSCRIPTION FINALISÉE AVEC SUCCÈS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📧 Étudiant: ${[etudiant.prenom, etudiant.nom].filter(Boolean).join(' ').trim()}`)
    console.log(`📧 Email: ${etudiant.email}`)
    console.log(`🆔 Matricule: ${etudiant.matricule}`)
    console.log(`🔑 Mot de passe: ${generatedPassword}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💡 IMPORTANT: Notez ces identifiants et communiquez-les à l\'étudiant')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Créer une notification pour informer l'étudiant
    try {
      await notifyInscriptionFinalisee(etudiant.id, etudiant.matricule)
      console.log(`📧 Notification d'inscription envoyée à l'étudiant ${etudiant.matricule}`)
    } catch (notifError) {
      console.error('⚠️ Erreur lors de la création de la notification:', notifError)
      // Ne pas bloquer la finalisation si la notification échoue
    }

    return {
      ...inscriptionUpdated,
      password: generatedPassword,
      etudiantEmail: etudiant.email,
      etudiantMatricule: etudiant.matricule,
      etudiantNom: [etudiant.prenom, etudiant.nom].filter(Boolean).join(' ').trim()
    }
  } catch (error) {
    console.error('Erreur lors de la finalisation de l\'inscription:', error)
    throw error
  }
}

const _fieldBlank = (v) => v == null || String(v).trim() === ''

/** Même règle que l’écran dossier : les 6 pièces présentes sur l’inscription. */
const inscriptionDocumentsComplete = (insc) =>
  !_fieldBlank(insc.copie_acte_naissance) &&
  !_fieldBlank(insc.photo_identite) &&
  !_fieldBlank(insc.quittance) &&
  !_fieldBlank(insc.piece_identite) &&
  !_fieldBlank(insc.copie_releve) &&
  !_fieldBlank(insc.copie_diplome)

const etudiantInfosComplete = (e) =>
  !!(
    e &&
    e.nom &&
    e.date_naissance &&
    e.lieu_naissance &&
    e.nationalite &&
    e.email &&
    e.telephone &&
    e.adresse
  )

const auMoinsUnParentComplet = (parents) =>
  (parents || []).some(
    (p) => p && p.nom && p.prenom && p.telephone
  )

/**
 * Finalise toutes les inscriptions du périmètre dont le dossier est complet au sens « Finaliser »
 * (documents + infos perso + parent), et qui ne sont pas déjà INSCRIT.
 */
export const bulkFinaliserInscriptionsCompletes = async ({
  filiereId,
  niveauId,
  promotionId,
  formationId,
  typeInscription,
  agentId
}) => {
  if (!agentId) {
    throw new Error('Agent (identifiant) requis pour la finalisation')
  }
  if (!filiereId || !niveauId || !promotionId || !formationId) {
    throw new Error('filiereId, niveauId, promotionId et formationId sont requis')
  }

  const typeInsc =
    typeInscription === 'reinscription' ? 'REINSCRIPTION' : 'INSCRIPTION'

  const { data: rows, error: fetchError } = await supabaseAdmin
    .from('inscriptions')
    .select(
      `
      id,
      statut,
      copie_acte_naissance,
      photo_identite,
      quittance,
      piece_identite,
      copie_releve,
      copie_diplome,
      etudiants (
        id,
        nom,
        prenom,
        date_naissance,
        lieu_naissance,
        nationalite,
        email,
        telephone,
        adresse,
        matricule,
        photo,
        parents ( nom, prenom, telephone, type )
      )
    `
    )
    .eq('filiere_id', filiereId)
    .eq('niveau_id', niveauId)
    .eq('promotion_id', promotionId)
    .eq('formation_id', formationId)
    .eq('type_inscription', typeInsc)

  if (fetchError) throw fetchError

  let finalized = 0
  let alreadyInscrit = 0
  let skippedIncomplete = 0
  const errors = []

  for (const insc of rows || []) {
    if (insc.statut === 'INSCRIT') {
      alreadyInscrit++
      continue
    }

    const etu = Array.isArray(insc.etudiants) ? insc.etudiants[0] : insc.etudiants
    if (!etu?.id) {
      skippedIncomplete++
      continue
    }

    if (!inscriptionDocumentsComplete(insc)) {
      skippedIncomplete++
      continue
    }
    if (!etudiantInfosComplete(etu)) {
      skippedIncomplete++
      continue
    }
    if (!auMoinsUnParentComplet(etu.parents)) {
      skippedIncomplete++
      continue
    }

    try {
      await finaliserInscription(insc.id, agentId)
      finalized++
    } catch (err) {
      errors.push({
        inscriptionId: insc.id,
        matricule: etu.matricule,
        message: err.message || 'Erreur inconnue'
      })
    }
  }

  return {
    totalInscriptions: (rows || []).length,
    finalized,
    alreadyInscrit,
    skippedIncomplete,
    errors
  }
}

// Récupérer toutes les promotions
export const getPromotions = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('promotions')
      .select('*')
      .order('annee', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erreur lors de la récupération des promotions:', error)
    throw error
  }
}
