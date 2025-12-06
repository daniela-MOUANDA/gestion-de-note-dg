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
