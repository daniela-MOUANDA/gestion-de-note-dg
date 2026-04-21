import bcrypt from 'bcrypt'
import { supabaseAdmin } from '../lib/supabase.js'
import { getScopedFilieresForDepartement, getScopedFiliereIdsForDepartement } from './chefDepartement/filiereScopeService.js'

// Créer un nouveau chef de département
export const createChefDepartement = async (data, createdBy) => {
  try {
    const { nom, prenom, email, telephone, departementId, motDePasse, actif } = data

    // Validation
    if (!nom || !prenom || !email || !departementId || !motDePasse) {
      return {
        success: false,
        error: 'Tous les champs obligatoires doivent être remplis'
      }
    }

    // Vérifier que le département existe
    const { data: departement, error: deptError } = await supabaseAdmin
      .from('departements')
      .select('*')
      .eq('id', departementId)
      .single()

    if (deptError || !departement) {
      return {
        success: false,
        error: 'Département introuvable'
      }
    }

    // Récupérer le rôle CHEF_DEPARTEMENT
    const { data: roleChef, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('code', 'CHEF_DEPARTEMENT')
      .single()

    if (roleError || !roleChef) {
      return {
        success: false,
        error: 'Rôle CHEF_DEPARTEMENT introuvable'
      }
    }

    // Vérifier si le département est déjà assigné à un autre chef de département
    const { data: existingChef } = await supabaseAdmin
      .from('utilisateurs')
      .select('id, nom, prenom')
      .eq('departement_id', departementId)
      .eq('role_id', roleChef.id)
      .eq('actif', true)
      .single()

    if (existingChef) {
      return {
        success: false,
        error: `Ce département est déjà assigné à ${existingChef.nom} ${existingChef.prenom}. Un département ne peut être assigné qu'à un seul chef.`
      }
    }

    // Normaliser l'email
    const normalizedEmail = email.trim().toLowerCase()

    // Vérifier si l'email existe déjà
    const { data: emailExists } = await supabaseAdmin
      .from('utilisateurs')
      .select('id')
      .eq('email', normalizedEmail)
      .single()

    if (emailExists) {
      return {
        success: false,
        error: 'Cet email est déjà utilisé'
      }
    }

    // Générer un username à partir de l'email
    let username = normalizedEmail.split('@')[0]

    // Vérifier si le username existe déjà
    const { data: usernameExists } = await supabaseAdmin
      .from('utilisateurs')
      .select('id')
      .eq('username', username)
      .single()

    if (usernameExists) {
      username = `${username}_${Date.now().toString().slice(-4)}`
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10)

    // Créer l'utilisateur avec le rôle CHEF_DEPARTEMENT
    const { data: utilisateur, error: createError } = await supabaseAdmin
      .from('utilisateurs')
      .insert({
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: normalizedEmail,
        username: username,
        password: hashedPassword,
        telephone: telephone?.trim() || null,
        role_id: roleChef.id,
        actif: actif !== undefined ? actif : true,
        departement_id: departementId
      })
      .select('*, departements (*), roles (*)')
      .single()

    if (createError) {
      console.error('Erreur lors de la création:', createError)
      throw createError
    }

    // Enregistrer dans l'audit
    if (createdBy) {
      await supabaseAdmin
        .from('actions_audit')
        .insert({
          utilisateur_id: createdBy,
          action: 'Création de chef de département',
          details: `Chef de département créé : ${nom} ${prenom} (${departement.nom})`,
          type_action: 'CONNEXION',
          date_action: new Date().toISOString()
        })
    }

    // Retourner les données sans le mot de passe
    const { password: _, ...userWithoutPassword } = utilisateur

    return {
      success: true,
      chef: {
        id: userWithoutPassword.id,
        nom: userWithoutPassword.nom,
        prenom: userWithoutPassword.prenom,
        email: userWithoutPassword.email,
        telephone: userWithoutPassword.telephone,
        departementId: userWithoutPassword.departement_id,
        departement: userWithoutPassword.departements ? {
          id: userWithoutPassword.departements.id,
          nom: userWithoutPassword.departements.nom,
          code: userWithoutPassword.departements.code
        } : null,
        actif: userWithoutPassword.actif,
        dateCreation: userWithoutPassword.date_creation
      }
    }
  } catch (error) {
    console.error('Erreur lors de la création du chef de département:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la création du chef de département'
    }
  }
}

// Obtenir tous les chefs de département
export const getAllChefsDepartement = async () => {
  try {
    // Récupérer le rôle CHEF_DEPARTEMENT
    const { data: roleChef, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('code', 'CHEF_DEPARTEMENT')
      .single()

    if (roleError || !roleChef) {
      return {
        success: false,
        error: 'Rôle CHEF_DEPARTEMENT introuvable'
      }
    }

    const { data: utilisateurs, error } = await supabaseAdmin
      .from('utilisateurs')
      .select('*, departements (*), roles (*)')
      .eq('role_id', roleChef.id)
      .order('date_creation', { ascending: false })

    if (error) throw error

    const chefs = (utilisateurs || []).map(u => {
      const { password: _, ...userWithoutPassword } = u
      return {
        id: userWithoutPassword.id,
        nom: userWithoutPassword.nom,
        prenom: userWithoutPassword.prenom,
        email: userWithoutPassword.email,
        telephone: userWithoutPassword.telephone || '',
        departementId: userWithoutPassword.departement_id,
        departement: userWithoutPassword.departements ? {
          id: userWithoutPassword.departements.id,
          nom: userWithoutPassword.departements.nom,
          code: userWithoutPassword.departements.code
        } : null,
        actif: userWithoutPassword.actif,
        dateCreation: userWithoutPassword.date_creation,
        derniereConnexion: userWithoutPassword.derniere_connexion
      }
    })

    return {
      success: true,
      chefs
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des chefs de département:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des chefs de département'
    }
  }
}

// Mettre à jour un chef de département
export const updateChefDepartement = async (id, data, updatedBy) => {
  try {
    const { nom, prenom, email, telephone, departementId, motDePasse, actif } = data

    // Vérifier si le chef existe
    const { data: existingChef, error: fetchError } = await supabaseAdmin
      .from('utilisateurs')
      .select('*, roles (*)')
      .eq('id', id)
      .single()

    if (fetchError || !existingChef) {
      return {
        success: false,
        error: 'Chef de département introuvable'
      }
    }

    // Vérifier que c'est bien un chef de département
    if (!existingChef.roles || existingChef.roles.code !== 'CHEF_DEPARTEMENT') {
      return {
        success: false,
        error: 'Cet utilisateur n\'est pas un chef de département'
      }
    }

    // Normaliser l'email
    const normalizedEmail = email?.trim().toLowerCase()

    // Vérifier si l'email est déjà utilisé par un autre compte
    if (normalizedEmail && normalizedEmail !== existingChef.email) {
      const { data: emailExists } = await supabaseAdmin
        .from('utilisateurs')
        .select('id')
        .eq('email', normalizedEmail)
        .neq('id', id)
        .single()

      if (emailExists) {
        return {
          success: false,
          error: 'Cet email est déjà utilisé'
        }
      }
    }

    // Vérifier que le département existe si fourni
    if (departementId) {
      const { data: departement, error: deptError } = await supabaseAdmin
        .from('departements')
        .select('id')
        .eq('id', departementId)
        .single()

      if (deptError || !departement) {
        return {
          success: false,
          error: 'Département introuvable'
        }
      }

      // Vérifier si le département est déjà assigné à un autre chef
      if (departementId !== existingChef.departement_id) {
        const { data: roleChef } = await supabaseAdmin
          .from('roles')
          .select('id')
          .eq('code', 'CHEF_DEPARTEMENT')
          .single()

        if (roleChef) {
          const { data: existingChefWithDept } = await supabaseAdmin
            .from('utilisateurs')
            .select('id, nom, prenom')
            .eq('departement_id', departementId)
            .eq('role_id', roleChef.id)
            .neq('id', id)
            .eq('actif', true)
            .single()

          if (existingChefWithDept) {
            return {
              success: false,
              error: `Ce département est déjà assigné à ${existingChefWithDept.nom} ${existingChefWithDept.prenom}. Un département ne peut être assigné qu'à un seul chef.`
            }
          }
        }
      }
    }

    // Préparer les données de mise à jour
    const updateData = {}

    if (nom) updateData.nom = nom.trim()
    if (prenom) updateData.prenom = prenom.trim()
    if (normalizedEmail) updateData.email = normalizedEmail
    if (telephone !== undefined) updateData.telephone = telephone?.trim() || null
    if (departementId) updateData.departement_id = departementId
    if (actif !== undefined) updateData.actif = actif

    // Hasher le nouveau mot de passe si fourni
    if (motDePasse && motDePasse.trim() !== '') {
      updateData.password = await bcrypt.hash(motDePasse, 10)
    }

    // Mettre à jour le chef
    const { data: utilisateur, error: updateError } = await supabaseAdmin
      .from('utilisateurs')
      .update(updateData)
      .eq('id', id)
      .select('*, departements (*)')
      .single()

    if (updateError) throw updateError

    // Enregistrer dans l'audit
    if (updatedBy) {
      await supabaseAdmin
        .from('actions_audit')
        .insert({
          utilisateur_id: updatedBy,
          action: 'Modification de chef de département',
          details: `Chef de département modifié : ${utilisateur.nom} ${utilisateur.prenom}`,
          type_action: 'CONNEXION',
          date_action: new Date().toISOString()
        })
    }

    // Retourner les données sans le mot de passe
    const { password: _, ...userWithoutPassword } = utilisateur

    return {
      success: true,
      chef: {
        id: userWithoutPassword.id,
        nom: userWithoutPassword.nom,
        prenom: userWithoutPassword.prenom,
        email: userWithoutPassword.email,
        telephone: userWithoutPassword.telephone,
        departementId: userWithoutPassword.departement_id,
        departement: userWithoutPassword.departements ? {
          id: userWithoutPassword.departements.id,
          nom: userWithoutPassword.departements.nom,
          code: userWithoutPassword.departements.code
        } : null,
        actif: userWithoutPassword.actif,
        dateCreation: userWithoutPassword.date_creation,
        derniereConnexion: userWithoutPassword.derniere_connexion
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du chef de département:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la mise à jour du chef de département'
    }
  }
}

// Supprimer un chef de département
export const deleteChefDepartement = async (id, deletedBy) => {
  try {
    // Vérifier si le chef existe
    const { data: existingChef, error: fetchError } = await supabaseAdmin
      .from('utilisateurs')
      .select('*, roles (*)')
      .eq('id', id)
      .single()

    if (fetchError || !existingChef) {
      return {
        success: false,
        error: 'Chef de département introuvable'
      }
    }

    // Vérifier que c'est bien un chef de département
    if (!existingChef.roles || existingChef.roles.code !== 'CHEF_DEPARTEMENT') {
      return {
        success: false,
        error: 'Cet utilisateur n\'est pas un chef de département'
      }
    }

    // Supprimer le chef
    const { error: deleteError } = await supabaseAdmin
      .from('utilisateurs')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    // Enregistrer dans l'audit
    if (deletedBy) {
      await supabaseAdmin
        .from('actions_audit')
        .insert({
          utilisateur_id: deletedBy,
          action: 'Suppression de chef de département',
          details: `Chef de département supprimé : ${existingChef.nom} ${existingChef.prenom}`,
          type_action: 'CONNEXION',
          date_action: new Date().toISOString()
        })
    }

    return {
      success: true,
      message: 'Chef de département supprimé avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du chef de département:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la suppression du chef de département'
    }
  }
}

// ============================================
// DASHBOARD CHEF DEPARTEMENT
// ============================================

// Obtenir les enseignants du même département
export const getDepartementEnseignants = async (departementId) => {
  try {
    if (!departementId) {
      return { success: false, error: 'ID de département manquant' }
    }

    // Récupérer les enseignants liés au département
    const { data: roleEnseignant } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('code', 'ENSEIGNANT')
      .single()

    if (!roleEnseignant) {
      console.warn('Role ENSEIGNANT introuvable')
      return { success: true, enseignants: [] }
    }

    const { data: enseignants, error } = await supabaseAdmin
      .from('utilisateurs')
      .select('id, nom, prenom, email, telephone, photo, actif')
      .eq('departement_id', departementId)
      .eq('role_id', roleEnseignant.id)
      .order('nom')

    if (error) throw error

    return { success: true, enseignants }
  } catch (error) {
    console.error('Erreur getDepartementEnseignants:', error)
    return { success: false, error: 'Erreur lors de la récupération des enseignants' }
  }
}

// Obtenir les modules du département
export const getDepartementModules = async (departementId) => {
  try {
    if (!departementId) {
      return { success: false, error: 'ID de département manquant' }
    }

    const { data: modules, error } = await supabaseAdmin
      .from('modules')
      .select('*, classes(nom, filieres(nom, code), niveaux(code))')
      .eq('departement_id', departementId)
      .order('nom')

    if (error) throw error
    return { success: true, modules }
  } catch (error) {
    console.error('Erreur getDepartementModules:', error)
    return { success: false, error: 'Erreur lors de la récupération des modules' }
  }
}

// Obtenir les classes du département (via filières)
export const getDepartementClasses = async (departementId) => {
  try {
    if (!departementId) {
      return { success: false, error: 'ID de département manquant' }
    }

    const filiereIds = await getScopedFiliereIdsForDepartement(departementId)
    if (!filiereIds.length) {
      return { success: true, classes: [] }
    }

    // 2. Récupérer les classes liées à ces filières
    const { data: classes, error: classesError } = await supabaseAdmin
      .from('classes')
      .select('*, filieres(nom, code), niveaux(nom, code)')
      .in('filiere_id', filiereIds)
      .order('nom')

    if (classesError) throw classesError

    // Mapper les données pour inclure le niveau et la filière
    const classesMapped = (classes || []).map(classe => ({
      ...classe,
      filiereId: classe.filiere_id,
      niveauCode: classe.niveaux?.code,
      niveauNom: classe.niveaux?.nom
    }))

    return { success: true, classes: classesMapped }
  } catch (error) {
    console.error('Erreur getDepartementClasses:', error)
    return { success: false, error: 'Erreur lors de la récupération des classes' }
  }
}

// Obtenir les filières du département
export const getDepartementFilieres = async (departementId) => {
  try {
    if (!departementId) {
      return { success: false, error: 'ID de département manquant' }
    }

    // Récupération principale par departement_id
    const { data: filieres, error } = await supabaseAdmin
      .from('filieres')
      .select('*, departements(code)')
      .eq('departement_id', departementId)
      .order('code', { ascending: true })

    if (error) throw error

    let filieresFinales = Array.isArray(filieres) ? [...filieres] : []

    // Fallback MTIC: certaines anciennes données peuvent avoir un departement_id incohérent
    // pour les parcours MMI/MTIC. On les rattache visuellement au dashboard MTIC.
    const depCode = filieresFinales[0]?.departements?.code
    if (depCode === 'MTIC') {
      const codesMTIC = [
        'MTIC',
        'TC',
        'MMI',
        'MMI-WM',
        'MMI-ED',
        'MMI-Web-Mastering',
        'MMI-Ecommerce-Digital',
        'MTIC-TC',
        'MTIC-EMCD'
      ]

      const { data: filieresLegacy, error: legacyError } = await supabaseAdmin
        .from('filieres')
        .select('*, departements(code)')
        .in('code', codesMTIC)
        .order('code', { ascending: true })

      if (!legacyError && Array.isArray(filieresLegacy) && filieresLegacy.length > 0) {
        const byId = new Map()
        for (const f of filieresFinales) byId.set(f.id, f)
        for (const f of filieresLegacy) byId.set(f.id, f)
        filieresFinales = Array.from(byId.values())
          .sort((a, b) => (a.code || '').localeCompare(b.code || ''))
      }
    }

    return { success: true, filieres: filieresFinales }
  } catch (error) {
    console.error('Erreur getDepartementFilieres:', error)
    return { success: false, error: 'Erreur lors de la récupération des filières' }
  }
}

export const getNiveaux = async () => {
  try {
    const { data: niveaux, error } = await supabaseAdmin
      .from('niveaux')
      .select('*')
      .order('code')

    if (error) throw error
    return { success: true, niveaux }
  } catch (error) {
    console.error("Erreur detailed getNiveaux:", error)
    return { success: false, error: error.message || 'Erreur récupération niveaux' }
  }
}

// Obtenir les statistiques globales (pour les graphes)
export const getDepartementStatsGlobales = async (departementId) => {
  try {
    if (!departementId) {
      return { success: false, error: 'ID de département manquant' }
    }

    // 1. Récupérer les filières du département (scope robuste MTIC)
    const filieres = (await getScopedFilieresForDepartement(departementId))
      .filter((f) => f.type_filiere !== 'groupe')

    if (!filieres || filieres.length === 0) {
      return {
        success: true,
        stats: {
          totalClasses: 0,
          totalEnseignants: 0,
          totalEtudiants: 0,
          studentsData: [],
          levelData: [],
          genreData: [],
          tauxReussiteData: []
        }
      }
    }

    const filiereIds = filieres.map(f => f.id)

    // 2. Paralléliser les requêtes initiales
    const [
      classesCountResult,
      enseignantsCountResult,
      inscriptionsResult,
      modulesResult
    ] = await Promise.all([
      // Compter les classes
      supabaseAdmin
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .in('filiere_id', filiereIds),
      // Compter les enseignants
      supabaseAdmin
        .from('enseignants')
        .select('*', { count: 'exact', head: true })
        .eq('departement_id', departementId)
        .eq('actif', true),
      // Récupérer les inscriptions actives
      supabaseAdmin
        .from('inscriptions')
        .select(`
          id,
          filiere_id,
          niveau_id,
          statut,
          classe_id,
          etudiants (
            id,
            sexe
          ),
          niveaux (
            code,
            nom
          )
        `)
        .in('filiere_id', filiereIds)
        .eq('statut', 'INSCRIT'),
      // Modules du département pour le dashboard
      supabaseAdmin
        .from('modules')
        .select('id, filiere_id, credit')
        .in('filiere_id', filiereIds)
        .eq('departement_id', departementId)
    ])

    const classesCount = classesCountResult.count || 0
    const enseignantsCount = enseignantsCountResult.count || 0

    if (inscriptionsResult.error) throw inscriptionsResult.error
    const inscriptions = inscriptionsResult.data || []
    if (modulesResult.error) throw modulesResult.error
    const modulesDepartement = modulesResult.data || []

    const totalEtudiants = inscriptions?.length || 0

    // Modules par filière (information de pilotage dashboard)
    const modulesParFiliere = filieres.map((f) => {
      const modules = modulesDepartement.filter((m) => m.filiere_id === f.id)
      const creditsTotal = modules.reduce((acc, m) => acc + (Number(m.credit) || 0), 0)
      return {
        filiere: f.code,
        modules: modules.length,
        creditsTotal
      }
    }).sort((a, b) => b.modules - a.modules)

    // 5. Répartition par filière
    const studentsData = filieres.map(f => {
      const count = inscriptions.filter(i => i.filiere_id === f.id).length
      return {
        name: f.code,
        value: count,
        color: f.code === 'GI' ? '#3b82f6' :
          f.code === 'RT' ? '#8b5cf6' :
            (f.code === 'MTIC' || f.code === 'TC' || (f.code && String(f.code).startsWith('MMI-'))) ? '#10b981' :
              f.code === 'AV' ? '#f59e0b' : '#6366f1'
      }
    }).filter(item => item.value > 0) // Ne garder que les filières avec des étudiants

    // 6. Répartition par niveau
    const levelCounts = {}
    inscriptions.forEach(i => {
      const codeNiveau = i.niveaux?.code || 'Inconnu'
      levelCounts[codeNiveau] = (levelCounts[codeNiveau] || 0) + 1
    })
    const levelData = Object.keys(levelCounts)
      .sort() // Trier L1, L2, L3
      .map(lvl => ({
        niveau: lvl,
        etudiants: levelCounts[lvl]
      }))

    // 7. Répartition par genre (DONNÉES RÉELLES maintenant)
    let masculinCount = 0
    let femininCount = 0

    inscriptions.forEach(i => {
      if (i.etudiants?.sexe === 'M') {
        masculinCount++
      } else if (i.etudiants?.sexe === 'F') {
        femininCount++
      }
    })

    const total = masculinCount + femininCount
    const genreData = total > 0 ? [
      {
        name: 'Masculin',
        value: masculinCount,
        color: '#3b82f6',
        percentage: Math.round((masculinCount / total) * 100)
      },
      {
        name: 'Féminin',
        value: femininCount,
        color: '#ec4899',
        percentage: Math.round((femininCount / total) * 100)
      }
    ] : []

    // 8. Taux de réussite par filière (optimisé - récupérer toutes les données en une fois)
    const tauxReussiteData = []

    // Récupérer toutes les classes en une seule requête
    const { data: toutesClasses } = await supabaseAdmin
      .from('classes')
      .select('id, filiere_id')
      .in('filiere_id', filiereIds)

    if (toutesClasses && toutesClasses.length > 0) {
      const toutesClasseIds = toutesClasses.map(c => c.id)

      // Récupérer tous les modules en une seule requête
      const { data: tousModules } = await supabaseAdmin
        .from('modules')
        .select('id, code, credit, semestre, filiere_id')
        .in('filiere_id', filiereIds)
        .eq('departement_id', departementId)

      // Récupérer tous les paramètres de notation en une seule requête
      const moduleIds = tousModules ? tousModules.map(m => m.id) : []
      const { data: tousParametres } = moduleIds.length > 0
        ? await supabaseAdmin
          .from('parametres_notation')
          .select('module_id, evaluations, semestre')
          .in('module_id', moduleIds)
        : { data: [] }

      // Récupérer toutes les notes en une seule requête (limité pour performance)
      const { data: toutesNotes } = toutesClasseIds.length > 0 && moduleIds.length > 0
        ? await supabaseAdmin
          .from('notes')
          .select('etudiant_id, module_id, valeur, evaluation_id, classe_id, semestre')
          .in('classe_id', toutesClasseIds)
          .in('module_id', moduleIds)
          .limit(10000) // Limiter pour performance
        : { data: [] }

      // Calculer le taux de réussite par filière
      for (const filiere of filieres) {
        const classesFiliere = toutesClasses.filter(c => c.filiere_id === filiere.id)
        const classeIdsFiliere = classesFiliere.map(c => c.id)
        const totalEtudiantsFiliere = inscriptions.filter(i => classeIdsFiliere.includes(i.classe_id)).length

        if (totalEtudiantsFiliere === 0 || !tousModules) {
          tauxReussiteData.push({
            filiere: filiere.code,
            tauxReussite: 0,
            etudiantsAvecNotes: 0,
            totalEtudiants: totalEtudiantsFiliere,
            etudiantsReussis: 0
          })
          continue
        }

        const modulesFiliere = tousModules.filter(m => m.filiere_id === filiere.id)
        const moduleIdsFiliere = modulesFiliere.map(m => m.id)
        const parametresMap = {}

        if (tousParametres) {
          tousParametres
            .filter(p => moduleIdsFiliere.includes(p.module_id))
            .forEach(p => {
              parametresMap[p.module_id] = p.evaluations || []
            })
        }

        // Filtrer les notes pour cette filière
        const notesFiliere = toutesNotes
          ? toutesNotes.filter(n =>
            classeIdsFiliere.includes(n.classe_id) &&
            moduleIdsFiliere.includes(n.module_id)
          )
          : []

        if (notesFiliere.length === 0) {
          tauxReussiteData.push({
            filiere: filiere.code,
            tauxReussite: 0,
            etudiantsAvecNotes: 0,
            totalEtudiants: totalEtudiantsFiliere,
            etudiantsReussis: 0
          })
          continue
        }

        // Grouper par étudiant puis par semestre (évite de compter 2× la même personne S1/S2)
        const notesParEtudiant = {}
        notesFiliere.forEach(note => {
          const eid = note.etudiant_id
          if (!notesParEtudiant[eid]) notesParEtudiant[eid] = {}
          const sem = note.semestre
          if (!notesParEtudiant[eid][sem]) notesParEtudiant[eid][sem] = []
          notesParEtudiant[eid][sem].push(note)
        })

        const moyenneSemestre = (notesEtudiant, semestre) => {
          const modulesSemestre = modulesFiliere.filter(m => m.semestre === semestre)
          let totalPointsSemestre = 0
          let totalCreditsSemestre = 0

          modulesSemestre.forEach(module => {
            const evaluationsConfig = parametresMap[module.id] || []
            let totalPointsModule = 0
            let totalCoeffModule = 0

            evaluationsConfig.forEach(evaluation => {
              for (let i = 1; i <= evaluation.nombreEvaluations; i++) {
                const evalId = `${evaluation.id}_${i}`
                const noteEntry = notesEtudiant.find(n =>
                  n.module_id === module.id &&
                  n.evaluation_id === evalId
                )

                if (noteEntry) {
                  const noteSur20 = (noteEntry.valeur / evaluation.noteMax) * 20
                  totalPointsModule += noteSur20 * evaluation.coefficient
                  totalCoeffModule += evaluation.coefficient
                }
              }
            })

            if (totalCoeffModule > 0) {
              const moyenneModule = totalPointsModule / totalCoeffModule
              totalPointsSemestre += moyenneModule * module.credit
              totalCreditsSemestre += module.credit
            }
          })

          if (totalCreditsSemestre <= 0) return null
          return totalPointsSemestre / totalCreditsSemestre
        }

        let etudiantsReussis = 0
        let etudiantsAvecNotes = 0

        for (const etudiantId of Object.keys(notesParEtudiant)) {
          const parSem = notesParEtudiant[etudiantId]
          let aDesNotesSaisies = false
          let estReussi = true

          for (const semestre of Object.keys(parSem)) {
            const mg = moyenneSemestre(parSem[semestre], semestre)
            if (mg === null) continue
            aDesNotesSaisies = true
            if (mg < 10) estReussi = false
          }

          if (aDesNotesSaisies) {
            etudiantsAvecNotes++
            if (estReussi) etudiantsReussis++
          }
        }

        // Taux sur l’effectif inscrit dans les classes de la filière (pas sur le double comptage semestriel)
        const tauxReussite = totalEtudiantsFiliere > 0
          ? Math.round((etudiantsReussis / totalEtudiantsFiliere) * 100)
          : 0

        tauxReussiteData.push({
          filiere: filiere.code,
          tauxReussite,
          etudiantsAvecNotes,
          totalEtudiants: totalEtudiantsFiliere,
          etudiantsReussis
        })
      }
    } else {
      // Aucune classe, retourner des valeurs par défaut
      filieres.forEach(f => {
        tauxReussiteData.push({
          filiere: f.code,
          tauxReussite: 0,
          etudiantsAvecNotes: 0,
          totalEtudiants: 0,
          etudiantsReussis: 0
        })
      })
    }

    return {
      success: true,
      stats: {
        totalClasses: classesCount || 0,
        totalEnseignants: enseignantsCount || 0,
        totalEtudiants: totalEtudiants,
        studentsData,
        modulesParFiliere,
        levelData,
        genreData,
        tauxReussiteData
      }
    }

  } catch (error) {
    console.error('Erreur getDepartementStatsGlobales:', error)
    return { success: false, error: 'Erreur récupération stats' }
  }
}

// Récupérer les meilleurs étudiants par filière
export const getMeilleursEtudiantsParFiliere = async (departementId) => {
  try {
    if (!departementId) {
      return { success: false, error: 'ID de département manquant' }
    }

    const filieres = (await getScopedFilieresForDepartement(departementId))
      .filter((f) => f.type_filiere !== 'groupe')

    if (!filieres || filieres.length === 0) {
      return { success: true, data: {} }
    }

    const result = {}

    // Pour chaque filière, calculer les meilleurs étudiants
    for (const filiere of filieres) {
      try {
        // Récupérer les classes de cette filière
        const { data: classes } = await supabaseAdmin
          .from('classes')
          .select('id, nom, code, niveaux(code)')
          .eq('filiere_id', filiere.id)

        if (!classes || classes.length === 0) {
          result[filiere.id] = []
          continue
        }

        const classeIds = classes.map(c => c.id)

        // Pour chaque classe, calculer les moyennes des étudiants
        const etudiantsAvecMoyennes = []

        for (const classe of classes) {
          const niveauCode = classe.niveaux?.code
          if (!niveauCode) continue

          // Déterminer les semestres autorisés pour ce niveau
          const semestresAutorises = {
            'L1': ['S1', 'S2'],
            'L2': ['S3', 'S4'],
            'L3': ['S5', 'S6']
          }[niveauCode] || []

          // Pour chaque semestre, calculer les moyennes
          for (const semestre of semestresAutorises) {
            // Récupérer les modules de cette filière et ce semestre
            const { data: modules } = await supabaseAdmin
              .from('modules')
              .select('id, code, nom, credit, semestre')
              .eq('filiere_id', filiere.id)
              .eq('departement_id', departementId)
              .eq('semestre', semestre)

            if (!modules || modules.length === 0) continue

            const moduleIds = modules.map(m => m.id)

            // Récupérer les paramètres de notation
            const { data: parametresList } = await supabaseAdmin
              .from('parametres_notation')
              .select('module_id, evaluations')
              .in('module_id', moduleIds)
              .eq('semestre', semestre)

            const parametresMap = {}
            if (parametresList) {
              parametresList.forEach(p => {
                parametresMap[p.module_id] = p.evaluations || []
              })
            }

            // Récupérer les notes pour cette classe et ce semestre
            const { data: notes } = await supabaseAdmin
              .from('notes')
              .select('etudiant_id, module_id, valeur, evaluation_id')
              .eq('classe_id', classe.id)
              .eq('semestre', semestre)
              .in('module_id', moduleIds)

            if (!notes || notes.length === 0) continue

            // Calculer les moyennes pour chaque étudiant
            // Récupérer les inscriptions de cette classe
            const { data: inscriptionsClasse } = await supabaseAdmin
              .from('inscriptions')
              .select('etudiants(id, nom, prenom, matricule)')
              .eq('classe_id', classe.id)
              .eq('statut', 'INSCRIT')

            const etudiantsClasse = inscriptionsClasse
              ?.map(i => i.etudiants)
              .filter(e => e !== null && e !== undefined) || []

            etudiantsClasse.forEach(etudiant => {
              let totalPointsSemestre = 0
              let totalCreditsSemestre = 0
              let totalCreditsValides = 0

              modules.forEach(module => {
                const evaluationsConfig = parametresMap[module.id] || []
                let totalPointsModule = 0
                let totalCoeffModule = 0

                evaluationsConfig.forEach(evaluation => {
                  for (let i = 1; i <= evaluation.nombreEvaluations; i++) {
                    const evalId = `${evaluation.id}_${i}`
                    const noteEntry = notes.find(n =>
                      n.etudiant_id === etudiant.id &&
                      n.module_id === module.id &&
                      n.evaluation_id === evalId
                    )

                    if (noteEntry) {
                      const noteSur20 = (noteEntry.valeur / evaluation.noteMax) * 20
                      totalPointsModule += noteSur20 * evaluation.coefficient
                      totalCoeffModule += evaluation.coefficient
                    }
                  }
                })

                if (totalCoeffModule > 0) {
                  const moyenneModule = totalPointsModule / totalCoeffModule
                  if (moyenneModule >= 10) {
                    totalCreditsValides += module.credit
                  }
                  totalPointsSemestre += moyenneModule * module.credit
                  totalCreditsSemestre += module.credit
                }
              })

              if (totalCreditsSemestre > 0) {
                const moyenneGenerale = totalPointsSemestre / totalCreditsSemestre
                const statut = moyenneGenerale >= 10 ? 'VALIDE' : 'AJOURNE'

                // Vérifier si l'étudiant existe déjà dans la liste (par semestre)
                const key = `${etudiant.id}_${semestre}`
                const existingIndex = etudiantsAvecMoyennes.findIndex(e =>
                  e.id === etudiant.id && e.semestre === semestre
                )

                if (existingIndex >= 0) {
                  // Mettre à jour si la moyenne est meilleure
                  if (moyenneGenerale > etudiantsAvecMoyennes[existingIndex].moyenneGenerale) {
                    etudiantsAvecMoyennes[existingIndex] = {
                      ...etudiant,
                      classe: classe.nom || classe.code,
                      semestre,
                      moyenneGenerale: parseFloat(moyenneGenerale.toFixed(2)),
                      totalCreditsValides,
                      statut
                    }
                  }
                } else {
                  etudiantsAvecMoyennes.push({
                    ...etudiant,
                    classe: classe.nom || classe.code,
                    semestre,
                    moyenneGenerale: parseFloat(moyenneGenerale.toFixed(2)),
                    totalCreditsValides,
                    statut
                  })
                }
              }
            })
          }
        }

        // Grouper par étudiant et prendre la meilleure moyenne
        const etudiantsUniques = {}
        etudiantsAvecMoyennes.forEach(etudiant => {
          if (!etudiantsUniques[etudiant.id] ||
            etudiant.moyenneGenerale > etudiantsUniques[etudiant.id].moyenneGenerale) {
            etudiantsUniques[etudiant.id] = etudiant
          }
        })

        // Trier par moyenne générale décroissante
        const etudiantsTries = Object.values(etudiantsUniques)
          .sort((a, b) => (b.moyenneGenerale || 0) - (a.moyenneGenerale || 0))

        result[filiere.id] = etudiantsTries || []
      } catch (error) {
        console.error(`Erreur calcul meilleurs étudiants pour ${filiere.code}:`, error)
        result[filiere.id] = []
      }
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('Erreur getMeilleursEtudiantsParFiliere:', error)
    return { success: false, error: 'Erreur lors de la récupération des meilleurs étudiants' }
  }
}

// Récupérer les étudiants pour la répartition (non encore assignés à une classe)
export const getEtudiantsPourRepartition = async (departementId, filiereId, niveauId, formation = null) => {
  try {
    // Vérifier que la filière appartient au département
    const { data: filiere, error: filiereError } = await supabaseAdmin
      .from('filieres')
      .select('id, departement_id, type_filiere')
      .eq('id', filiereId)
      .single()

    if (filiereError || !filiere) {
      return { success: false, error: 'Filière introuvable' }
    }

    if (filiere.departement_id !== departementId) {
      return { success: false, error: 'Cette filière n\'appartient pas à votre département' }
    }

    if (filiere.type_filiere === 'groupe') {
      return { success: false, error: 'Choisissez un parcours (sous-filière), pas la filière parente seule.' }
    }

    let formationIds = []

    // Si une formation spécifique est sélectionnée, récupérer seulement cette formation
    if (formation) {
      const codeFormation = formation === 'Initiale1' ? 'INITIAL_1' : formation === 'Initiale2' ? 'INITIAL_2' : null
      if (codeFormation) {
        const { data: formationData, error: formationError } = await supabaseAdmin
          .from('formations')
          .select('id')
          .eq('code', codeFormation)
          .single()

        if (formationError) {
          console.error('Erreur récupération formation:', formationError)
          return { success: false, error: 'Formation introuvable' }
        }

        if (formationData) {
          formationIds = [formationData.id]
        } else {
          console.log(`Aucune formation trouvée pour le code: ${codeFormation}`)
          return { success: true, count: 0, etudiants: [] }
        }
      }
    } else {
      // Si aucune formation spécifiée, récupérer Initiale 1 et Initiale 2
      const { data: formations } = await supabaseAdmin
        .from('formations')
        .select('id')
        .in('code', ['INITIAL_1', 'INITIAL_2'])

      formationIds = formations ? formations.map(f => f.id) : []
    }

    // Récupérer les inscriptions sans classe assignée
    // Accepter les statuts INSCRIT et VALIDEE
    let query = supabaseAdmin
      .from('inscriptions')
      .select(`
        id,
        date_inscription,
        statut,
        formation_id,
        etudiants (
          id,
          matricule,
          nom,
          prenom,
          email,
          telephone
        )
      `)
      .eq('filiere_id', filiereId)
      .eq('niveau_id', niveauId)
      .in('statut', ['INSCRIT', 'VALIDEE', 'EN_ATTENTE']) // Ajouter EN_ATTENTE pour les étudiants récemment créés
      .is('classe_id', null)

    // Filtrer par formation(s) si spécifiée(s)
    if (formationIds.length > 0) {
      query = query.in('formation_id', formationIds)
    }
    // Si aucune formation spécifiée, on ne filtre pas par formation (on prend toutes les formations)

    const { data: inscriptions, error } = await query.order('date_inscription', { ascending: true })

    if (error) {
      console.error('Erreur lors de la récupération des inscriptions:', error)
      throw error
    }

    console.log(`[DEBUG] getEtudiantsPourRepartition - Filtres:`, {
      departementId,
      filiereId,
      niveauId,
      formation,
      formationIds,
      inscriptionsCount: inscriptions?.length || 0,
      inscriptions: inscriptions?.map(i => ({
        id: i.id,
        statut: i.statut,
        formation_id: i.formation_id,
        etudiant: `${i.etudiants?.nom} ${i.etudiants?.prenom}`
      }))
    })

    // Formater les données
    const etudiants = (inscriptions || []).map(i => ({
      inscriptionId: i.id,
      ...i.etudiants
    }))

    return {
      success: true,
      count: etudiants.length,
      etudiants
    }
  } catch (error) {
    console.error('Erreur getEtudiantsPourRepartition:', error)
    return { success: false, error: error.message }
  }
}

// Créer les classes et répartir les étudiants
export const createClassesFromRepartition = async (data) => {
  try {
    const { filiereId, niveauId, nombreClasses, namingPattern, typeRepartition, formation = null } = data
    // namingPattern ex: "GI-L1" -> classes seront "GI-L1-A", "GI-L1-B"

    // Récupérer l'ID de la formation si spécifiée
    let formationId = null
    if (formation) {
      const codeFormation = formation === 'Initiale1' ? 'INITIAL_1' : formation === 'Initiale2' ? 'INITIAL_2' : null
      if (codeFormation) {
        const { data: formationData } = await supabaseAdmin
          .from('formations')
          .select('id')
          .eq('code', codeFormation)
          .single()

        if (formationData) {
          formationId = formationData.id
        }
      }
    }

    // 1. Récupérer les étudiants non assignés pour la formation spécifiée
    let formationIds = []
    if (formation) {
      const codeFormation = formation === 'Initiale1' ? 'INITIAL_1' : formation === 'Initiale2' ? 'INITIAL_2' : null
      if (codeFormation) {
        const { data: formationData } = await supabaseAdmin
          .from('formations')
          .select('id')
          .eq('code', codeFormation)
          .single()

        if (formationData) {
          formationIds = [formationData.id]
        }
      }
    } else {
      // Si aucune formation spécifiée, récupérer Initiale 1 et Initiale 2
      const { data: formations } = await supabaseAdmin
        .from('formations')
        .select('id')
        .in('code', ['INITIAL_1', 'INITIAL_2'])

      formationIds = formations ? formations.map(f => f.id) : []
    }

    let query = supabaseAdmin
      .from('inscriptions')
      .select('id')
      .eq('filiere_id', filiereId)
      .eq('niveau_id', niveauId)
      .in('statut', ['INSCRIT', 'VALIDEE', 'EN_ATTENTE'])
      .is('classe_id', null)

    // Filtrer par formation(s) si spécifiée(s)
    if (formationIds.length > 0) {
      query = query.in('formation_id', formationIds)
    }

    const { data: inscriptions, error: inscError } = await query.order('date_inscription', { ascending: true })

    if (inscError) throw inscError

    const totalEtudiants = (inscriptions || []).length

    // 2. Créer les classes
    const createdClasses = []
    const letters = ['A', 'B', 'C', 'D', 'E', 'F']

    for (let i = 0; i < nombreClasses; i++) {
      const suffix = nombreClasses > 1 ? `-${letters[i]}` : ''
      const codeClasse = `${namingPattern}${suffix}`
      const nomClasse = `${namingPattern}${suffix ? ` ${letters[i]}` : ''}`

      const { data: newClass, error } = await supabaseAdmin
        .from('classes')
        .insert({
          code: codeClasse,
          nom: nomClasse,
          filiere_id: filiereId,
          niveau_id: niveauId,
          formation_id: formationId, // Lier la classe à la formation
          effectif: 0
        })
        .select()
        .single()

      if (error) throw error
      createdClasses.push(newClass)
    }

    // 3. Répartir les étudiants équitablement
    if (totalEtudiants > 0 && createdClasses.length > 0) {
      const etudiantsParClasse = Math.ceil(totalEtudiants / nombreClasses)

      for (let i = 0; i < createdClasses.length; i++) {
        const classe = createdClasses[i]
        const start = i * etudiantsParClasse
        const end = Math.min(start + etudiantsParClasse, totalEtudiants)
        const inscriptionsToAssign = inscriptions.slice(start, end)

        if (inscriptionsToAssign.length > 0) {
          // Assigner les étudiants à cette classe
          const { error: updateError } = await supabaseAdmin
            .from('inscriptions')
            .update({ classe_id: classe.id })
            .in('id', inscriptionsToAssign.map(i => i.id))

          if (updateError) throw updateError

          // Mettre à jour l'effectif de la classe
          await supabaseAdmin
            .from('classes')
            .update({ effectif: inscriptionsToAssign.length })
            .eq('id', classe.id)
        }
      }
    }

    return { success: true, classes: createdClasses, etudiantsRepartis: totalEtudiants }

  } catch (error) {
    console.error('Erreur createClassesFromRepartition:', error)
    return { success: false, error: error.message }
  }
}

// Récupérer les classes existantes pour une filière, un niveau et une formation
export const getClassesExistantes = async (departementId, filiereId, niveauId, formation = null) => {
  try {
    // Vérifier que la filière appartient au département
    const { data: filiere, error: filiereError } = await supabaseAdmin
      .from('filieres')
      .select('id, departement_id, type_filiere')
      .eq('id', filiereId)
      .single()

    if (filiereError || !filiere) {
      return { success: false, error: 'Filière introuvable' }
    }

    if (filiere.departement_id !== departementId) {
      return { success: false, error: 'Cette filière n\'appartient pas à votre département' }
    }

    if (filiere.type_filiere === 'groupe') {
      return { success: false, error: 'Choisissez un parcours (sous-filière), pas la filière parente seule.' }
    }

    // Récupérer l'ID de la formation si spécifiée
    let formationId = null
    if (formation) {
      const codeFormation = formation === 'Initiale1' ? 'INITIAL_1' : formation === 'Initiale2' ? 'INITIAL_2' : null
      if (codeFormation) {
        const { data: formationData, error: formationError } = await supabaseAdmin
          .from('formations')
          .select('id')
          .eq('code', codeFormation)
          .single()

        if (formationError) {
          console.error('Erreur récupération formation:', formationError)
          return { success: false, error: 'Formation introuvable' }
        }

        if (formationData) {
          formationId = formationData.id
        }
      }
    }

    // Récupérer les classes existantes pour cette filière, ce niveau et cette formation
    let query = supabaseAdmin
      .from('classes')
      .select('id, code, nom, effectif, formation_id')
      .eq('filiere_id', filiereId)
      .eq('niveau_id', niveauId)

    // Filtrer par formation si spécifiée
    if (formationId) {
      query = query.eq('formation_id', formationId)
    } else {
      // Si aucune formation spécifiée, inclure les classes sans formation_id (pour compatibilité avec les anciennes classes)
      query = query.or('formation_id.is.null')
    }

    const { data: classes, error: classesError } = await query.order('code', { ascending: true })

    if (classesError) {
      console.error('Erreur lors de la récupération des classes:', classesError)
      throw classesError
    }

    console.log(`[DEBUG] getClassesExistantes - Résultat final:`, {
      departementId,
      filiereId,
      niveauId,
      formation,
      formationId,
      classesTrouvees: classes?.length || 0,
      classes: classes?.map(c => ({ id: c.id, code: c.code, nom: c.nom, effectif: c.effectif, formation_id: c.formation_id }))
    })

    return {
      success: true,
      classes: classes || []
    }
  } catch (error) {
    console.error('Erreur getClassesExistantes:', error)
    return { success: false, error: error.message }
  }
}

// Affecter plusieurs étudiants à une classe existante
export const affecterEtudiantsAClasse = async (departementId, filiereId, niveauId, classeId, inscriptionIds, formation = null) => {
  try {
    // Vérifier que la classe appartient au département et correspond à la filière/niveau/formation
    const { data: classe, error: classeError } = await supabaseAdmin
      .from('classes')
      .select('*, filieres (id, departement_id)')
      .eq('id', classeId)
      .single()

    if (classeError || !classe) {
      return { success: false, error: 'Classe introuvable' }
    }

    if (classe.filieres?.departement_id !== departementId) {
      return { success: false, error: 'Cette classe n\'appartient pas à votre département' }
    }

    if (classe.filiere_id !== filiereId || classe.niveau_id !== niveauId) {
      return { success: false, error: 'La classe ne correspond pas à la filière et au niveau sélectionnés' }
    }

    // Vérifier la formation si spécifiée
    if (formation) {
      const codeFormation = formation === 'Initiale1' ? 'INITIAL_1' : formation === 'Initiale2' ? 'INITIAL_2' : null
      if (codeFormation) {
        const { data: formationData } = await supabaseAdmin
          .from('formations')
          .select('id')
          .eq('code', codeFormation)
          .single()

        if (formationData && classe.formation_id !== formationData.id) {
          return { success: false, error: 'La classe ne correspond pas à la formation sélectionnée' }
        }
      }
    }

    // Vérifier la formation si spécifiée
    if (formation) {
      const codeFormation = formation === 'Initiale1' ? 'INITIAL_1' : formation === 'Initiale2' ? 'INITIAL_2' : null
      if (codeFormation) {
        const { data: formationData } = await supabaseAdmin
          .from('formations')
          .select('id')
          .eq('code', codeFormation)
          .single()

        if (formationData && classe.formation_id !== formationData.id) {
          return { success: false, error: 'La classe ne correspond pas à la formation sélectionnée' }
        }
      }
    }

    // Vérifier que les inscriptions existent et correspondent aux critères
    const { data: inscriptions, error: inscError } = await supabaseAdmin
      .from('inscriptions')
      .select('id')
      .in('id', inscriptionIds)
      .eq('filiere_id', filiereId)
      .eq('niveau_id', niveauId)
      .is('classe_id', null)

    if (inscError) throw inscError

    if (!inscriptions || inscriptions.length === 0) {
      return { success: false, error: 'Aucune inscription valide trouvée' }
    }

    const validInscriptionIds = inscriptions.map(i => i.id)

    // Affecter les étudiants à la classe
    const { error: updateError } = await supabaseAdmin
      .from('inscriptions')
      .update({ classe_id: classeId })
      .in('id', validInscriptionIds)

    if (updateError) throw updateError

    // Mettre à jour l'effectif de la classe
    const nouveauEffectif = (classe.effectif || 0) + validInscriptionIds.length
    const { error: effectifError } = await supabaseAdmin
      .from('classes')
      .update({ effectif: nouveauEffectif })
      .eq('id', classeId)

    if (effectifError) throw effectifError

    return {
      success: true,
      message: `${validInscriptionIds.length} étudiant(s) affecté(s) à la classe ${classe.code}`,
      etudiantsAffectes: validInscriptionIds.length
    }
  } catch (error) {
    console.error('Erreur affecterEtudiantsAClasse:', error)
    return { success: false, error: error.message }
  }
}

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

/**
 * Récupère TOUS les étudiants d'une filière/niveau/formation pour la répartition manuelle
 * Inclut ceux qui ont déjà une classe.
 */
export const getEtudiantsPourRepartitionManuelle = async (departementId, filiereId, niveauId, formation = null) => {
  try {
    // Vérifier que la filière appartient au département
    const { data: filiere, error: filiereError } = await supabaseAdmin
      .from('filieres')
      .select('id, departement_id, type_filiere')
      .eq('id', filiereId)
      .single()

    if (filiereError || !filiere) {
      return { success: false, error: 'Filière introuvable' }
    }

    if (filiere.departement_id !== departementId) {
      return { success: false, error: 'Cette filière n\'appartient pas à votre département' }
    }

    if (filiere.type_filiere === 'groupe') {
      return { success: false, error: 'Choisissez un parcours (sous-filière), pas la filière parente seule.' }
    }

    let formationIds = []
    if (formation) {
      const codeFormation = formation === 'Initiale1' ? 'INITIAL_1' : formation === 'Initiale2' ? 'INITIAL_2' : null
      if (codeFormation) {
        const { data: formationData } = await supabaseAdmin
          .from('formations')
          .select('id')
          .eq('code', codeFormation)
          .single()
        if (formationData) formationIds = [formationData.id]
      }
    } else {
      const { data: formations } = await supabaseAdmin
        .from('formations')
        .select('id')
        .in('code', ['INITIAL_1', 'INITIAL_2'])
      formationIds = formations ? formations.map(f => f.id) : []
    }

    let query = supabaseAdmin
      .from('inscriptions')
      .select(`
        id,
        date_inscription,
        statut,
        formation_id,
        classe_id,
        classes (
          id,
          code,
          nom
        ),
        etudiants (
          id,
          matricule,
          nom,
          prenom,
          email,
          telephone
        )
      `)
      .eq('filiere_id', filiereId)
      .eq('niveau_id', niveauId)
      .in('statut', ['INSCRIT', 'VALIDEE', 'EN_ATTENTE'])

    if (formationIds.length > 0) {
      query = query.in('formation_id', formationIds)
    }

    const { data: inscriptions, error } = await query.order('date_inscription', { ascending: true })

    if (error) throw error

    // Formater les données
    const etudiants = (inscriptions || []).map(i => ({
      inscriptionId: i.id,
      classeId: i.classe_id,
      classeCode: i.classes?.code || 'Non assigné',
      ...i.etudiants
    }))

    return {
      success: true,
      count: etudiants.length,
      etudiants
    }
  } catch (error) {
    console.error('Erreur getEtudiantsPourRepartitionManuelle:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Reclasse manuellement une liste d'étudiants dans une classe cible
 */
/**
 * Reclasse manuellement une liste d'étudiants dans une classe cible
 * @param {string} mode - 'remplacer' (vide la classe avant) ou 'ajouter' (conserve les membres)
 */
export const reclasserEtudiantsManuellement = async (departementId, filiereId, niveauId, classeId, inscriptionIds, mode = 'remplacer') => {
  try {
    // 1. Vérifier la classe cible
    const { data: classeCible, error: classeError } = await supabaseAdmin
      .from('classes')
      .select('*, filieres(id, departement_id)')
      .eq('id', classeId)
      .single()

    if (classeError || !classeCible) return { success: false, error: 'Classe cible introuvable' }
    if (classeCible.filieres?.departement_id !== departementId) return { success: false, error: 'Accès refusé' }

    // 2. Identifier les classes d'origine des nouveaux étudiants
    const { data: inscriptionsAvant } = await supabaseAdmin
      .from('inscriptions')
      .select('classe_id')
      .in('id', inscriptionIds)

    const classesOrigineIds = [...new Set(inscriptionsAvant.map(i => i.classe_id).filter(Boolean))]

    // 3. VIDER la classe cible SI mode 'remplacer'
    if (mode === 'remplacer') {
      const { error: clearError } = await supabaseAdmin
        .from('inscriptions')
        .update({ classe_id: null })
        .eq('classe_id', classeId)

      if (clearError) throw clearError
    }

    // 4. Mettre à jour les inscriptions avec la nouvelle sélection
    const { error: updateError } = await supabaseAdmin
      .from('inscriptions')
      .update({ classe_id: classeId })
      .in('id', inscriptionIds)
      .eq('filiere_id', filiereId)
      .eq('niveau_id', niveauId)

    if (updateError) throw updateError

    // 5. Mettre à jour l'effectif de la classe cible
    const { count: nouvelEffectifCible } = await supabaseAdmin
      .from('inscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('classe_id', classeId)
      .eq('statut', 'INSCRIT')

    await supabaseAdmin
      .from('classes')
      .update({ effectif: nouvelEffectifCible || 0 })
      .eq('id', classeId)

    // 6. Mettre à jour l'effectif des classes d'origine
    for (const orgId of classesOrigineIds) {
      if (orgId === classeId) continue

      const { count: effectifOrg } = await supabaseAdmin
        .from('inscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('classe_id', orgId)
        .eq('statut', 'INSCRIT')

      await supabaseAdmin
        .from('classes')
        .update({ effectif: effectifOrg || 0 })
        .eq('id', orgId)
    }

    const messagePrefix = mode === 'remplacer'
      ? `La classe ${classeCible.code} a été réinitialisée avec les ${inscriptionIds.length} étudiants.`
      : `${inscriptionIds.length} étudiant(s) ont été ajoutés à la classe ${classeCible.code}.`

    return {
      success: true,
      message: messagePrefix
    }
  } catch (error) {
    console.error('Erreur reclasserEtudiantsManuellement:', error)
    return { success: false, error: error.message }
  }
}
