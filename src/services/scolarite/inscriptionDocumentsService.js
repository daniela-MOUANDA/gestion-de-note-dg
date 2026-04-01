import { supabaseAdmin } from '../../lib/supabase.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Dossier d'upload des documents d'inscription
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'inscriptions')

// S'assurer que le dossier existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// Sauvegarder un fichier uploadé
export const saveDocument = async (file, etudiantId, documentType) => {
  try {
    const ext = path.extname(file.originalname)
    const filename = `${etudiantId}-${documentType}-${Date.now()}${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)

    // Écrire le fichier
    fs.writeFileSync(filepath, file.buffer)

    // Retourner l'URL relative
    return `/uploads/inscriptions/${filename}`
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du document:', error)
    throw new Error(`Erreur lors de la sauvegarde du document: ${error.message}`)
  }
}

// Supprimer un ancien document
export const deleteDocument = async (documentUrl) => {
  try {
    if (!documentUrl) return

    const filename = path.basename(documentUrl)
    const filepath = path.join(UPLOAD_DIR, filename)

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error)
  }
}

// Supprimer un document d'inscription
export const deleteInscriptionDocument = async (inscriptionId, documentType, agentId = null, commentaire = 'Supprimé par la scolarité') => {
  try {
    const { data: inscription, error } = await supabaseAdmin
      .from('inscriptions')
      .select('*')
      .eq('id', inscriptionId)
      .single()

    if (error || !inscription) {
      throw new Error('Inscription introuvable')
    }

    // Déterminer quel champ utiliser selon le type de document
    let fieldName = null
    switch (documentType) {
      case 'acteNaissance':
        fieldName = 'copie_acte_naissance'
        break
      case 'photo':
        fieldName = 'photo_identite'
        break
      case 'quittance':
        fieldName = 'quittance'
        break
      case 'pieceIdentite':
        fieldName = 'piece_identite'
        break
      case 'releveBac':
        fieldName = 'copie_releve'
        break
      case 'attestationReussiteBac':
        fieldName = 'copie_diplome'
        break
      default:
        throw new Error(`Type de document inconnu: ${documentType}`)
    }

    const documentUrl = inscription[fieldName]

    // S'il y a un fichier physique, on essaie de le supprimer
    if (documentUrl) {
      await deleteDocument(documentUrl)
    }

    // On marque le document comme REJETE au lieu de simplement mettre à NULL
    // Cela permet à l'étudiant de voir qu'il doit le re-téléverser
    const statusField = `${fieldName}_statut`
    const commentField = `${fieldName}_commentaire`
    const dateField = `${fieldName}_date_validation`

    const updateData = {
      [fieldName]: null,
      [statusField]: 'REJETE',
      [commentField]: commentaire,
      [dateField]: new Date().toISOString()
    }

    // Si l'inscription était déjà finalisée, on la repasse en statut 'VALIDE'
    // pour permettre de nouveau les modifications si nécessaire.
    if (inscription.statut === 'INSCRIT') {
      updateData.statut = 'VALIDE'
    }

    if (agentId) {
      updateData.agent_valideur_id = agentId
    }

    const { error: updateError } = await supabaseAdmin
      .from('inscriptions')
      .update(updateData)
      .eq('id', inscriptionId)

    if (updateError) {
      // Si les colonnes de statut n'existent pas encore (migration non faite), on met juste à NULL
      const { error: fallbackError } = await supabaseAdmin
        .from('inscriptions')
        .update({ [fieldName]: null })
        .eq('id', inscriptionId)

      if (fallbackError) throw fallbackError
    }

    return { success: true, message: 'Document supprimé et marqué comme rejeté' }
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error)
    throw error
  }
}

// Mettre à jour un document dans l'inscription
export const updateInscriptionDocument = async (inscriptionId, documentType, documentUrl) => {
  try {
    const updateData = {}

    switch (documentType) {
      case 'acteNaissance':
        updateData.copie_acte_naissance = documentUrl
        break
      case 'photo':
        updateData.photo_identite = documentUrl
        break
      case 'quittance':
        updateData.quittance = documentUrl
        break
      case 'pieceIdentite':
        updateData.piece_identite = documentUrl
        break
      case 'releveBac':
        updateData.copie_releve = documentUrl
        break
      case 'attestationReussiteBac':
        updateData.copie_diplome = documentUrl
        break
      case 'diplome':
        updateData.copie_diplome = documentUrl
        break
      default:
        throw new Error(`Type de document inconnu: ${documentType}`)
    }

    const { data: inscription, error: fetchError } = await supabaseAdmin
      .from('inscriptions')
      .select('*')
      .eq('id', inscriptionId)
      .single()

    if (fetchError || !inscription) {
      throw new Error('Inscription introuvable')
    }

    // Supprimer l'ancien document si il existe
    const fieldName = Object.keys(updateData)[0]
    const oldDocumentUrl = inscription[fieldName]
    if (oldDocumentUrl) {
      await deleteDocument(oldDocumentUrl)
    }

    // Si on upload la photo d'identité, synchroniser avec la photo de profil de l'étudiant
    if (documentType === 'photo' && documentUrl) {
      await supabaseAdmin
        .from('etudiants')
        .update({ photo: documentUrl })
        .eq('id', inscription.etudiant_id)
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('inscriptions')
      .update(updateData)
      .eq('id', inscriptionId)
      .select()
      .single()

    if (updateError) throw updateError

    return updated
  } catch (error) {
    console.error('Erreur lors de la mise à jour du document:', error)
    throw error
  }
}

// Mettre à jour les informations de l'étudiant
export const updateEtudiantInfo = async (etudiantId, data) => {
  try {
    const updateData = {}

    if (data.nom !== undefined) updateData.nom = data.nom
    if (data.prenom !== undefined) updateData.prenom = data.prenom
    if (data.email !== undefined) updateData.email = data.email
    if (data.telephone !== undefined) updateData.telephone = data.telephone
    if (data.adresse !== undefined) updateData.adresse = data.adresse
    if (data.nationalite !== undefined) updateData.nationalite = data.nationalite

    // Mettre à jour la photo de profil si fournie
    if (data.photo !== undefined) {
      const { data: etudiant } = await supabaseAdmin
        .from('etudiants')
        .select('photo')
        .eq('id', etudiantId)
        .single()

      if (etudiant && etudiant.photo) {
        await deleteDocument(etudiant.photo)
      }

      updateData.photo = data.photo
    }

    const { data: updated, error } = await supabaseAdmin
      .from('etudiants')
      .update(updateData)
      .eq('id', etudiantId)
      .select()
      .single()

    if (error) throw error

    return updated
  } catch (error) {
    console.error('Erreur lors de la mise à jour des informations étudiant:', error)
    throw error
  }
}

// Récupérer ou créer un parent
export const upsertParent = async (etudiantId, parentData) => {
  try {
    const { data: existing } = await supabaseAdmin
      .from('parents')
      .select('*')
      .eq('etudiant_id', etudiantId)
      .eq('type', parentData.type)
      .single()

    if (existing) {
      const { data: updated, error } = await supabaseAdmin
        .from('parents')
        .update({
          nom: parentData.nom,
          prenom: parentData.prenom,
          telephone: parentData.telephone || null,
          email: parentData.email || null,
          profession: parentData.profession || null,
          adresse: parentData.adresse || null
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return updated
    } else {
      const { data: created, error } = await supabaseAdmin
        .from('parents')
        .insert({
          etudiant_id: etudiantId,
          type: parentData.type,
          nom: parentData.nom,
          prenom: parentData.prenom,
          telephone: parentData.telephone || null,
          email: parentData.email || null,
          profession: parentData.profession || null,
          adresse: parentData.adresse || null
        })
        .select()
        .single()

      if (error) throw error
      return created
    }
  } catch (error) {
    console.error('Erreur lors de la création/mise à jour du parent:', error)
    throw error
  }
}

// Récupérer les parents d'un étudiant
export const getParents = async (etudiantId) => {
  try {
    const { data: parents, error } = await supabaseAdmin
      .from('parents')
      .select('*')
      .eq('etudiant_id', etudiantId)
      .order('type', { ascending: true })

    if (error) throw error
    return parents || []
  } catch (error) {
    console.error('Erreur lors de la récupération des parents:', error)
    throw error
  }
}

// Récupérer le dossier complet d'un étudiant
export const getDossierEtudiant = async (etudiantId, inscriptionId) => {
  try {
    const { data: etudiant, error: etudError } = await supabaseAdmin
      .from('etudiants')
      .select(`
        *,
        parents (*),
        inscriptions (
          *,
          promotions (*),
          formations (*),
          filieres (*),
          niveaux (*),
          classes (*)
        )
      `)
      .eq('id', etudiantId)
      .single()

    if (etudError || !etudiant) {
      throw new Error('Étudiant introuvable')
    }

    const inscription = (etudiant.inscriptions || []).find(i => i.id === inscriptionId)

    if (!inscription) {
      throw new Error(`Aucune inscription trouvée pour l'étudiant ${etudiantId} avec l'ID d'inscription ${inscriptionId}`)
    }

    // Synchroniser la photo
    let photoProfil = etudiant.photo
    if (!photoProfil && inscription.photo_identite) {
      photoProfil = inscription.photo_identite
      await supabaseAdmin
        .from('etudiants')
        .update({ photo: inscription.photo_identite })
        .eq('id', etudiantId)
    } else if (photoProfil && !inscription.photo_identite) {
      await supabaseAdmin
        .from('inscriptions')
        .update({ photo_identite: photoProfil })
        .eq('id', inscriptionId)
    }

    return {
      etudiant: {
        id: etudiant.id,
        matricule: etudiant.matricule,
        nom: etudiant.nom,
        prenom: etudiant.prenom,
        dateNaissance: etudiant.date_naissance,
        lieuNaissance: etudiant.lieu_naissance,
        nationalite: etudiant.nationalite,
        email: etudiant.email,
        telephone: etudiant.telephone,
        adresse: etudiant.adresse,
        photo: photoProfil || etudiant.photo
      },
      inscription: {
        id: inscription.id,
        statut: inscription.statut,
        typeInscription: inscription.type_inscription,
        dateInscription: inscription.date_inscription,
        dateValidation: inscription.date_validation,
        documents: {
          acteNaissance: inscription.copie_acte_naissance,
          photo: inscription.photo_identite || photoProfil,
          quittance: inscription.quittance,
          pieceIdentite: inscription.piece_identite,
          releveBac: inscription.copie_releve,
          attestationReussiteBac: inscription.copie_diplome,
          diplome: inscription.copie_diplome
        },
        promotion: inscription.promotions,
        formation: inscription.formations,
        filiere: inscription.filieres,
        niveau: inscription.niveaux,
        classe: inscription.classes
      },
      parents: etudiant.parents || []
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du dossier:', error)
    throw error
  }
}

const PLACEHOLDER_STUB_SUBDIR = '_stubs'
const PLACEHOLDER_PDF_FILE = 'document-modele-scolarite.pdf'
const PLACEHOLDER_IMG_FILE = 'photo-modele-scolarite.png'

const isBlank = (v) => v == null || String(v).trim() === ''

const slugifyEmailPart = (str) => {
  const s = String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
  return s || 'x'
}

const buildStubEmail = (prenom, nom, matricule, etudiantId) => {
  const p = slugifyEmailPart(prenom)
  const n = slugifyEmailPart(nom)
  const m =
    String(matricule || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() ||
    String(etudiantId || '').replace(/-/g, '')
  const local =
    `${p}.${n}.${m}`.replace(/\.+/g, '.').replace(/^\.|\.$/g, '') || `etu${m}`
  return `${local}@stub.inptic.local`.slice(0, 255)
}

const buildStubPhone = (matricule, etudiantId) => {
  const digits =
    String(matricule || '').replace(/\D/g, '').slice(-6).padStart(4, '0') ||
    String(etudiantId || '').replace(/\D/g, '').slice(-6).padStart(4, '0')
  return `+241770${digits}`.slice(0, 20)
}

async function patchEtudiantStubs (et) {
  const patch = {}
  if (isBlank(et.email)) {
    let email = buildStubEmail(et.prenom, et.nom, et.matricule, et.id)
    const { data: clash } = await supabaseAdmin
      .from('etudiants')
      .select('id')
      .eq('email', email)
      .neq('id', et.id)
      .maybeSingle()
    if (clash) {
      const suffix = String(et.id).replace(/-/g, '').slice(0, 12)
      email = `etu.${suffix}@stub.inptic.local`.slice(0, 255)
    }
    patch.email = email
  }
  if (isBlank(et.telephone)) {
    patch.telephone = buildStubPhone(et.matricule, et.id)
  }
  if (isBlank(et.adresse)) patch.adresse = 'À compléter'
  if (et.date_naissance == null || String(et.date_naissance).trim() === '') {
    patch.date_naissance = '2000-01-01'
  }
  if (isBlank(et.lieu_naissance)) patch.lieu_naissance = 'À compléter'
  if (isBlank(et.nationalite)) patch.nationalite = 'Gabonaise'

  if (Object.keys(patch).length === 0) return false

  const { error } = await supabaseAdmin
    .from('etudiants')
    .update(patch)
    .eq('id', et.id)

  if (error) throw error
  return true
}

async function ensureParentTuteurStub (et) {
  const { data: parentsList, error: pErr } = await supabaseAdmin
    .from('parents')
    .select('nom, prenom, telephone')
    .eq('etudiant_id', et.id)

  if (pErr) throw pErr

  const hasComplete = (parentsList || []).some(
    (p) => !isBlank(p.nom) && !isBlank(p.prenom) && !isBlank(p.telephone)
  )
  if (hasComplete) return false

  const slugP = slugifyEmailPart(et.prenom)
  const slugN = slugifyEmailPart(et.nom)
  const pPrenom = 'Parent'
  const pNom = `parent${slugP}${slugN}`.slice(0, 100)
  const telephone = buildStubPhone(et.matricule, et.id)

  const { data: existingTuteur } = await supabaseAdmin
    .from('parents')
    .select('id')
    .eq('etudiant_id', et.id)
    .eq('type', 'TUTEUR')
    .maybeSingle()

  const payload = {
    nom: pNom,
    prenom: pPrenom,
    telephone,
    email: null,
    profession: null,
    adresse: null
  }

  if (existingTuteur?.id) {
    const { error } = await supabaseAdmin
      .from('parents')
      .update(payload)
      .eq('id', existingTuteur.id)

    if (error) throw error
  } else {
    const { error } = await supabaseAdmin.from('parents').insert({
      etudiant_id: et.id,
      type: 'TUTEUR',
      ...payload
    })

    if (error) throw error
  }

  return true
}

export function getPlaceholderDocumentUrls() {
  return {
    pdf: `/uploads/inscriptions/${PLACEHOLDER_STUB_SUBDIR}/${PLACEHOLDER_PDF_FILE}`,
    image: `/uploads/inscriptions/${PLACEHOLDER_STUB_SUBDIR}/${PLACEHOLDER_IMG_FILE}`
  }
}

/** Crée sur disque des fichiers modèles minuscules (PDF + PNG) réutilisés pour combler les pièces manquantes. */
export function ensurePlaceholderStubFiles() {
  const stubDir = path.join(UPLOAD_DIR, PLACEHOLDER_STUB_SUBDIR)
  if (!fs.existsSync(stubDir)) {
    fs.mkdirSync(stubDir, { recursive: true })
  }

  const pdfPath = path.join(stubDir, PLACEHOLDER_PDF_FILE)
  if (!fs.existsSync(pdfPath)) {
    const minimalPdf = `%PDF-1.1
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 200 200]/Parent 2 0 R>>endobj
trailer<</Size 4/Root 1 0 R>>
%%EOF
`
    fs.writeFileSync(pdfPath, minimalPdf, 'utf8')
  }

  const imgPath = path.join(stubDir, PLACEHOLDER_IMG_FILE)
  if (!fs.existsSync(imgPath)) {
    const png1x1 = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    )
    fs.writeFileSync(imgPath, png1x1)
  }
}

/**
 * Remplit les URL des documents manquants, les champs étudiant vides (e-mail dérivé prénom+nom+matricule, etc.)
 * et un parent TUTEUR factice si aucun parent complet — même périmètre que la liste « candidats ».
 * Ne remplace pas les pièces ni les données déjà renseignées.
 */
export async function bulkFillPlaceholderInscriptionDocuments({
  filiereId,
  niveauId,
  promotionId,
  formationId,
  typeInscription
}) {
  if (!filiereId || !niveauId || !promotionId || !formationId) {
    throw new Error('filiereId, niveauId, promotionId et formationId sont requis')
  }

  const typeInsc =
    typeInscription === 'reinscription' ? 'REINSCRIPTION' : 'INSCRIPTION'

  ensurePlaceholderStubFiles()
  const { pdf: pdfUrl, image: imageUrl } = getPlaceholderDocumentUrls()

  const { data: rows, error: fetchError } = await supabaseAdmin
    .from('inscriptions')
    .select(
      `
      id,
      etudiant_id,
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
        matricule,
        email,
        telephone,
        adresse,
        date_naissance,
        lieu_naissance,
        nationalite,
        photo
      )
    `
    )
    .eq('filiere_id', filiereId)
    .eq('niveau_id', niveauId)
    .eq('promotion_id', promotionId)
    .eq('formation_id', formationId)
    .eq('type_inscription', typeInsc)

  if (fetchError) throw fetchError

  let updatedDocs = 0
  let alreadyCompleteDocuments = 0
  let updatedEtudiants = 0
  let updatedParents = 0

  for (const row of rows || []) {
    const etu = Array.isArray(row.etudiants)
      ? row.etudiants[0]
      : row.etudiants
    if (!etu?.id) {
      console.warn('[bulkFill] Inscription sans étudiant lié:', row.id)
      continue
    }

    const patch = {}
    if (isBlank(row.copie_acte_naissance)) patch.copie_acte_naissance = pdfUrl
    if (isBlank(row.photo_identite)) patch.photo_identite = imageUrl
    if (isBlank(row.quittance)) patch.quittance = pdfUrl
    if (isBlank(row.piece_identite)) patch.piece_identite = pdfUrl
    if (isBlank(row.copie_releve)) patch.copie_releve = pdfUrl
    if (isBlank(row.copie_diplome)) patch.copie_diplome = pdfUrl

    if (Object.keys(patch).length === 0) {
      alreadyCompleteDocuments++
    } else {
      const { error: upError } = await supabaseAdmin
        .from('inscriptions')
        .update(patch)
        .eq('id', row.id)

      if (upError) throw upError
      updatedDocs++

      if (patch.photo_identite) {
        const { data: etuPhoto } = await supabaseAdmin
          .from('etudiants')
          .select('photo')
          .eq('id', row.etudiant_id)
          .single()

        if (etuPhoto && isBlank(etuPhoto.photo)) {
          await supabaseAdmin
            .from('etudiants')
            .update({ photo: imageUrl })
            .eq('id', row.etudiant_id)
        }
      }
    }

    if (await patchEtudiantStubs(etu)) updatedEtudiants++
    if (await ensureParentTuteurStub(etu)) updatedParents++
  }

  return {
    totalInscriptions: (rows || []).length,
    updatedInscriptions: updatedDocs,
    alreadyComplete: alreadyCompleteDocuments,
    updatedEtudiants,
    updatedParents
  }
}
