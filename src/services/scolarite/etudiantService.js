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

// Supprimer un étudiant et toutes ses données associées
export const deleteEtudiant = async (etudiantId) => {
  try {
    // Vérifier que l'étudiant existe
    const { data: etudiant, error: fetchError } = await supabaseAdmin
      .from('etudiants')
      .select('id, matricule, nom, prenom, email')
      .eq('id', etudiantId)
      .single()

    if (fetchError || !etudiant) {
      throw new Error('Étudiant introuvable')
    }

    // Récupérer toutes les inscriptions de l'étudiant pour mettre à jour les effectifs des classes
    const { data: inscriptions, error: inscError } = await supabaseAdmin
      .from('inscriptions')
      .select('id, classe_id')
      .eq('etudiant_id', etudiantId)

    if (inscError) {
      console.error('Erreur lors de la récupération des inscriptions:', inscError)
    }

    // Décrémenter l'effectif des classes concernées
    if (inscriptions && inscriptions.length > 0) {
      const classesIds = [...new Set(inscriptions
        .map(ins => ins.classe_id)
        .filter(id => id !== null))]
      
      for (const classeId of classesIds) {
        const { data: classe, error: classeError } = await supabaseAdmin
          .from('classes')
          .select('effectif')
          .eq('id', classeId)
          .single()

        if (!classeError && classe) {
          const nouveauEffectif = Math.max(0, (classe.effectif || 0) - 1)
          await supabaseAdmin
            .from('classes')
            .update({ effectif: nouveauEffectif })
            .eq('id', classeId)
        }
      }
    }

    // Supprimer les parents (cascade devrait le faire automatiquement, mais on le fait explicitement)
    await supabaseAdmin
      .from('parents')
      .delete()
      .eq('etudiant_id', etudiantId)

    // Supprimer les inscriptions (cascade devrait supprimer les notes, bulletins, etc.)
    await supabaseAdmin
      .from('inscriptions')
      .delete()
      .eq('etudiant_id', etudiantId)

    // Supprimer le compte utilisateur associé si il existe (par email ou username = matricule)
    if (etudiant.email || etudiant.matricule) {
      const { data: utilisateur } = await supabaseAdmin
        .from('utilisateurs')
        .select('id')
        .or(etudiant.email && etudiant.matricule 
          ? `email.eq.${etudiant.email},username.eq.${etudiant.matricule}`
          : etudiant.email 
            ? `email.eq.${etudiant.email}`
            : `username.eq.${etudiant.matricule}`)
        .maybeSingle()

      if (utilisateur) {
        await supabaseAdmin
          .from('utilisateurs')
          .delete()
          .eq('id', utilisateur.id)
      }
    }

    // Supprimer l'étudiant (cascade supprimera automatiquement les inscriptions, parents, etc.)
    const { error: deleteError } = await supabaseAdmin
      .from('etudiants')
      .delete()
      .eq('id', etudiantId)

    if (deleteError) {
      throw new Error(`Erreur lors de la suppression de l'étudiant: ${deleteError.message}`)
    }

    return {
      success: true,
      message: `L'étudiant ${etudiant.prenom} ${etudiant.nom} a été supprimé avec succès`
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'étudiant:', error)
    throw error
  }
}
