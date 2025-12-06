
// Récupérer les étudiants d'une classe spécifique
export const getEtudiantsByClasse = async (classeId) => {
    try {
        const { data: inscriptions, error } = await supabaseAdmin
            .from('inscriptions')
            .select(`
        etudiants (
          id,
          matricule,
          nom,
          prenom,
          email,
          telephone,
          photo
        )
      `)
            .eq('classe_id', classeId)
            .eq('statut', 'INSCRIT')
            .order('date_inscription', { ascending: true })

        if (error) throw error

        // Aplatir la structure
        const etudiants = inscriptions.map(i => i.etudiants).filter(Boolean)

        return { success: true, etudiants }
    } catch (error) {
        console.error('Erreur getEtudiantsByClasse:', error)
        return { success: false, error: error.message }
    }
}
