import bcrypt from 'bcrypt'
import { supabaseAdmin } from '../lib/supabase.js'

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
        error: `Ce département est déjà assigné à ${existingChef.prenom} ${existingChef.nom}. Un département ne peut être assigné qu'à un seul chef.`
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
          details: `Chef de département créé : ${prenom} ${nom} (${departement.nom})`,
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
              error: `Ce département est déjà assigné à ${existingChefWithDept.prenom} ${existingChefWithDept.nom}. Un département ne peut être assigné qu'à un seul chef.`
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
          details: `Chef de département modifié : ${utilisateur.prenom} ${utilisateur.nom}`,
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
          details: `Chef de département supprimé : ${existingChef.prenom} ${existingChef.nom}`,
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

    // 1. Récupérer les filières du département
    const { data: filieres, error: filieresError } = await supabaseAdmin
      .from('filieres')
      .select('id, nom')
      .eq('departement_id', departementId)

    if (filieresError) throw filieresError

    if (!filieres || filieres.length === 0) {
      return { success: true, classes: [] }
    }

    const filiereIds = filieres.map(f => f.id)

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

    const { data: filieres, error } = await supabaseAdmin
      .from('filieres')
      .select('*')
      .eq('departement_id', departementId)
      .order('nom')

    if (error) throw error

    return { success: true, filieres }
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

    // 1. Récupérer les filières du département
    const { data: filieres } = await supabaseAdmin
      .from('filieres')
      .select('id, code, nom')
      .eq('departement_id', departementId)

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

    // 2. Compter les classes du département
    const { count: classesCount } = await supabaseAdmin
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .in('filiere_id', filiereIds)

    // 3. Compter les enseignants du département
    const { count: enseignantsCount } = await supabaseAdmin
      .from('enseignants')
      .select('*', { count: 'exact', head: true })
      .eq('departement_id', departementId)
      .eq('actif', true)

    // 4. Récupérer les inscriptions actives avec informations étudiants
    const { data: inscriptions, error } = await supabaseAdmin
      .from('inscriptions')
      .select(`
        id,
        filiere_id,
        niveau_id,
        statut,
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
      .eq('statut', 'INSCRIT')

    if (error) throw error

    const totalEtudiants = inscriptions?.length || 0

    // 5. Répartition par filière
    const studentsData = filieres.map(f => {
      const count = inscriptions.filter(i => i.filiere_id === f.id).length
      return {
        name: f.code,
        value: count,
        color: f.code === 'GI' ? '#3b82f6' :
          f.code === 'RT' ? '#8b5cf6' :
            f.code === 'MMIC' ? '#10b981' :
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

    // 8. Taux de réussite (mocké pour l'instant - nécessite calcul complexe avec notes)
    const tauxReussiteData = filieres
      .filter(f => studentsData.find(s => s.name === f.code))
      .map(f => ({
        filiere: f.code,
        tauxReussite: Math.floor(Math.random() * 15) + 75 // 75-90%
      }))

    return {
      success: true,
      stats: {
        totalClasses: classesCount || 0,
        totalEnseignants: enseignantsCount || 0,
        totalEtudiants: totalEtudiants,
        studentsData,
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

// Récupérer les étudiants pour la répartition (non encore assignés à une classe)
export const getEtudiantsPourRepartition = async (departementId, filiereId, niveauId) => {
  try {
    // Récupérer les inscriptions sans classe assignée
    const { data: inscriptions, error } = await supabaseAdmin
      .from('inscriptions')
      .select(`
        id,
        date_inscription,
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
      .eq('statut', 'INSCRIT')
      .is('classe_id', null)
      .order('date_inscription', { ascending: true })

    if (error) throw error

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
    const { filiereId, niveauId, nombreClasses, namingPattern, typeRepartition } = data
    // namingPattern ex: "GI-L1" -> classes seront "GI-L1-A", "GI-L1-B"

    // 1. Récupérer les étudiants non assignés
    const { data: inscriptions, error: inscError } = await supabaseAdmin
      .from('inscriptions')
      .select('id')
      .eq('filiere_id', filiereId)
      .eq('niveau_id', niveauId)
      .eq('statut', 'INSCRIT')
      .is('classe_id', null)
      .order('date_inscription', { ascending: true })

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
