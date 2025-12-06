import bcrypt from 'bcrypt'
import { supabaseAdmin } from '../lib/supabase.js'

// Obtenir le roleId à partir d'un code de rôle
const getRoleIdByCode = async (roleCode) => {
  const { data: role, error } = await supabaseAdmin
    .from('roles')
    .select('id')
    .eq('code', roleCode)
    .single()
  
  return role?.id || null
}

// Mapper les rôles de l'interface vers les codes de rôle
const mapRoleToCode = (role) => {
  const roleMap = {
    'Agent': 'AGENT_SCOLARITE',
    'SP-Scolarité': 'SP_SCOLARITE',
    'AGENT_SCOLARITE': 'AGENT_SCOLARITE',
    'SP_SCOLARITE': 'SP_SCOLARITE'
  }
  return roleMap[role] || role
}

// Mapper les codes de rôle vers l'interface
const mapRoleToDisplay = (roleCode) => {
  const roleMap = {
    'AGENT_SCOLARITE': 'Agent',
    'SP_SCOLARITE': 'SP-Scolarité'
  }
  return roleMap[roleCode] || roleCode
}

// Créer un nouveau compte
export const createCompte = async (data, createdBy) => {
  try {
    const { nom, prenom, email, username, password, role, actif } = data

    // Validation
    if (!nom || !prenom || !email || !username || !password) {
      return {
        success: false,
        error: 'Tous les champs obligatoires doivent être remplis'
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

    // Vérifier si le username existe déjà
    const { data: usernameExists } = await supabaseAdmin
      .from('utilisateurs')
      .select('id')
      .eq('username', username.trim())
      .single()

    if (usernameExists) {
      return {
        success: false,
        error: 'Ce nom d\'utilisateur est déjà utilisé'
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Mapper le rôle et obtenir le roleId
    const roleCode = mapRoleToCode(role)
    const roleId = await getRoleIdByCode(roleCode)

    if (!roleId) {
      return {
        success: false,
        error: `Rôle ${roleCode} introuvable`
      }
    }

    // Créer l'utilisateur
    const { data: utilisateur, error: createError } = await supabaseAdmin
      .from('utilisateurs')
      .insert({
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: normalizedEmail,
        username: username.trim(),
        password: hashedPassword,
        role_id: roleId,
        actif: actif !== undefined ? actif : true
      })
      .select('*, roles (*)')
      .single()

    if (createError) {
      console.error('Erreur lors de la création:', createError)
      return {
        success: false,
        error: createError.message || 'Erreur lors de la création du compte'
      }
    }

    // Enregistrer dans l'audit
    if (createdBy) {
      await supabaseAdmin
        .from('actions_audit')
        .insert({
          utilisateur_id: createdBy,
          action: 'Création de compte',
          details: `Compte créé pour ${prenom} ${nom} (${roleCode})`,
          type_action: 'CONNEXION',
          date_action: new Date().toISOString()
        })
    }

    // Retourner les données sans le mot de passe
    const { password: _, ...userWithoutPassword } = utilisateur

    return {
      success: true,
      compte: {
        id: userWithoutPassword.id,
        nom: userWithoutPassword.nom,
        prenom: userWithoutPassword.prenom,
        email: userWithoutPassword.email,
        username: userWithoutPassword.username,
        role: mapRoleToDisplay(userWithoutPassword.roles?.code || 'UNKNOWN'),
        actif: userWithoutPassword.actif,
        dateCreation: userWithoutPassword.date_creation,
        derniereConnexion: userWithoutPassword.derniere_connexion
      }
    }
  } catch (error) {
    console.error('Erreur lors de la création du compte:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la création du compte'
    }
  }
}

// Obtenir tous les comptes (agents et SP-Scolarité uniquement)
export const getAllComptes = async () => {
  try {
    // Récupérer les IDs des rôles
    const { data: roleAgent } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('code', 'AGENT_SCOLARITE')
      .single()
    
    const { data: roleSP } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('code', 'SP_SCOLARITE')
      .single()

    if (!roleAgent || !roleSP) {
      return {
        success: false,
        error: 'Rôles introuvables'
      }
    }

    const { data: utilisateurs, error } = await supabaseAdmin
      .from('utilisateurs')
      .select('*, roles (*)')
      .in('role_id', [roleAgent.id, roleSP.id])
      .order('date_creation', { ascending: false })

    if (error) throw error

    const comptes = utilisateurs.map(u => ({
      id: u.id,
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      username: u.username,
      role: mapRoleToDisplay(u.roles?.code || 'UNKNOWN'),
      actif: u.actif,
      dateCreation: u.date_creation,
      derniereConnexion: u.derniere_connexion
    }))

    return {
      success: true,
      comptes
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des comptes:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des comptes'
    }
  }
}

// Mettre à jour un compte
export const updateCompte = async (id, data, updatedBy) => {
  try {
    const { nom, prenom, email, username, password, role, actif } = data

    // Vérifier si le compte existe
    const { data: existingCompte, error: fetchError } = await supabaseAdmin
      .from('utilisateurs')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingCompte) {
      return {
        success: false,
        error: 'Compte introuvable'
      }
    }

    // Normaliser l'email
    const normalizedEmail = email?.trim().toLowerCase()

    // Vérifier si l'email est déjà utilisé par un autre compte
    if (normalizedEmail && normalizedEmail !== existingCompte.email) {
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

    // Vérifier si le username est déjà utilisé par un autre compte
    if (username && username.trim() !== existingCompte.username) {
      const { data: usernameExists } = await supabaseAdmin
        .from('utilisateurs')
        .select('id')
        .eq('username', username.trim())
        .neq('id', id)
        .single()

      if (usernameExists) {
        return {
          success: false,
          error: 'Ce nom d\'utilisateur est déjà utilisé'
        }
      }
    }

    // Préparer les données de mise à jour
    const updateData = {}

    if (nom) updateData.nom = nom.trim()
    if (prenom) updateData.prenom = prenom.trim()
    if (normalizedEmail) updateData.email = normalizedEmail
    if (username) updateData.username = username.trim()
    if (actif !== undefined) updateData.actif = actif

    // Mettre à jour le rôle si fourni
    if (role) {
      const roleCode = mapRoleToCode(role)
      const roleId = await getRoleIdByCode(roleCode)
      if (roleId) {
        updateData.role_id = roleId
      }
    }

    // Hasher le nouveau mot de passe si fourni
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Mettre à jour le compte
    const { data: utilisateur, error: updateError } = await supabaseAdmin
      .from('utilisateurs')
      .update(updateData)
      .eq('id', id)
      .select('*, roles (*)')
      .single()

    if (updateError) throw updateError

    // Enregistrer dans l'audit
    if (updatedBy) {
      await supabaseAdmin
        .from('actions_audit')
        .insert({
          utilisateur_id: updatedBy,
          action: 'Modification de compte',
          details: `Compte modifié pour ${utilisateur.prenom} ${utilisateur.nom}`,
          type_action: 'CONNEXION',
          date_action: new Date().toISOString()
        })
    }

    // Retourner les données sans le mot de passe
    const { password: _, ...userWithoutPassword } = utilisateur

    return {
      success: true,
      compte: {
        id: userWithoutPassword.id,
        nom: userWithoutPassword.nom,
        prenom: userWithoutPassword.prenom,
        email: userWithoutPassword.email,
        username: userWithoutPassword.username,
        role: mapRoleToDisplay(userWithoutPassword.roles?.code || 'UNKNOWN'),
        actif: userWithoutPassword.actif,
        dateCreation: userWithoutPassword.date_creation,
        derniereConnexion: userWithoutPassword.derniere_connexion
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du compte:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la mise à jour du compte'
    }
  }
}

// Supprimer un compte
export const deleteCompte = async (id, deletedBy) => {
  try {
    // Vérifier si le compte existe
    const { data: existingCompte, error: fetchError } = await supabaseAdmin
      .from('utilisateurs')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingCompte) {
      return {
        success: false,
        error: 'Compte introuvable'
      }
    }

    // Supprimer le compte
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
          action: 'Suppression de compte',
          details: `Compte supprimé pour ${existingCompte.prenom} ${existingCompte.nom}`,
          type_action: 'CONNEXION',
          date_action: new Date().toISOString()
        })
    }

    return {
      success: true,
      message: 'Compte supprimé avec succès'
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error)
    return {
      success: false,
      error: error.message || 'Une erreur est survenue lors de la suppression du compte'
    }
  }
}

// Activer/Désactiver un compte
export const toggleActif = async (id, actif, updatedBy) => {
  try {
    const { data: utilisateur, error } = await supabaseAdmin
      .from('utilisateurs')
      .update({ actif })
      .eq('id', id)
      .select('*, roles (*)')
      .single()

    if (error) throw error

    // Enregistrer dans l'audit
    if (updatedBy) {
      await supabaseAdmin
        .from('actions_audit')
        .insert({
          utilisateur_id: updatedBy,
          action: actif ? 'Activation de compte' : 'Désactivation de compte',
          details: `Compte ${actif ? 'activé' : 'désactivé'} pour ${utilisateur.prenom} ${utilisateur.nom}`,
          type_action: 'CONNEXION',
          date_action: new Date().toISOString()
        })
    }

    return {
      success: true,
      compte: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        username: utilisateur.username,
        role: mapRoleToDisplay(utilisateur.roles?.code || 'UNKNOWN'),
        actif: utilisateur.actif,
        dateCreation: utilisateur.date_creation,
        derniereConnexion: utilisateur.derniere_connexion
      }
    }
  } catch (error) {
    console.error('Erreur lors de la modification du statut:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la modification du statut'
    }
  }
}
