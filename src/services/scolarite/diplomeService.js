import { supabaseAdmin } from '../../lib/supabase.js'

// Récupérer les diplômes d'une classe et d'un type
export const getDiplomesParClasse = async (promotionId, classeId, typeDiplome) => {
  try {
    const { data: inscriptions, error: inscError } = await supabaseAdmin
      .from('inscriptions')
      .select('*, etudiants (*), niveaux (*)')
      .eq('promotion_id', promotionId)
      .eq('classe_id', classeId)
      .eq('statut', 'INSCRIT')
    
    if (inscError) throw inscError
    
    // Filtrer selon le type de diplôme (DTS pour L2, Licence pour L3)
    const etudiantsEligibles = (inscriptions || []).filter(inscription => {
      if (typeDiplome === 'DTS') {
        return inscription.niveaux?.code === 'L2'
      } else if (typeDiplome === 'LICENCE') {
        return inscription.niveaux?.code === 'L3'
      }
      return false
    })
    
    const { data: diplomes, error: dipError } = await supabaseAdmin
      .from('diplomes')
      .select('*, etudiants (*)')
      .eq('promotion_id', promotionId)
      .eq('classe_id', classeId)
      .eq('type_diplome', typeDiplome)
    
    if (dipError) throw dipError
    
    // Créer les diplômes manquants pour les étudiants éligibles
    const diplomesManquants = etudiantsEligibles
      .filter(inscription => !(diplomes || []).find(d => d.etudiant_id === inscription.etudiant_id))
      .map(inscription => ({
        id: null,
        etudiantId: inscription.etudiant_id,
        etudiant: `${inscription.etudiants.nom} ${inscription.etudiants.prenom}`,
        matricule: inscription.etudiants.matricule,
        statut: 'NON_RECUPERE',
        dateRecuperation: null
      }))
    
    const diplomesExistants = (diplomes || []).map(diplome => ({
      id: diplome.id,
      etudiantId: diplome.etudiant_id,
      etudiant: `${diplome.etudiants.nom} ${diplome.etudiants.prenom}`,
      matricule: diplome.etudiants.matricule,
      statut: diplome.statut,
      dateRecuperation: diplome.date_recuperation
    }))
    
    return [...diplomesExistants, ...diplomesManquants].sort((a, b) => 
      a.etudiant.localeCompare(b.etudiant)
    )
  } catch (error) {
    console.error('Erreur lors de la récupération des diplômes:', error)
    throw error
  }
}

// Marquer un diplôme comme récupéré
export const marquerDiplomeRecupere = async (diplomeId, etudiantId, promotionId, classeId, typeDiplome, agentId) => {
  try {
    if (diplomeId) {
      // Mettre à jour le diplôme existant
      const { data: diplome, error } = await supabaseAdmin
        .from('diplomes')
        .update({
          statut: 'RECUPERE',
          date_recuperation: new Date().toISOString(),
          agent_recuperation: agentId
        })
        .eq('id', diplomeId)
        .select()
        .single()
      
      if (error) throw error
      return diplome
    } else {
      // Créer le diplôme s'il n'existe pas
      const { data: promotion } = await supabaseAdmin
        .from('promotions')
        .select('annee')
        .eq('id', promotionId)
        .single()
      
      const { data: diplome, error } = await supabaseAdmin
        .from('diplomes')
        .insert({
          etudiant_id: etudiantId,
          promotion_id: promotionId,
          classe_id: classeId,
          type_diplome: typeDiplome,
          annee_academique: promotion?.annee || '',
          statut: 'RECUPERE',
          date_recuperation: new Date().toISOString(),
          agent_recuperation: agentId
        })
        .select()
        .single()
      
      if (error) throw error
      return diplome
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du diplôme:', error)
    throw error
  }
}
