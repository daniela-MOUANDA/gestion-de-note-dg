import XLSX from 'xlsx'
import prisma from '../../lib/prisma.js'

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

// Générer un matricule unique
const generateMatricule = async (anneeAcademique) => {
  // Extraire l'année (ex: "2024-2025" -> "2025" ou "2025" -> "2025")
  let annee
  if (anneeAcademique.includes('-')) {
    annee = anneeAcademique.split('-')[1] // Prendre la deuxième partie
  } else {
    annee = anneeAcademique.substring(0, 4)
  }
  
  const count = await prisma.etudiant.count({
    where: {
      matricule: {
        startsWith: `INPTIC${annee}-`
      }
    }
  })
  const numero = String(count + 1).padStart(4, '0')
  return `INPTIC${annee}-${numero}`
}

// Parser un fichier Excel et extraire les données par feuille
export const parseExcelFile = async (fileBuffer) => {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
    const result = {}
    
    // Parcourir chaque feuille (chaque feuille = une filière)
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
      
      if (data.length < 2) {
        // Pas de données (seulement l'en-tête ou vide)
        return
      }
      
      // Extraire l'en-tête (première ligne)
      const headers = data[0].map(h => String(h).trim())
      
      // Trouver les indices des colonnes
      const colIndices = {
        numero: headers.findIndex(h => h.toLowerCase().includes('n°') || h.toLowerCase().includes('numero')),
        nom: headers.findIndex(h => h.toLowerCase().includes('nom')),
        prenom: headers.findIndex(h => h.toLowerCase().includes('prénom') || h.toLowerCase().includes('prenom')),
        dateNaissance: headers.findIndex(h => h.toLowerCase().includes('date') && h.toLowerCase().includes('naissance')),
        serieBac: headers.findIndex(h => h.toLowerCase().includes('série') || h.toLowerCase().includes('serie') || h.toLowerCase().includes('bac')),
        anneeObtention: headers.findIndex(h => h.toLowerCase().includes('année') && h.toLowerCase().includes('obtention') || h.toLowerCase().includes('annee') && h.toLowerCase().includes('obtention')),
        sexe: headers.findIndex(h => h.toLowerCase().includes('sexe'))
      }
      
      // Extraire les données des étudiants
      const etudiants = []
      for (let i = 1; i < data.length; i++) {
        const row = data[i]
        
        // Vérifier si la ligne est vide
        if (!row || row.every(cell => !cell || String(cell).trim() === '')) {
          continue
        }
        
        const nom = colIndices.nom >= 0 ? String(row[colIndices.nom] || '').trim() : ''
        const prenom = colIndices.prenom >= 0 ? String(row[colIndices.prenom] || '').trim() : ''
        
        // Ignorer les lignes sans nom ou prénom
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

// Convertir l'année en format "YYYY-YYYY+1" (ex: "2025" -> "2024-2025")
const formatAnneeAcademique = (annee) => {
  if (annee.includes('-')) {
    return annee // Déjà au bon format
  }
  const anneeNum = parseInt(annee)
  return `${anneeNum - 1}-${anneeNum}`
}

// Importer les étudiants depuis les données parsées
export const importEtudiants = async (dataBySheet, anneeAcademique, agentId) => {
  try {
    // Convertir l'année au bon format
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
    let promotion = await prisma.promotion.findUnique({
      where: { annee: anneeFormatee }
    })
    
    if (!promotion) {
      // Créer la promotion si elle n'existe pas
      const anneeDebut = parseInt(anneeFormatee.substring(0, 4))
      promotion = await prisma.promotion.create({
        data: {
          annee: anneeFormatee,
          statut: 'EN_COURS',
          dateDebut: new Date(anneeDebut, 8, 1) // 1er septembre
        }
      })
    }
    
    // Récupérer la formation (par défaut Formation Initiale 1)
    let formation = await prisma.formation.findUnique({
      where: { code: 'INITIAL_1' }
    })
    
    if (!formation) {
      formation = await prisma.formation.create({
        data: {
          code: 'INITIAL_1',
          nom: 'Formation Initiale 1'
        }
      })
    }
    
    // Récupérer le niveau L1 (par défaut pour les nouveaux étudiants)
    let niveau = await prisma.niveau.findUnique({
      where: { code: 'L1' }
    })
    
    if (!niveau) {
      niveau = await prisma.niveau.create({
        data: {
          code: 'L1',
          nom: '1ère année',
          ordinal: '1ère'
        }
      })
    }
    
    // Traiter chaque feuille (filière)
    for (const [sheetName, etudiants] of Object.entries(dataBySheet)) {
      const filiereName = sheetName.trim()
      const filiereCode = mapFiliereNameToCode(filiereName)
      
      // Récupérer ou créer la filière
      let filiere = await prisma.filiere.findUnique({
        where: { code: filiereCode }
      })
      
      if (!filiere) {
        filiere = await prisma.filiere.create({
          data: {
            code: filiereCode,
            nom: filiereName
          }
        })
      }
      
      // Récupérer ou créer la classe L1 pour cette filière
      let classe = await prisma.classe.findFirst({
        where: {
          filiereId: filiere.id,
          niveauId: niveau.id
        }
      })
      
      if (!classe) {
        const classeCode = `${filiereCode}-1A`
        classe = await prisma.classe.create({
          data: {
            code: classeCode,
            nom: `${filiere.nom} - 1ère année`,
            filiereId: filiere.id,
            niveauId: niveau.id,
            effectif: 0
          }
        })
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
          // Générer un matricule unique
          const matricule = await generateMatricule(anneeFormatee)
          
          // Vérifier si l'étudiant existe déjà (par nom et prénom)
          const etudiantExistant = await prisma.etudiant.findFirst({
            where: {
              nom: etudiantData.nom,
              prenom: etudiantData.prenom
            }
          })
          
          if (etudiantExistant) {
            detailsFiliere.etudiantsExistant++
            results.etudiantsExistant++
            continue
          }
          
          // Créer l'étudiant
          const etudiant = await prisma.etudiant.create({
            data: {
              matricule,
              nom: etudiantData.nom,
              prenom: etudiantData.prenom,
              dateNaissance: etudiantData.dateNaissance,
              lieuNaissance: etudiantData.lieuNaissance,
              email: null, // Sera rempli plus tard
              telephone: null,
              adresse: null,
              photo: null
            }
          })
          
          // Créer l'inscription
          await prisma.inscription.create({
            data: {
              etudiantId: etudiant.id,
              promotionId: promotion.id,
              formationId: formation.id,
              filiereId: filiere.id,
              niveauId: niveau.id,
              classeId: classe.id,
              typeInscription: 'INSCRIPTION',
              statut: 'EN_ATTENTE',
              agentValideurId: agentId || null
            }
          })
          
          // Mettre à jour l'effectif de la classe
          await prisma.classe.update({
            where: { id: classe.id },
            data: { effectif: { increment: 1 } }
          })
          
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

