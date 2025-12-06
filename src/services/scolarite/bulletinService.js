import { supabaseAdmin } from '../../lib/supabase.js'

// Récupérer les bulletins d'une classe et d'un semestre
export const getBulletinsParClasse = async (promotionId, classeId, semestre) => {
  try {
    const { data: inscriptions, error: inscError } = await supabaseAdmin
      .from('inscriptions')
      .select('*, etudiants (*)')
      .eq('promotion_id', promotionId)
      .eq('classe_id', classeId)
      .eq('statut', 'INSCRIT')
    
    if (inscError) throw inscError
    
    const { data: bulletins, error: bulError } = await supabaseAdmin
      .from('bulletins')
      .select('*, etudiants (*)')
      .eq('promotion_id', promotionId)
      .eq('classe_id', classeId)
      .eq('semestre', semestre)
    
    if (bulError) throw bulError
    
    // Créer les bulletins manquants pour les étudiants inscrits
    const bulletinsManquants = (inscriptions || [])
      .filter(inscription => !(bulletins || []).find(b => b.etudiant_id === inscription.etudiant_id))
      .map(inscription => ({
        id: null,
        etudiantId: inscription.etudiant_id,
        etudiant: `${inscription.etudiants.nom} ${inscription.etudiants.prenom}`,
        matricule: inscription.etudiants.matricule,
        statut: 'NON_RECUPERE',
        dateRecuperation: null
      }))
    
    const bulletinsExistants = (bulletins || []).map(bulletin => ({
      id: bulletin.id,
      etudiantId: bulletin.etudiant_id,
      etudiant: `${bulletin.etudiants.nom} ${bulletin.etudiants.prenom}`,
      matricule: bulletin.etudiants.matricule,
      statut: bulletin.statut,
      dateRecuperation: bulletin.date_recuperation
    }))
    
    return [...bulletinsExistants, ...bulletinsManquants].sort((a, b) => 
      a.etudiant.localeCompare(b.etudiant)
    )
  } catch (error) {
    console.error('Erreur lors de la récupération des bulletins:', error)
    throw error
  }
}

// Marquer un bulletin comme récupéré
export const marquerBulletinRecupere = async (bulletinId, etudiantId, promotionId, classeId, semestre, agentId) => {
  try {
    if (bulletinId) {
      // Mettre à jour le bulletin existant
      const { data: bulletin, error } = await supabaseAdmin
        .from('bulletins')
        .update({
          statut: 'RECUPERE',
          date_recuperation: new Date().toISOString(),
          agent_recuperation: agentId
        })
        .eq('id', bulletinId)
        .select()
        .single()
      
      if (error) throw error
      return bulletin
    } else {
      // Créer le bulletin s'il n'existe pas
      const { data: promotion } = await supabaseAdmin
        .from('promotions')
        .select('annee')
        .eq('id', promotionId)
        .single()
      
      const { data: bulletin, error } = await supabaseAdmin
        .from('bulletins')
        .insert({
          etudiant_id: etudiantId,
          promotion_id: promotionId,
          classe_id: classeId,
          semestre,
          annee_academique: promotion?.annee || '',
          statut: 'RECUPERE',
          date_recuperation: new Date().toISOString(),
          agent_recuperation: agentId
        })
        .select()
        .single()
      
      if (error) throw error
      return bulletin
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du bulletin:', error)
    throw error
  }
}
