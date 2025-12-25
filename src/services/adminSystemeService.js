import bcrypt from 'bcrypt'
import { supabaseAdmin } from '../lib/supabase.js'

/**
 * Recherche des étudiants pour la gestion des identifiants
 * @param {string} searchTerm - Terme de recherche (matricule, nom, prénom, email)
 */
export const searchStudentsCredentials = async (searchTerm) => {
    try {
        let query = supabaseAdmin
            .from('etudiants')
            .select('id, matricule, nom, prenom, email')

        if (searchTerm) {
            query = query.or(`matricule.ilike.%${searchTerm}%,nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        }

        const { data: etudiants, error } = await query.limit(50)
        if (error) throw error

        if (!etudiants || etudiants.length === 0) {
            return { success: true, students: [] }
        }

        // Récupérer les informations de compte pour ces étudiants
        const matricules = etudiants.map(e => e.matricule)
        const { data: accounts, error: accountsError } = await supabaseAdmin
            .from('utilisateurs')
            .select('id, username, email, actif, derniere_connexion')
            .in('username', matricules)

        const accountMap = {}
        if (accounts) {
            accounts.forEach(acc => {
                accountMap[acc.username.toLowerCase()] = acc
            })
        }

        return {
            success: true,
            students: etudiants.map(e => {
                const acc = accountMap[e.matricule.toLowerCase()]
                return {
                    id: e.id,
                    userId: acc?.id || null, // ID de la table utilisateurs
                    matricule: e.matricule,
                    nom: e.nom,
                    prenom: e.prenom,
                    email: e.email || acc?.email,
                    username: acc?.username || e.matricule.toLowerCase(),
                    actif: acc ? acc.actif : false,
                    hasAccount: !!acc,
                    derniereConnexion: acc ? acc.derniere_connexion : null
                }
            })
        }
    } catch (error) {
        console.error('Erreur lors de la recherche des identifiants étudiants:', error)
        return {
            success: false,
            error: error.message || 'Erreur lors de la recherche'
        }
    }
}

/**
 * Met à jour le mot de passe d'un étudiant
 * @param {string} userId - ID de l'utilisateur (dans la table utilisateurs)
 * @param {string} newPassword - Nouveau mot de passe
 * @param {string} adminId - ID de l'administrateur effectuant l'action
 */
export const updateStudentPassword = async (userId, newPassword, adminId) => {
    try {
        if (!userId || userId === 'undefined') {
            throw new Error('ID utilisateur invalide ou manquant. L\'étudiant n\'a probablement pas encore de compte système.')
        }

        if (!newPassword || newPassword.length < 4) {
            throw new Error('Le mot de passe doit contenir au moins 4 caractères')
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Mettre à jour dans la table utilisateurs
        const { data: utilisateur, error: updateError } = await supabaseAdmin
            .from('utilisateurs')
            .update({ password: hashedPassword })
            .eq('id', userId)
            .select('nom, prenom, username')
            .single()

        if (updateError) {
            if (updateError.code === 'PGRST116') {
                throw new Error('Compte utilisateur introuvable.')
            }
            throw updateError
        }

        // Enregistrer dans l'audit
        if (adminId) {
            await supabaseAdmin
                .from('actions_audit')
                .insert({
                    utilisateur_id: adminId,
                    action: 'Réinitialisation mot de passe étudiant',
                    details: `Mot de passe réinitialisé pour l'étudiant ${utilisateur.prenom} ${utilisateur.nom} (Username: ${utilisateur.username})`,
                    type_action: 'CONNEXION',
                    date_action: new Date().toISOString()
                })
        }

        return {
            success: true,
            message: 'Mot de passe mis à jour avec succès'
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du mot de passe:', error)
        return {
            success: false,
            error: error.message || 'Erreur lors de la mise à jour'
        }
    }
}

/**
 * Crée manuellement un compte système pour un étudiant
 * @param {string} studentId - ID de l'étudiant (table etudiants)
 * @param {string} password - Mot de passe initial
 * @param {string} adminId - ID de l'admin effectuant l'action
 */
export const createStudentAccount = async (studentId, password, adminId) => {
    try {
        // 1. Récupérer les infos de l'étudiant
        const { data: etudiant, error: etudiantError } = await supabaseAdmin
            .from('etudiants')
            .select('*')
            .eq('id', studentId)
            .single()

        if (etudiantError || !etudiant) {
            throw new Error('Étudiant introuvable')
        }

        // 2. Vérifier si un compte existe déjà
        const { data: existingUser } = await supabaseAdmin
            .from('utilisateurs')
            .select('id')
            .eq('username', etudiant.matricule)
            .single()

        if (existingUser) {
            throw new Error('Un compte utilisateur existe déjà pour ce matricule')
        }

        // 2b. Vérifier si l'email est déjà utilisé par un autre compte
        const studentEmail = etudiant.email || `${etudiant.matricule.toLowerCase()}@etudiant.inptic.ga`
        const { data: existingEmail } = await supabaseAdmin
            .from('utilisateurs')
            .select('id')
            .eq('email', studentEmail.toLowerCase().trim())
            .single()

        if (existingEmail) {
            throw new Error(`L'adresse email "${studentEmail}" est déjà associée à un autre compte utilisateur.`)
        }

        // 3. Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10)

        // 4. Récupérer le rôle ETUDIANT
        const { data: roleEtudiant, error: roleError } = await supabaseAdmin
            .from('roles')
            .select('id')
            .eq('code', 'ETUDIANT')
            .single()

        if (roleError || !roleEtudiant) {
            throw new Error('Rôle ETUDIANT non configuré dans le système')
        }

        // 5. Créer l'utilisateur
        const { data: newUser, error: createError } = await supabaseAdmin
            .from('utilisateurs')
            .insert({
                nom: etudiant.nom,
                prenom: etudiant.prenom,
                username: etudiant.matricule,
                email: studentEmail.toLowerCase().trim(),
                password: hashedPassword,
                role_id: roleEtudiant.id,
                actif: true
            })
            .select()
            .single()

        if (createError) throw createError

        // 6. Logger l'action
        if (adminId) {
            await supabaseAdmin
                .from('actions_audit')
                .insert({
                    utilisateur_id: adminId,
                    action: 'Création compte étudiant',
                    details: `Compte créé manuellement pour ${etudiant.prenom} ${etudiant.nom} (Matricule: ${etudiant.matricule})`,
                    type_action: 'CONNEXION',
                    date_action: new Date().toISOString()
                })
        }

        return {
            success: true,
            userId: newUser.id,
            message: 'Compte créé avec succès'
        }
    } catch (error) {
        console.error('Erreur lors de la création du compte étudiant:', error)
        return {
            success: false,
            error: error.message || 'Erreur lors de la création du compte'
        }
    }
}

/**
 * Récupère les logs d'audit complets (identique à auditService mais pour l'admin systeme)
 */
export const getFullAuditLogs = async (filters = {}) => {
    try {
        const { typeAction, utilisateurId, dateDebut, dateFin, searchQuery, limit = 1000, offset = 0 } = filters

        let query = supabaseAdmin
            .from('actions_audit')
            .select(`
        *,
        utilisateurs (
          nom,
          prenom,
          roles (nom)
        )
      `)
            .order('date_action', { ascending: false })

        if (typeAction && typeAction !== 'all') {
            const typeActionMap = {
                'connexion': 'CONNEXION',
                'inscription': 'INSCRIPTION',
                'attestation': 'ATTESTATION',
                'bulletin': 'BULLETIN',
                'diplome': 'DIPLOME',
                'message': 'MESSAGE',
                'error': 'ERROR',
                'pv': 'PV',
                'archivage': 'ARCHIVAGE'
            }
            const mappedType = typeActionMap[typeAction.toLowerCase()] || typeAction.toUpperCase()
            query = query.eq('type_action', mappedType)
        }

        if (utilisateurId && utilisateurId !== 'all') query = query.eq('utilisateur_id', utilisateurId)

        if (dateDebut) {
            const debut = new Date(dateDebut)
            debut.setHours(0, 0, 0, 0)
            query = query.gte('date_action', debut.toISOString())
        }
        if (dateFin) {
            const fin = new Date(dateFin)
            fin.setHours(23, 59, 59, 999)
            query = query.lte('date_action', fin.toISOString())
        }

        // Pour la recherche textuelle
        if (searchQuery && searchQuery.trim()) {
            query = query.or(`action.ilike.%${searchQuery}%,details.ilike.%${searchQuery}%`)
        }

        const { data: logs, error } = await query.range(offset, offset + limit - 1)

        if (error) throw error

        return {
            success: true,
            logs: logs.map(log => ({
                id: log.id,
                date: new Date(log.date_action).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                type: log.type_action.toLowerCase(),
                action: log.action,
                details: log.details,
                agent: log.utilisateurs ? `${log.utilisateurs.prenom} ${log.utilisateurs.nom}` : 'Système',
                agentId: log.utilisateur_id
            }))
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des logs d\'audit:', error)
        return {
            success: false,
            error: error.message || 'Erreur lors de la récupération'
        }
    }
}

/**
 * Récupère tous les utilisateurs actifs pour le filtre d'audit
 */
export const getAllUsersForAudit = async () => {
    try {
        const { data: users, error } = await supabaseAdmin
            .from('utilisateurs')
            .select('id, nom, prenom, roles (nom)')
            .eq('actif', true)
            .order('nom', { ascending: true })

        if (error) throw error

        return {
            success: true,
            users: users.map(u => ({
                id: u.id,
                nom: `${u.prenom} ${u.nom}`,
                role: u.roles?.nom
            }))
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error)
        return {
            success: false,
            error: error.message || 'Erreur lors de la récupération'
        }
    }
}

/**
 * Récupère les statistiques pour le tableau de bord Admin Système
 */
export const getDashboardStats = async () => {
    try {
        // 1. Total Utilisateurs (Staff)
        const { count: totalUsers } = await supabaseAdmin
            .from('utilisateurs')
            .select('*', { count: 'exact', head: true })

        // 2. Étudiants Total
        const { count: totalStudents } = await supabaseAdmin
            .from('etudiants')
            .select('*', { count: 'exact', head: true })

        // 3. Audit Logs Total
        const { count: totalAuditLogs } = await supabaseAdmin
            .from('actions_audit')
            .select('*', { count: 'exact', head: true })

        // 4. Utilisateurs actifs (dernière heure)
        const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
        const { count: activeUsers } = await supabaseAdmin
            .from('utilisateurs')
            .select('*', { count: 'exact', head: true })
            .gte('derniere_connexion', oneHourAgo)

        return {
            success: true,
            stats: {
                totalUsers: totalUsers || 0,
                activeUsers: activeUsers || 0,
                totalStudents: totalStudents || 0,
                totalAuditLogs: totalAuditLogs || 0,
                systemAlerts: 0
            }
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des stats dashboard:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Récupère les logs récents pour le dashboard
 */
export const getRecentSystemLogs = async (limit = 5) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('actions_audit')
            .select(`
                id,
                action,
                date_action,
                type_action,
                utilisateurs (nom, prenom)
            `)
            .order('date_action', { ascending: false })
            .limit(limit)

        if (error) throw error

        return {
            success: true,
            logs: data.map(log => ({
                id: log.id,
                action: log.action,
                user: log.utilisateurs ? `${log.utilisateurs.prenom} ${log.utilisateurs.nom}` : 'Système',
                date: new Date(log.date_action).toLocaleString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit'
                }),
                type: log.type_action === 'ERROR' ? 'warning' : (log.type_action === 'CONNEXION' ? 'success' : 'info')
            }))
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des logs récents:', error)
        return { success: false, error: error.message }
    }
}
