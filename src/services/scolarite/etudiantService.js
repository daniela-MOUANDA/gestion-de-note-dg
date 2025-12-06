import { supabaseAdmin } from '../../lib/supabase.js'

// Récupérer les informations complètes d'un étudiant par son ID utilisateur
export const getEtudiantByUserId = async (userId) => {
  try {
    // Récupérer l'utilisateur
    const { data: utilisateur, error: userError } = await supabaseAdmin
      .from('utilisateurs')
      .select('id, email, username, nom, prenom, roles (code)')
      .eq('id', userId)
      .single()

    if (userError || !utilisateur || utilisateur.roles?.code !== 'ETUDIANT') {
      throw new Error('Utilisateur non trouvé ou n\'est pas un étudiant')
    }

    // Chercher l'étudiant par matricule (le username est généralement le matricule) ou par email
    const { data: etudiant, error: etudError } = await supabaseAdmin
      .from('etudiants')
      .select(`
        *,
        inscriptions (
          *,
          promotions (id, annee, statut),
          formations (id, nom, code),
          filieres (id, nom, code),
          niveaux (id, nom, code, ordinal),
          classes (id, nom, code)
        ),
        parents (id, nom, prenom, telephone, email, lien_parente)
      `)
      .or(`matricule.eq.${utilisateur.username},email.eq.${utilisateur.email}`)
      .limit(1)
      .single()

    if (etudError || !etudiant) {
      throw new Error('Étudiant non trouvé dans la base de données')
    }

    // Trouver l'inscription active la plus récente
    const inscriptions = etudiant.inscriptions || []
    const inscription = inscriptions
      .filter(i => i.statut === 'INSCRIT')
      .sort((a, b) => new Date(b.date_inscription) - new Date(a.date_inscription))[0] || null

    // Formater les données pour le frontend
    return {
      id: etudiant.id,
      matricule: etudiant.matricule,
      nom: etudiant.nom,
      prenom: etudiant.prenom,
      email: etudiant.email || utilisateur.email,
      telephone: etudiant.telephone || null,
      adresse: etudiant.adresse || null,
      photo: etudiant.photo || null,
      dateNaissance: etudiant.date_naissance ? etudiant.date_naissance.split('T')[0] : null,
      lieuNaissance: etudiant.lieu_naissance || null,
      // Informations académiques
      filiere: inscription?.filieres?.nom || inscription?.filieres?.code || '',
      filiereCode: inscription?.filieres?.code || '',
      niveau: inscription?.niveaux?.code || inscription?.niveaux?.nom || '',
      niveauNom: inscription?.niveaux?.nom || '',
      formation: inscription?.formations?.nom || '',
      classe: inscription?.classes?.nom || inscription?.classes?.code || '',
      anneeAcademique: inscription?.promotions?.annee || '',
      statutInscription: inscription?.statut || 'EN_ATTENTE',
      dateInscription: inscription?.date_inscription ? inscription.date_inscription.split('T')[0] : null,
      // Informations parentales
      parents: (etudiant.parents || []).slice(0, 2).map(parent => ({
        nom: `${parent.prenom || ''} ${parent.nom}`.trim(),
        telephone: parent.telephone || null,
        email: parent.email || null,
        lienParente: parent.lien_parente || null
      })),
      // Informations calculées
      estActif: inscription?.statut === 'INSCRIT',
      programme: inscription ? `${inscription.filieres?.code || ''} ${inscription.promotions?.annee || ''} ${inscription.formations?.nom || ''}`.trim() : '',
      // Données par défaut (à calculer plus tard si nécessaire)
      moyenneGenerale: 0,
      credits: 0,
      totalModules: 0,
      rangClasse: 0,
      estBoursier: false,
      semestre: inscription?.niveaux?.ordinal ? `Semestre ${parseInt(inscription.niveaux.ordinal) * 2 - 1}` : ''
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'étudiant:', error)
    throw error
  }
}
