import XLSX from 'xlsx'
import { supabaseAdmin } from '../../lib/supabase.js'

// Mapper les noms de filières depuis Excel vers les codes de la base de données
const mapFiliereNameToCode = (filiereName) => {
  const name = filiereName.trim().toLowerCase()
  
  // Génie Informatique
  if (name.includes('génie info') || name.includes('genie info') || 
      name.includes('génie informatique') || name.includes('genie informatique') ||
      name.includes('gi') || name === 'génie info' || name === 'genie info') {
    return 'GI'
  }
  
  // Réseaux et Télécoms
  if (name.includes('réseaux') || name.includes('reseau') || 
      name.includes('télécom') || name.includes('telecom') ||
      name.includes('rt') || name.includes('réseau et télécom') || 
      name.includes('reseau et telecom')) {
    return 'RT'
  }
  
  // Management des TIC / Multimédias
  if (name.includes('management') || name.includes('multimédia') || 
      name.includes('multimedia') || name.includes('mtic') ||
      name.includes('tic')) {
    return 'MTIC'
  }
  
  // Par défaut, utiliser les 2 premières lettres en majuscules
  return filiereName.substring(0, 2).toUpperCase()
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
      
      const colIndices = {
        numero: headers.findIndex(h => h.toLowerCase().includes('n°') || h.toLowerCase().includes('numero')),
        nom: headers.findIndex(h => h.toLowerCase().includes('nom')),
        prenom: headers.findIndex(h => h.toLowerCase().includes('prénom') || h.toLowerCase().includes('prenom')),
        dateNaissance: headers.findIndex(h => h.toLowerCase().includes('date') && h.toLowerCase().includes('naissance')),
        serieBac: headers.findIndex(h => h.toLowerCase().includes('série') || h.toLowerCase().includes('serie') || h.toLowerCase().includes('bac')),
        anneeObtention: headers.findIndex(h => h.toLowerCase().includes('année') && h.toLowerCase().includes('obtention') || h.toLowerCase().includes('annee') && h.toLowerCase().includes('obtention')),
        sexe: headers.findIndex(h => h.toLowerCase().includes('sexe'))
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
        
        const dateNaissanceStr = colIndices.dateNaissance >= 0 ? String(row[colIndices.dateNaissance] || '').trim() : ''
        const { date, lieu } = parseDateNaissance(dateNaissanceStr)
        
        const serieBac = colIndices.serieBac >= 0 ? String(row[colIndices.serieBac] || '').trim() : null
        const anneeObtention = colIndices.anneeObtention >= 0 ? String(row[colIndices.anneeObtention] || '').trim() : null
        const sexe = colIndices.sexe >= 0 ? String(row[colIndices.sexe] || '').trim().toUpperCase() : null
        
        etudiants.push({
          nom,
          prenom,
          dateNaissance: date,
          lieuNaissance: lieu,
          serieBac,
          anneeObtention,
          sexe: sexe === 'M' || sexe === 'F' ? sexe : null
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
export const importEtudiants = async (dataBySheet, anneeAcademique, agentId) => {
  try {
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
    
    // Récupérer la formation par défaut
    let { data: formation } = await supabaseAdmin
      .from('formations')
      .select('*')
      .eq('code', 'INITIAL_1')
      .single()
    
    if (!formation) {
      const { data: newForm, error } = await supabaseAdmin
        .from('formations')
        .insert({
          code: 'INITIAL_1',
          nom: 'Formation Initiale 1'
        })
        .select()
        .single()
      if (error) throw error
      formation = newForm
    }
    
    // Récupérer le niveau L1
    let { data: niveau } = await supabaseAdmin
      .from('niveaux')
      .select('*')
      .eq('code', 'L1')
      .single()
    
    if (!niveau) {
      const { data: newNiv, error } = await supabaseAdmin
        .from('niveaux')
        .insert({
          code: 'L1',
          nom: '1ère année',
          ordinal: '1ère'
        })
        .select()
        .single()
      if (error) throw error
      niveau = newNiv
    }
    
    // Traiter chaque feuille (filière)
    for (const [sheetName, etudiants] of Object.entries(dataBySheet)) {
      const filiereName = sheetName.trim()
      const filiereCode = mapFiliereNameToCode(filiereName)
      
      // Récupérer ou créer la filière
      let { data: filiere } = await supabaseAdmin
        .from('filieres')
        .select('*')
        .eq('code', filiereCode)
        .single()
      
      if (!filiere) {
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
      
      // Récupérer ou créer la classe L1 pour cette filière
      let { data: classe } = await supabaseAdmin
        .from('classes')
        .select('*')
        .eq('filiere_id', filiere.id)
        .eq('niveau_id', niveau.id)
        .single()
      
      if (!classe) {
        const classeCode = `${filiereCode}-1A`
        const { data: newClasse, error } = await supabaseAdmin
          .from('classes')
          .insert({
            code: classeCode,
            nom: `${filiere.nom} - 1ère année`,
            filiere_id: filiere.id,
            niveau_id: niveau.id,
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
            .single()
          
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
              lieu_naissance: etudiantData.lieuNaissance,
              email: null,
              telephone: null,
              adresse: null,
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
              filiere_id: filiere.id,
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
