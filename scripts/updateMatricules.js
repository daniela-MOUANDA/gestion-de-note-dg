/**
 * Script pour mettre à jour les matricules des étudiants existants
 * Format: {anneeFin}{3chiffres} (ex: 26001 pour 2025-2026)
 */

import prisma from '../src/lib/prisma.js'
import { generateMatricule } from '../src/services/scolarite/importService.js'

async function updateMatricules() {
  try {
    console.log('Début de la mise à jour des matricules...')
    
    // Récupérer tous les étudiants avec leurs inscriptions
    const etudiants = await prisma.etudiant.findMany({
      include: {
        inscriptions: {
          include: {
            promotion: true
          },
          orderBy: {
            dateInscription: 'asc' // Prendre la première inscription
          },
          take: 1
        }
      }
    })
    
    console.log(`Nombre d'étudiants à traiter: ${etudiants.length}`)
    
    let updated = 0
    let errors = 0
    const errorsList = []
    
    for (const etudiant of etudiants) {
      try {
        // Récupérer l'année académique de la première inscription
        // Pour l'année 2025-2026, on force l'année académique à 2025-2026 pour que le matricule commence par 26
        let anneeAcademique = '2025-2026' // Par défaut pour cette année
        
        if (etudiant.inscriptions && etudiant.inscriptions.length > 0) {
          const premiereInscription = etudiant.inscriptions[0]
          if (premiereInscription.promotion && premiereInscription.promotion.annee) {
            const anneePromotion = premiereInscription.promotion.annee
            // Si l'année de la promotion est 2024-2025 ou antérieure, on utilise 2025-2026 pour le matricule
            // Car tous les étudiants actuels sont pour l'année 2025-2026
            if (anneePromotion === '2024-2025' || anneePromotion.startsWith('2024')) {
              anneeAcademique = '2025-2026'
            } else {
              anneeAcademique = anneePromotion
            }
          }
        }
        
        // Générer un nouveau matricule
        const nouveauMatricule = await generateMatricule(anneeAcademique)
        
        // Mettre à jour l'étudiant
        await prisma.etudiant.update({
          where: { id: etudiant.id },
          data: { matricule: nouveauMatricule }
        })
        
        console.log(`✓ ${etudiant.prenom} ${etudiant.nom}: ${etudiant.matricule} -> ${nouveauMatricule}`)
        updated++
      } catch (error) {
        console.error(`✗ Erreur pour ${etudiant.prenom} ${etudiant.nom} (${etudiant.matricule}):`, error.message)
        errors++
        errorsList.push({
          etudiant: `${etudiant.prenom} ${etudiant.nom}`,
          ancienMatricule: etudiant.matricule,
          erreur: error.message
        })
      }
    }
    
    console.log('\n=== Résumé ===')
    console.log(`Total d'étudiants: ${etudiants.length}`)
    console.log(`Matricules mis à jour: ${updated}`)
    console.log(`Erreurs: ${errors}`)
    
    if (errorsList.length > 0) {
      console.log('\n=== Liste des erreurs ===')
      errorsList.forEach((err, index) => {
        console.log(`${index + 1}. ${err.etudiant} (${err.ancienMatricule}): ${err.erreur}`)
      })
    }
    
    console.log('\nMise à jour terminée!')
  } catch (error) {
    console.error('Erreur fatale lors de la mise à jour des matricules:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
updateMatricules()
  .then(() => {
    console.log('Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Erreur lors de l\'exécution du script:', error)
    process.exit(1)
  })

