import { supabaseAdmin } from '../lib/supabase.js'

// Obtenir tous les rôles actifs
export const getAllRoles = async () => {
  try {
    const { data: roles, error } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('actif', true)
      .order('nom', { ascending: true })

    if (error) throw error

    return {
      success: true,
      roles: roles || []
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des rôles:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des rôles'
    }
  }
}

// Obtenir un rôle par code
export const getRoleByCode = async (code) => {
  try {
    const { data: role, error } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('code', code)
      .single()

    if (error || !role) {
      return {
        success: false,
        error: 'Rôle introuvable'
      }
    }

    return {
      success: true,
      role
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du rôle:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération du rôle'
    }
  }
}

// Obtenir un rôle par ID
export const getRoleById = async (id) => {
  try {
    const { data: role, error } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !role) {
      return {
        success: false,
        error: 'Rôle introuvable'
      }
    }

    return {
      success: true,
      role
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du rôle:', error)
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération du rôle'
    }
  }
}

// Obtenir la route du dashboard pour un rôle
export const getDashboardRouteByRoleCode = async (roleCode) => {
  try {
    const result = await getRoleByCode(roleCode)
    if (result.success && result.role) {
      return result.role.route_dashboard || '/login'
    }
    return '/login'
  } catch (error) {
    console.error('Erreur lors de la récupération de la route:', error)
    return '/login'
  }
}
