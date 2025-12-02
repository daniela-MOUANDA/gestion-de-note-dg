import prisma from '../lib/prisma.js'

// Obtenir tous les rôles actifs
export const getAllRoles = async () => {
  try {
    const roles = await prisma.role.findMany({
      where: {
        actif: true
      },
      orderBy: {
        nom: 'asc'
      }
    })

    return {
      success: true,
      roles
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
    const role = await prisma.role.findUnique({
      where: { code }
    })

    if (!role) {
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
    const role = await prisma.role.findUnique({
      where: { id }
    })

    if (!role) {
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
      return result.role.routeDashboard || '/login'
    }
    return '/login'
  } catch (error) {
    console.error('Erreur lors de la récupération de la route:', error)
    return '/login'
  }
}

