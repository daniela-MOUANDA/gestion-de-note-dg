import { supabaseAdmin } from '../../lib/supabase.js'

// Générer le prochain numéro d'attestation
const genererNumeroAttestation = async (annee) => {
  try {
    const { data: dernierNumero } = await supabaseAdmin
      .from('attestations')
      .select('numero')
      .ilike('numero', 'N°%')
      .order('numero', { ascending: false })
      .limit(1)
      .single()
    
    let numero = 1
    if (dernierNumero) {
      const match = dernierNumero.numero.match(/N°(\d+)/)
      if (match) {
        numero = parseInt(match[1]) + 1
      }
    }
    
    return `N°${String(numero).padStart(4, '0')}/INPTIC/DG/DSE/${annee}`
  } catch (error) {
    console.error('Erreur lors de la génération du numéro:', error)
    throw error
  }
}

// Créer une attestation
export const creerAttestation = async (etudiantId, promotionId, anneeAcademique) => {
  try {
    // Utiliser la première année de l'année académique (ex: "2024-2025" → 2024)
    const annee = anneeAcademique
      ? parseInt(String(anneeAcademique).split('-')[0], 10) || new Date().getFullYear()
      : new Date().getFullYear()
    const numero = await genererNumeroAttestation(annee)
    
    const { data, error } = await supabaseAdmin
      .from('attestations')
      .insert({
        numero,
        etudiant_id: etudiantId,
        promotion_id: promotionId,
        annee_academique: anneeAcademique,
        lieu: 'Libreville',
        archivee: true,
        date_archivage: new Date().toISOString()
      })
      .select('*, etudiants (*), promotions (*)')
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erreur lors de la création de l\'attestation:', error)
    throw error
  }
}

// Récupérer les étudiants inscrits par filière et niveau (sans classe)
export const getEtudiantsInscritsParFiliereNiveau = async (promotionId, filiereId, niveauId, formationId) => {
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
      .eq('promotion_id', promotionId)
      .eq('filiere_id', filiereId)
      .eq('niveau_id', niveauId)
      .eq('formation_id', formationId)
      .eq('statut', 'INSCRIT')
      .order('etudiants(nom)', { ascending: true })
    
    if (error) throw error
    
    const etudiantIds = (inscriptions || []).map(i => i.etudiant_id)
    
    let attestations = []
    if (etudiantIds.length > 0) {
      const { data: attData } = await supabaseAdmin
        .from('attestations')
        .select('id, etudiant_id, promotion_id, numero, archivee, date_generation, date_archivage')
        .eq('promotion_id', promotionId)
        .in('etudiant_id', etudiantIds)
      attestations = attData || []
    }

    const attestationMap = new Map()
    attestations.forEach(a => {
      attestationMap.set(`${a.etudiant_id}-${a.promotion_id}`, a)
    })
    
    return (inscriptions || []).map(inscription => {
      const key = `${inscription.etudiant_id}-${inscription.promotion_id}`
      const attestation = attestationMap.get(key)
      return {
        id: inscription.etudiants.id,
        inscriptionId: inscription.id,
        nom: inscription.etudiants.nom,
        prenom: inscription.etudiants.prenom,
        matricule: inscription.etudiants.matricule,
        formation: inscription.formations.nom,
        filiere: inscription.filieres.nom,
        niveau: inscription.niveaux.nom,
        niveauCode: inscription.niveaux.code,
        niveauOrdinal: inscription.niveaux.ordinal,
        estInscrit: inscription.statut === 'INSCRIT',
        attestationExiste: !!attestation,
        attestationId: attestation?.id || null,
        attestationNumero: attestation?.numero || null,
        attestationArchivee: attestation?.archivee || false,
        attestationDate: attestation?.date_generation || null
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants inscrits:', error)
    throw error
  }
}

// Récupérer les attestations d'une classe
export const getAttestationsParClasse = async (promotionId, filiereId, niveauId, classeId) => {
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
      .eq('promotion_id', promotionId)
      .eq('classe_id', classeId)
      .eq('statut', 'INSCRIT')
    
    if (error) throw error
    
    const etudiantIds = (inscriptions || []).map(i => i.etudiant_id)
    
    let attestations = []
    if (etudiantIds.length > 0) {
      const { data: attData } = await supabaseAdmin
        .from('attestations')
        .select('*, etudiants (*)')
        .eq('promotion_id', promotionId)
        .in('etudiant_id', etudiantIds)
      attestations = attData || []
    }
    
    return (inscriptions || []).map(inscription => {
      const attestation = attestations.find(a => a.etudiant_id === inscription.etudiant_id)
      return {
        id: attestation?.id || null,
        etudiant: `${inscription.etudiants.nom} ${inscription.etudiants.prenom}`,
        matricule: inscription.etudiants.matricule,
        formation: inscription.formations.nom,
        dateGeneration: attestation?.date_generation ? 
          new Date(attestation.date_generation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 
          null,
        numero: attestation?.numero || null,
        existe: !!attestation
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des attestations:', error)
    throw error
  }
}

// Archiver une attestation
export const archiverAttestation = async (attestationId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('attestations')
      .update({
        archivee: true,
        date_archivage: new Date().toISOString()
      })
      .eq('id', attestationId)
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erreur lors de l\'archivage de l\'attestation:', error)
    throw error
  }
}

// Récupérer les attestations archivées par filière et niveau
export const getAttestationsArchiveesParFiliereNiveau = async (promotionId, filiereId, niveauId, formationId = null) => {
  try {
    console.log('Recherche des inscriptions avec les paramètres:', { promotionId, filiereId, niveauId, formationId })
    
    let query = supabaseAdmin
      .from('inscriptions')
      .select(`
        *,
        etudiants (*),
        formations (*),
        filieres (*),
        niveaux (*)
      `)
      .eq('promotion_id', promotionId)
      .eq('filiere_id', filiereId)
      .eq('niveau_id', niveauId)
      .eq('statut', 'INSCRIT')
    
    if (formationId) {
      query = query.eq('formation_id', formationId)
    }
    
    const { data: inscriptions, error } = await query
    
    if (error) throw error
    
    console.log('Inscriptions trouvées:', (inscriptions || []).length)
    if (!inscriptions || inscriptions.length === 0) {
      console.log('Aucune inscription trouvée avec ces critères')
      return []
    }
    
    const etudiantIds = inscriptions.map(i => i.etudiant_id)
    
    const { data: attestations, error: attError } = await supabaseAdmin
      .from('attestations')
      .select('*, etudiants (*)')
      .eq('promotion_id', promotionId)
      .eq('archivee', true)
      .in('etudiant_id', etudiantIds)
      .order('date_generation', { ascending: false })
    
    if (attError) throw attError
    
    return (attestations || []).map(attestation => {
      const inscription = inscriptions.find(i => i.etudiant_id === attestation.etudiant_id)
      return {
        id: attestation.id,
        etudiant: inscription?.etudiants || attestation.etudiants,
        matricule: attestation.etudiants.matricule,
        formation: inscription?.formations?.nom || '',
        filiere: inscription?.filieres?.nom || '',
        niveau: inscription?.niveaux?.nom || inscription?.niveaux?.code || '',
        dateGeneration: new Date(attestation.date_generation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        dateGenerationISO: attestation.date_generation,
        numero: attestation.numero,
        anneeAcademique: attestation.annee_academique
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des attestations archivées:', error)
    throw error
  }
}
