import XLSX from 'xlsx'
import bcrypt from 'bcrypt'
import { supabaseAdmin } from '../../lib/supabase.js'
import { sendStudentCredentials } from '../emailService.js'

// Mapping Excel -> codes filière/options en base
const mapFiliereNameToCode = (filiereName) => {
  const raw = (filiereName || '').trim()
  if (!raw) return 'XX'

  const norm = raw.replace(/\s+/g, ' ').trim()
  const compact = norm.replace(/\s/g, '').toUpperCase()
  const knownCompact = {
    GI: 'GI',
    RT: 'RT',
    TC: 'TC',
    MTIC: 'MTIC',
    AV: 'AV',
    'MMI-WEB-MASTERING': 'MMI-WM',
    'MMI-COMMUNICATION-DIGITALE': 'MMI-CD',
    'MMI-WEBMASTERING': 'MMI-WM',
    'MMI-COMMUNICATIONDIGITALE': 'MMI-CD',
    'MMI-WM': 'MMI-WM',
    'MMI-CD': 'MMI-CD',
    'MMI-ED': 'MMI-CD',
    'MTIC-EMCD': 'MTIC-EMCD',
    'MTIC-TC': 'MTIC-TC',
    'GI-DAR': 'GI-DAR',
    'GI-ASDB': 'GI-ASDB',
    'RT-RT': 'RT-RT',
    'RT-AZUR': 'RT-AZUR'
  }
  if (knownCompact[compact]) return knownCompact[compact]

  const name = norm.toLowerCase()

  if (name.includes('web mastering') || name.includes('webmastering') || name.includes('mmi-wm') ||
    name.includes('mmi-web')) {
    return 'MMI-WM'
  }
  if (
    name.includes('communication digitale') ||
    name.includes('comm digital') ||
    name.includes('mmi-cd') ||
    name.includes('mmi-ed') ||
    name.match(/mmi\s*[-–]\s*(communication|ecommerce)/)
  ) {
    return 'MMI-CD'
  }

  if (name.includes('emarketing') || name.includes('e-marketing') || name.includes('mtic-emcd')) {
    return 'MTIC-EMCD'
  }
  if (name.includes('mtic-tc') || (name.includes('mtic') && name.includes('technico'))) {
    return 'MTIC-TC'
  }
  if (name.includes('dar') || name.includes('application repart')) {
    return 'GI-DAR'
  }
  if (name.includes('asdb') || name.includes('bases de donnees')) {
    return 'GI-ASDB'
  }
  if (name.includes('azur') || name.includes('rt-azur')) {
    return 'RT-AZUR'
  }

  // Génie Informatique
  if (name.includes('génie info') || name.includes('genie info') ||
    name.includes('génie informatique') || name.includes('genie informatique') ||
    (name.includes('gi') && name.length <= 12)) {
    return 'GI'
  }

  // Réseaux et Télécoms
  if (name.includes('réseaux') || name.includes('reseau') ||
    name.includes('télécom') || name.includes('telecom') ||
    name.includes('réseau et télécom') || name.includes('reseau et telecom')) {
    return 'RT'
  }

  if ((name.includes('technico') || name.includes('technicaux')) && name.includes('commercial')) {
    return 'TC'
  }

  if (name.includes('audiovisuel') || /^av\b/.test(name)) {
    return 'AV'
  }

  // « MMI » ou multimédia sans option : refusé à l’import (voir boucle importEtudiants)
  if (name === 'mmi' || (name.includes('mmi') && !name.includes('web') && !name.includes('master') &&
    !name.includes('ecom') && !name.includes('commerce') && !name.includes('communication')) ||
    (name.includes('multimédia') || name.includes('multimedia'))) {
    return 'MMI'
  }

  if (name.includes('management') || name.includes('mtic') ||
    (name.includes('techniques') && name.includes('information'))) {
    return 'MTIC'
  }

  return norm.substring(0, 2).toUpperCase()
}

// Parser la date de naissance depuis le format "Le DD/MM/YYYY à [Lieu]"
const parseDateNaissance = (dateString) => {
  if (!dateString) return { date: null, lieu: null }

  try {
    // Format: "Le 24/12/2001 à Moanda" ou "24/12/2001 à Libreville"
    const cleaned = dateString.trim()
    const dateMatch = cleaned.match(/(\d{2})\/(\d{2})\/(\d{4})/)

    if (dateMatch) {
      const [, day, month, year] = dateMatch
      const date = new Date(`${year}-${month}-${day}`)

      // Extraire le lieu (après "à")
      const lieuMatch = cleaned.match(/à\s+(.+)$/i)
      const lieu = lieuMatch ? lieuMatch[1].trim() : null

      return { date, lieu }
    }
  } catch (error) {
    console.error('Erreur lors du parsing de la date:', error)
  }

  return { date: null, lieu: null }
}

/** Libellé d'en-tête Excel normalisé (accents retirés, minuscules) pour matcher Nom / Prénom etc. */
const normalizeHeaderLabel = (h) =>
  String(h ?? '')
    .trim()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()

// Générer un matricule unique au format: {anneeFin}{3chiffres}
export const generateMatricule = async (anneeAcademique) => {
  let anneeFin
  if (anneeAcademique.includes('-')) {
    const anneeFinComplete = anneeAcademique.split('-')[1]
    anneeFin = anneeFinComplete.length >= 2
      ? anneeFinComplete.slice(-2)
      : anneeFinComplete
  } else {
    const anneeDebut = parseInt(anneeAcademique.substring(0, 4))
    const anneeFinComplete = String(anneeDebut + 1)
    anneeFin = anneeFinComplete.slice(-2)
  }

  let matricule
  let exists = true
  let attempts = 0
  const maxAttempts = 100

  while (exists && attempts < maxAttempts) {
    const randomNum = Math.floor(Math.random() * 999) + 1
    const troisChiffres = String(randomNum).padStart(3, '0')
    matricule = `${anneeFin}${troisChiffres}`

    const { data: existing } = await supabaseAdmin
      .from('etudiants')
      .select('id')
      .eq('matricule', matricule)
      .single()

    exists = existing !== null
    attempts++
  }

  if (attempts >= maxAttempts) {
    throw new Error('Impossible de générer un matricule unique après plusieurs tentatives')
  }

  return matricule
}

// Générer un mot de passe aléatoire sécurisé
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  // Assurer au moins 8 caractères
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Résout la filière d'inscription finale selon le niveau et l'option choisie.
// - L1/L2: filière parent (tronc commun)
// - L3 avec options: option obligatoire (filière enfant)
const resolveInscriptionFiliere = async ({ filiereId, niveauCode, optionFiliereId = null }) => {
  const { data: filiere, error: filiereError } = await supabaseAdmin
    .from('filieres')
    .select('*')
    .eq('id', filiereId)
    .single()

  if (filiereError || !filiere) {
    throw new Error('Filière introuvable')
  }

  // Si l'utilisateur a déjà choisi une option en tant que filière principale, on remonte au parent pour appliquer la règle L3.
  const parentFiliereId = filiere.parent_filiere_id || filiere.id
  let parentFiliere = filiere
  if (filiere.parent_filiere_id) {
    const { data: parent, error: parentError } = await supabaseAdmin
      .from('filieres')
      .select('*')
      .eq('id', filiere.parent_filiere_id)
      .single()
    if (parentError || !parent) {
      throw new Error('Filière parent introuvable')
    }
    parentFiliere = parent
  }

  const { data: options } = await supabaseAdmin
    .from('filieres')
    .select('id, code, nom')
    .eq('parent_filiere_id', parentFiliereId)

  const hasOptions = Array.isArray(options) && options.length > 0
  const isL3 = String(niveauCode || '').toUpperCase() === 'L3'

  if (isL3 && hasOptions) {
    // Cas import Excel: la feuille peut déjà correspondre à une option (ex: GI-DAR).
    if (!optionFiliereId && filiere.parent_filiere_id) {
      const selectedAsOption = (options || []).find(o => o.id === filiere.id)
      if (selectedAsOption) {
        return { filiereFinaleId: selectedAsOption.id, filiereParent: parentFiliere, hasOptions }
      }
    }
    if (!optionFiliereId) {
      throw new Error(`En L3, l'option est obligatoire pour la filière ${parentFiliere.code || parentFiliere.nom}.`)
    }
    const option = (options || []).find(o => o.id === optionFiliereId)
    if (!option) {
      throw new Error('Option L3 invalide pour la filière sélectionnée.')
    }
    return { filiereFinaleId: option.id, filiereParent: parentFiliere, hasOptions }
  }

  if (!isL3 && optionFiliereId) {
    throw new Error('Une option ne peut être sélectionnée qu’en L3.')
  }

  return { filiereFinaleId: parentFiliereId, filiereParent: parentFiliere, hasOptions }
}

// Créer un étudiant manuellement avec son inscription
export const creerEtudiantManuel = async (data, agentId) => {
  try {
    const {
      matricule: matriculeFourni,
      nom,
      prenom,
      dateNaissance,
      lieuNaissance,
      nationalite,
      sexe,
      email,
      telephone,
      adresse,
      promotionId,
      formationId,
      filiereId,
      optionFiliereId,
      niveauId,
      classeId,
      typeInscription,
      anneeAcademique
    } = data

    // Validation des champs obligatoires
    if (!nom || !prenom) {
      throw new Error('Le nom et le prénom sont obligatoires')
    }

    if (!promotionId || !formationId || !filiereId || !niveauId) {
      throw new Error('Tous les champs d\'inscription sont obligatoires')
    }

    const { data: niveau } = await supabaseAdmin
      .from('niveaux')
      .select('*')
      .eq('id', niveauId)
      .single()

    if (!niveau) {
      throw new Error('Niveau introuvable')
    }

    const { filiereFinaleId } = await resolveInscriptionFiliere({
      filiereId,
      niveauCode: niveau.code,
      optionFiliereId
    })

    // Pour la création manuelle, on ne crée pas de classe automatiquement
    // L'étudiant sera affecté à une classe via la répartition des classes
    // On laisse donc classe_id à null

    // Générer ou utiliser le matricule fourni
    let matricule = matriculeFourni
    if (!matricule || matricule.trim() === '') {
      // Formater l'année académique
      let anneeFormatee = anneeAcademique
      if (!anneeFormatee) {
        // Récupérer l'année de la promotion
        const { data: promotion } = await supabaseAdmin
          .from('promotions')
          .select('annee')
          .eq('id', promotionId)
          .single()
        if (promotion) {
          anneeFormatee = promotion.annee
        } else {
          anneeFormatee = new Date().getFullYear().toString()
        }
      }
      matricule = await generateMatricule(anneeFormatee)
    } else {
      // Vérifier que le matricule n'existe pas déjà
      const { data: existing } = await supabaseAdmin
        .from('etudiants')
        .select('id')
        .eq('matricule', matricule)
        .single()

      if (existing) {
        throw new Error(`Le matricule ${matricule} existe déjà`)
      }
    }

    // Vérifier si l'étudiant existe déjà (par nom et prénom)
    const { data: etudiantExistant } = await supabaseAdmin
      .from('etudiants')
      .select('id')
      .eq('nom', nom.trim())
      .eq('prenom', prenom.trim())
      .single()

    if (etudiantExistant) {
      throw new Error(`Un étudiant avec le nom ${nom} ${prenom} existe déjà`)
    }

    // Vérifier l'email unique si fourni
    if (email && email.trim() !== '') {
      const { data: emailExistant } = await supabaseAdmin
        .from('etudiants')
        .select('id')
        .eq('email', email.trim())
        .single()

      if (emailExistant) {
        throw new Error(`L'email ${email} est déjà utilisé`)
      }
    }

    // Convertir la date de naissance
    let dateNaissanceFormatee = null
    if (dateNaissance) {
      dateNaissanceFormatee = new Date(dateNaissance).toISOString()
    }

    // Créer l'étudiant
    const { data: etudiant, error: etudError } = await supabaseAdmin
      .from('etudiants')
      .insert({
        matricule,
        nom: nom.trim(),
        prenom: prenom.trim(),
        date_naissance: dateNaissanceFormatee,
        lieu_naissance: lieuNaissance?.trim() || null,
        nationalite: nationalite?.trim() || null,
        sexe: sexe || null,
        email: email?.trim() || null,
        telephone: telephone?.trim() || null,
        adresse: adresse?.trim() || null,
        photo: null
      })
      .select()
      .single()

    if (etudError) {
      throw new Error(`Erreur lors de la création de l'étudiant: ${etudError.message}`)
    }

    // Créer l'inscription sans classe assignée (classe_id = null)
    // L'étudiant pourra être affecté à une classe via la répartition des classes
    // Le statut est EN_ATTENTE car l'étudiant n'est pas encore finalement inscrit
    const { data: inscription, error: inscError } = await supabaseAdmin
      .from('inscriptions')
      .insert({
        etudiant_id: etudiant.id,
        promotion_id: promotionId,
        formation_id: formationId,
        filiere_id: filiereFinaleId,
        niveau_id: niveauId,
        classe_id: null, // Pas de classe assignée automatiquement
        type_inscription: typeInscription || 'INSCRIPTION',
        statut: 'EN_ATTENTE', // Statut EN_ATTENTE car l'inscription n'est pas encore finalisée
        agent_valideur_id: agentId || null
      })
      .select()
      .single()

    if (inscError) {
      // Supprimer l'étudiant créé en cas d'erreur
      await supabaseAdmin
        .from('etudiants')
        .delete()
        .eq('id', etudiant.id)

      throw new Error(`Erreur lors de la création de l'inscription: ${inscError.message}`)
    }

    // Pas besoin de mettre à jour l'effectif de la classe car classe_id est null

    // --- CRÉATION DU COMPTE UTILISATEUR ET ENVOI EMAIL ---
    try {
      // 1. Générer un mot de passe
      const password = generateRandomPassword()

      // 2. Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10)

      // 3. Récupérer le rôle ETUDIANT
      const { data: roleEtudiant } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('code', 'ETUDIANT')
        .single()

      if (roleEtudiant) {
        // 4. Créer le compte utilisateur
        // Générer un username unique (matricule par défaut)
        let username = matricule
        const { data: existingUser } = await supabaseAdmin.from('utilisateurs').select('id').eq('username', username).single()
        if (existingUser) username = `${matricule}_${Date.now().toString().slice(-4)}`

        const { data: newUser, error: userError } = await supabaseAdmin
          .from('utilisateurs')
          .insert({
            nom: nom.trim(),
            prenom: prenom.trim(),
            email: email?.trim() || `${matricule}@etudiant.inptic.ga`,
            username: username,
            password: hashedPassword,
            role_id: roleEtudiant.id,
            actif: true,
            photo: null,
            telephone: telephone?.trim() || null,
            adresse: adresse?.trim() || null
          })
          .select()
          .single()

        if (newUser && !userError) {
          console.log(`✅ Compte utilisateur créé pour ${nom} ${prenom} (${matricule})`)

          // 5. Envoyer l'email de bienvenue avec les identifiants
          if (email && email.trim() !== '') {
            // Envoyer de manière asynchrone sans bloquer
            sendStudentCredentials({ nom: nom.trim(), prenom: prenom.trim(), email: email.trim() }, password, matricule)
              .then(res => {
                if (res.success) console.log(`📧 Email envoyé à ${email}`)
                else console.error(`❌ Échec envoi email à ${email}:`, res.error)
              })
              .catch(err => console.error(`❌ Erreur envoi email:`, err))
          }
        } else {
          console.error("Erreur création compte utilisateur:", userError)
        }
      }
    } catch (authError) {
      console.error("Erreur lors de la création du compte utilisateur:", authError)
      // Ne pas échouer la création de l'étudiant si le compte utilisateur échoue
    }

    return {
      success: true,
      etudiant,
      inscription,
      message: `Étudiant ${nom} ${prenom} créé avec succès et informations de connexion envoyées par email`
    }
  } catch (error) {
    console.error('Erreur lors de la création manuelle de l\'étudiant:', error)
    throw error
  }
}

// Parser un fichier Excel et extraire les données par feuille
export const parseExcelFile = async (fileBuffer) => {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
    const result = {}

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

      if (data.length < 2) {
        return
      }

      const headers = data[0].map(h => String(h).trim())
      const hNorm = headers.map(normalizeHeaderLabel)

      const colIndices = {
        numero: hNorm.findIndex(
          (h) => h.includes('numero') || h.includes('n°') || h.includes('nº')
        ),
        nom: hNorm.findIndex((h) => h.includes('nom') && !h.includes('prenom')),
        prenom: hNorm.findIndex((h) => h.includes('prenom')),
        // Champ unique ancien format : "Date et lieu de naissance"
        dateNaissanceCombine: hNorm.findIndex((h) => h.includes('date') && h.includes('lieu')),
        // Nouveaux champs séparés
        dateNaissance: hNorm.findIndex(
          (h) => h.includes('date') && h.includes('naissance') && !h.includes('lieu')
        ),
        lieuNaissance: hNorm.findIndex(
          (h) => h.includes('lieu') && h.includes('naissance') && !h.includes('date')
        ),
        nationalite: hNorm.findIndex((h) => h.includes('nationalit')),
        serieBac: hNorm.findIndex(
          (h) =>
            (h.includes('serie') && h.includes('bac')) ||
            h.includes('serie du bac') ||
            (h.includes('bac') && h.includes('serie'))
        ),
        anneeObtention: hNorm.findIndex(
          (h) => h.includes('annee') && h.includes('obtention')
        ),
        sexe: hNorm.findIndex((h) => h.includes('sexe')),
        email: hNorm.findIndex((h) => h.includes('email') || h.includes('e-mail') || h.includes('courriel')),
        telephone: hNorm.findIndex(
          (h) => h.includes('tel') || h.includes('telephone') || h.includes('phone') || h.includes('portable')
        ),
        adresse: hNorm.findIndex((h) => h.includes('adresse'))
      }

      if (colIndices.nom < 0 || colIndices.prenom < 0) {
        console.warn(
          `Import Excel : feuille « ${sheetName} » ignorée (colonnes « Nom » et « Prénom » obligatoires, introuvables dans la première ligne).`
        )
        return
      }

      const etudiants = []
      for (let i = 1; i < data.length; i++) {
        const row = data[i]

        if (!row || row.every(cell => !cell || String(cell).trim() === '')) {
          continue
        }

        const nom = colIndices.nom >= 0 ? String(row[colIndices.nom] || '').trim() : ''
        const prenom = colIndices.prenom >= 0 ? String(row[colIndices.prenom] || '').trim() : ''

        if (!nom || !prenom) {
          continue
        }


        // Gestion Date + Lieu de naissance (ancien format combiné OU nouveaux champs séparés)
        let date = null
        let lieu = null
        if (colIndices.dateNaissanceCombine >= 0) {
          // Ancien format : "Le 24/12/2001 à Moanda"
          const raw = colIndices.dateNaissanceCombine >= 0 ? String(row[colIndices.dateNaissanceCombine] || '').trim() : ''
          const parsed = parseDateNaissance(raw)
          date = parsed.date
          lieu = parsed.lieu
        } else {
          // Nouveau format : deux colonnes séparées
          if (colIndices.dateNaissance >= 0) {
            const rawDate = String(row[colIndices.dateNaissance] || '').trim()
            // Supporter DD/MM/YYYY ou YYYY-MM-DD ou date Excel numérique
            const matchDMY = rawDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
            const matchYMD = rawDate.match(/(\d{4})-(\d{2})-(\d{2})/)
            if (matchDMY) {
              const [, d, m, y] = matchDMY
              date = new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`)
            } else if (matchYMD) {
              date = new Date(rawDate)
            } else if (!isNaN(Number(rawDate)) && rawDate !== '') {
              // Numéro série Excel
              date = new Date(Math.round((Number(rawDate) - 25569) * 86400 * 1000))
            }
          }
          if (colIndices.lieuNaissance >= 0) {
            lieu = String(row[colIndices.lieuNaissance] || '').trim() || null
          }
        }

        const nationalite = colIndices.nationalite >= 0 ? String(row[colIndices.nationalite] || '').trim() || null : null
        const serieBac = colIndices.serieBac >= 0 ? String(row[colIndices.serieBac] || '').trim() : null
        const anneeObtention = colIndices.anneeObtention >= 0 ? String(row[colIndices.anneeObtention] || '').trim() : null
        const sexe = colIndices.sexe >= 0 ? String(row[colIndices.sexe] || '').trim().toUpperCase() : null
        const email = colIndices.email >= 0 ? String(row[colIndices.email] || '').trim() || null : null
        const telephone = colIndices.telephone >= 0 ? String(row[colIndices.telephone] || '').trim() || null : null
        const adresse = colIndices.adresse >= 0 ? String(row[colIndices.adresse] || '').trim() || null : null

        etudiants.push({
          nom,
          prenom,
          dateNaissance: date,
          lieuNaissance: lieu,
          nationalite,
          serieBac,
          anneeObtention,
          sexe: sexe === 'M' || sexe === 'F' ? sexe : null,
          email,
          telephone,
          adresse
        })
      }

      if (etudiants.length > 0) {
        result[sheetName] = etudiants
      }
    })

    return result
  } catch (error) {
    console.error('Erreur lors du parsing du fichier Excel:', error)
    throw new Error(`Erreur lors du parsing du fichier Excel: ${error.message}`)
  }
}

// Convertir l'année en format "YYYY-YYYY+1"
const formatAnneeAcademique = (annee) => {
  if (annee.includes('-')) {
    return annee
  }
  const anneeNum = parseInt(annee)
  return `${anneeNum - 1}-${anneeNum}`
}

// Importer les étudiants depuis les données parsées
// options.forcedFiliereId : si défini, toutes les feuilles sont fusionnées et affectées à cette filière (parcours/sous-parcours)
export const importEtudiants = async (dataBySheet, anneeAcademique, agentId, formationId, niveauId, options = {}) => {
  try {
    const { forcedFiliereId } = options
    const anneeFormatee = formatAnneeAcademique(anneeAcademique)

    const results = {
      success: true,
      totalEtudiants: 0,
      etudiantsCrees: 0,
      etudiantsExistant: 0,
      erreurs: [],
      details: {}
    }

    // Récupérer ou créer la promotion
    let { data: promotion } = await supabaseAdmin
      .from('promotions')
      .select('*')
      .eq('annee', anneeFormatee)
      .single()

    if (!promotion) {
      const anneeDebut = parseInt(anneeFormatee.substring(0, 4))
      const { data: newPromo, error } = await supabaseAdmin
        .from('promotions')
        .insert({
          annee: anneeFormatee,
          statut: 'EN_COURS',
          date_debut: new Date(anneeDebut, 8, 1).toISOString()
        })
        .select()
        .single()
      if (error) throw error
      promotion = newPromo
    }

    // Récupérer la formation fournie
    const { data: formation, error: formationError } = await supabaseAdmin
      .from('formations')
      .select('*')
      .eq('id', formationId)
      .single()

    if (formationError || !formation) {
      throw new Error('Formation introuvable. Vérifiez le paramètre de formation.')
    }

    // Récupérer le niveau fourni
    const { data: niveau, error: niveauError } = await supabaseAdmin
      .from('niveaux')
      .select('*')
      .eq('id', niveauId)
      .single()

    if (niveauError || !niveau) {
      throw new Error('Niveau introuvable. Vérifiez le paramètre de niveau.')
    }

    const niveauCodeUpper = String(niveau.code || '').toUpperCase()

    // Récupérer le rôle ETUDIANT pour la création des comptes
    const { data: roleEtudiant } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('code', 'ETUDIANT')
      .single()

    /** @type {{ sheetLabel: string, etudiants: any[], filierePref?: any }[]} */
    let sheetJobs = []

    if (forcedFiliereId) {
      const { data: forcedFiliere, error: ffError } = await supabaseAdmin
        .from('filieres')
        .select('*')
        .eq('id', forcedFiliereId)
        .single()

      if (ffError || !forcedFiliere) {
        throw new Error('Filière sélectionnée introuvable.')
      }
      if (forcedFiliere.type_filiere === 'groupe') {
        throw new Error(
          'Choisissez un parcours précis (MMI-Web Mastering, MMI-Ecommerce Digital, TC, etc.), pas un regroupement.'
        )
      }

      const merged = []
      for (const etus of Object.values(dataBySheet)) {
        merged.push(...etus)
      }
      if (merged.length === 0) {
        throw new Error('Aucune ligne étudiant valide dans le fichier (vérifiez les en-têtes et les feuilles).')
      }

      sheetJobs = [{
        sheetLabel: `${forcedFiliere.code} — ${forcedFiliere.nom} (filière imposée, toutes feuilles)`,
        etudiants: merged,
        filierePref: forcedFiliere
      }]
    } else {
      sheetJobs = Object.entries(dataBySheet).map(([sheetName, etudiants]) => ({
        sheetLabel: sheetName.trim(),
        etudiants,
        filierePref: null
      }))
    }

    // Traiter chaque feuille (filière) ou le lot unique en mode filière imposée
    for (const { sheetLabel, etudiants, filierePref } of sheetJobs) {
      const filiereName = sheetLabel

      let filiere = filierePref

      if (!filiere) {
        const filiereCode = mapFiliereNameToCode(filiereName)

        // En L3, « MMI » seul est ambigu (il faut une option). En L1/L2, tronc commun = feuille « MMI » OK.
        if (filiereCode === 'MMI' && niveauCodeUpper === 'L3') {
          const msg =
            `Feuille « ${filiereName} » : en L3, précisez l'option dans le nom de l'onglet (ex. codes MMI-WM, MMI-CD ou libellés « Web Mastering », « Communication digitale »). En L1/L2, l'onglet « MMI » reste valable pour le tronc commun.`
          results.details[filiereName] = {
            filiere: filiereName,
            etudiantsCrees: 0,
            etudiantsExistant: 0,
            erreurs: [msg]
          }
          results.erreurs.push(msg)
          continue
        }

        const { data: filFound } = await supabaseAdmin
          .from('filieres')
          .select('*')
          .eq('code', filiereCode)
          .maybeSingle()

        if (filFound) {
          filiere = filFound
        } else {
          const { data: newFil, error } = await supabaseAdmin
            .from('filieres')
            .insert({
              code: filiereCode,
              nom: filiereName
            })
            .select()
            .single()
          if (error) throw error
          filiere = newFil
        }
      }

      if (filiere.type_filiere === 'groupe') {
        const msg =
          `Feuille « ${filiereName} » : « ${filiere.nom} » est un regroupement. Utilisez MMI-Web Mastering / MMI-Ecommerce Digital ou le mode « une filière ».`
        results.details[filiereName] = {
          filiere: filiere.nom,
          etudiantsCrees: 0,
          etudiantsExistant: 0,
          erreurs: [msg]
        }
        results.erreurs.push(msg)
        continue
      }

      let filiereFinaleId
      try {
        const resolved = await resolveInscriptionFiliere({
          filiereId: filiere.id,
          niveauCode: niveau.code
        })
        filiereFinaleId = resolved.filiereFinaleId
      } catch (resolveError) {
        const msg = `Feuille « ${filiereName} » : ${resolveError.message}`
        results.details[filiereName] = {
          filiere: filiere.nom,
          etudiantsCrees: 0,
          etudiantsExistant: 0,
          erreurs: [msg]
        }
        results.erreurs.push(msg)
        continue
      }
      const filiereCode = filiere.code

      let { data: classe } = await supabaseAdmin
        .from('classes')
        .select('*')
        .eq('filiere_id', filiereFinaleId)
        .eq('niveau_id', niveau.id)
        .eq('formation_id', formation.id)
        .maybeSingle()

      if (!classe) {
        const classeCode = `${filiereCode}-${niveau.code}-${formation.code}`
        const { data: newClasse, error } = await supabaseAdmin
          .from('classes')
          .insert({
            code: classeCode,
            nom: `${filiere.nom} - ${niveau.nom}`,
            filiere_id: filiereFinaleId,
            niveau_id: niveau.id,
            formation_id: formation.id,
            effectif: 0
          })
          .select()
          .single()
        if (error) throw error
        classe = newClasse
      }

      const detailsFiliere = {
        filiere: filiere.nom,
        etudiantsCrees: 0,
        etudiantsExistant: 0,
        erreurs: []
      }

      // Créer chaque étudiant
      for (const etudiantData of etudiants) {
        try {
          const matricule = await generateMatricule(anneeFormatee)

          // Vérifier si l'étudiant existe déjà
          const { data: etudiantExistant } = await supabaseAdmin
            .from('etudiants')
            .select('id')
            .eq('nom', etudiantData.nom)
            .eq('prenom', etudiantData.prenom)
            .maybeSingle()

          if (etudiantExistant) {
            detailsFiliere.etudiantsExistant++
            results.etudiantsExistant++
            continue
          }

          // Créer l'étudiant
          const { data: etudiant, error: etudError } = await supabaseAdmin
            .from('etudiants')
            .insert({
              matricule,
              nom: etudiantData.nom,
              prenom: etudiantData.prenom,
              date_naissance: etudiantData.dateNaissance?.toISOString() || null,
              lieu_naissance: etudiantData.lieuNaissance || null,
              nationalite: etudiantData.nationalite || null,
              email: etudiantData.email || null,
              telephone: etudiantData.telephone || null,
              adresse: etudiantData.adresse || null,
              photo: null
            })
            .select()
            .single()

          if (etudError) throw etudError

          // Créer l'inscription
          const { error: inscError } = await supabaseAdmin
            .from('inscriptions')
            .insert({
              etudiant_id: etudiant.id,
              promotion_id: promotion.id,
              formation_id: formation.id,
              filiere_id: filiereFinaleId,
              niveau_id: niveau.id,
              classe_id: classe.id,
              type_inscription: 'INSCRIPTION',
              statut: 'EN_ATTENTE',
              agent_valideur_id: agentId || null
            })

          if (inscError) throw inscError

          // Mettre à jour l'effectif de la classe
          await supabaseAdmin
            .from('classes')
            .update({ effectif: classe.effectif + 1 })
            .eq('id', classe.id)

          classe.effectif++

          detailsFiliere.etudiantsCrees++
          results.etudiantsCrees++
          results.totalEtudiants++

          // --- CRÉATION DU COMPTE UTILISATEUR AUTOMATIQUE ---
          if (roleEtudiant) {
            try {
              // 1. Générer et hasher le mot de passe
              const password = generateRandomPassword()
              const hashedPassword = await bcrypt.hash(password, 10)

              // 2. Créer le compte utilisateur
              const emailEtudiant = etudiantData.email?.trim() || null

              // Si pas d'email fourni, on ne peut pas envoyer les identifiants, 
              // mais on crée quand même le compte avec un email généré
              const emailCompte = emailEtudiant || `${matricule.toLowerCase()}@etudiant.inptic.ga`

              // Générer username unique
              let username = matricule
              // (Simplification verification username pour import massif pour perf, on suppose matricule unique)

              await supabaseAdmin.from('utilisateurs').insert({
                nom: etudiantData.nom,
                prenom: etudiantData.prenom,
                email: emailCompte,
                username: username,
                password: hashedPassword,
                role_id: roleEtudiant.id,
                actif: true
              })

              // 3. Envoyer l'email seulement si un email valide est fourni
              if (emailEtudiant) {
                // Envoyer en "fire and forget" pour ne pas ralentir l'import
                sendStudentCredentials(
                  { nom: etudiantData.nom, prenom: etudiantData.prenom, email: emailEtudiant },
                  password,
                  matricule
                ).catch(e => console.error(`Erreur envoi email ${emailEtudiant}:`, e))
              }
            } catch (accountError) {
              console.error(`Erreur création compte pour ${matricule}:`, accountError)
            }
          }

        } catch (error) {
          const errorMsg = `Erreur pour ${etudiantData.nom} ${etudiantData.prenom}: ${error.message}`
          detailsFiliere.erreurs.push(errorMsg)
          results.erreurs.push(errorMsg)
          console.error(errorMsg, error)
        }
      }

      results.details[filiereName] = detailsFiliere
    }

    return results
  } catch (error) {
    console.error('Erreur lors de l\'import des étudiants:', error)
    throw new Error(`Erreur lors de l'import: ${error.message}`)
  }
}
