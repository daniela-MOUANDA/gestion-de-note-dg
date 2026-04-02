import bcrypt from 'bcrypt'
import { supabaseAdmin } from '../../lib/supabase.js'

const COORD_CODE = 'COORD_PEDAGOGIQUE'

async function getCoordRoleId() {
  const { data, error } = await supabaseAdmin
    .from('roles')
    .select('id')
    .eq('code', COORD_CODE)
    .single()
  if (error || !data) return null
  return data.id
}

export async function listCoordinateursPedagogiques(chefUtilisateurId, departementId) {
  try {
    const roleId = await getCoordRoleId()
    if (!roleId) {
      return { success: false, error: 'Rôle coordinateur pédagogique introuvable. Exécutez la migration SQL.' }
    }
    const { data, error } = await supabaseAdmin
      .from('utilisateurs')
      .select('id, nom, prenom, email, username, telephone, actif, date_creation, derniere_connexion')
      .eq('role_id', roleId)
      .eq('departement_id', departementId)
      .eq('cree_par_utilisateur_id', chefUtilisateurId)
      .order('date_creation', { ascending: false })

    if (error) throw error
    return { success: true, coordinateurs: data || [] }
  } catch (e) {
    console.error('listCoordinateursPedagogiques:', e)
    return { success: false, error: e.message || 'Erreur lors du chargement des équipes' }
  }
}

export async function createCoordinateurPedagogique(
  { chefUtilisateurId, departementId },
  { nom, prenom, email, motDePasse, telephone }
) {
  try {
    if (!nom?.trim() || !prenom?.trim() || !email?.trim() || !motDePasse) {
      return { success: false, error: 'Nom, prénom, email et mot de passe sont requis' }
    }
    if (String(motDePasse).length < 8) {
      return { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères' }
    }

    const roleId = await getCoordRoleId()
    if (!roleId) {
      return { success: false, error: 'Rôle coordinateur pédagogique introuvable' }
    }

    const normalizedEmail = email.trim().toLowerCase()

    const { data: emailExists } = await supabaseAdmin
      .from('utilisateurs')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (emailExists) {
      return { success: false, error: 'Cet email est déjà utilisé' }
    }

    let username = normalizedEmail.split('@')[0]
    const { data: usernameExists } = await supabaseAdmin
      .from('utilisateurs')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (usernameExists) {
      username = `${username}_${Date.now().toString().slice(-4)}`
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 10)

    const { data: created, error: insertError } = await supabaseAdmin
      .from('utilisateurs')
      .insert({
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: normalizedEmail,
        username,
        password: hashedPassword,
        telephone: telephone?.trim() || null,
        role_id: roleId,
        actif: true,
        departement_id: departementId,
        cree_par_utilisateur_id: chefUtilisateurId
      })
      .select('id, nom, prenom, email, username, telephone, actif, date_creation')
      .single()

    if (insertError) throw insertError

    await supabaseAdmin.from('actions_audit').insert({
      utilisateur_id: chefUtilisateurId,
      action: 'Création coordinateur pédagogique',
      details: `Compte coordonnateur : ${prenom} ${nom} (${normalizedEmail})`,
      type_action: 'CONNEXION',
      date_action: new Date().toISOString()
    })

    return { success: true, coordinateur: created }
  } catch (e) {
    console.error('createCoordinateurPedagogique:', e)
    return { success: false, error: e.message || 'Erreur lors de la création' }
  }
}

async function assertChefOwnsCoordinateur(coordId, chefUtilisateurId, departementId) {
  const roleId = await getCoordRoleId()
  if (!roleId) return { ok: false, error: 'Rôle coordinateur introuvable' }

  const { data: row, error } = await supabaseAdmin
    .from('utilisateurs')
    .select('id, cree_par_utilisateur_id, departement_id')
    .eq('id', coordId)
    .eq('role_id', roleId)
    .single()

  if (error || !row) return { ok: false, error: 'Coordinateur introuvable' }
  if (row.departement_id !== departementId || row.cree_par_utilisateur_id !== chefUtilisateurId) {
    return { ok: false, error: 'Vous ne pouvez pas modifier ce compte' }
  }
  return { ok: true }
}

export async function updateCoordinateurPedagogique(
  { chefUtilisateurId, departementId },
  coordId,
  { nom, prenom, telephone, actif, motDePasse }
) {
  try {
    const own = await assertChefOwnsCoordinateur(coordId, chefUtilisateurId, departementId)
    if (!own.ok) return { success: false, error: own.error }

    const patch = {}
    if (nom !== undefined) patch.nom = String(nom).trim()
    if (prenom !== undefined) patch.prenom = String(prenom).trim()
    if (telephone !== undefined) patch.telephone = telephone?.trim() || null
    if (actif !== undefined) patch.actif = Boolean(actif)
    if (motDePasse !== undefined && motDePasse !== '') {
      if (String(motDePasse).length < 8) {
        return { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères' }
      }
      patch.password = await bcrypt.hash(motDePasse, 10)
      patch.token = null
    }

    if (Object.keys(patch).length === 0) {
      return { success: false, error: 'Aucune modification à enregistrer' }
    }

    const { data, error } = await supabaseAdmin
      .from('utilisateurs')
      .update(patch)
      .eq('id', coordId)
      .select('id, nom, prenom, email, username, telephone, actif, date_creation, derniere_connexion')
      .single()

    if (error) throw error

    await supabaseAdmin.from('actions_audit').insert({
      utilisateur_id: chefUtilisateurId,
      action: 'Mise à jour coordinateur pédagogique',
      details: `Coordinateur ${coordId} — champs mis à jour`,
      type_action: 'CONNEXION',
      date_action: new Date().toISOString()
    })

    return { success: true, coordinateur: data }
  } catch (e) {
    console.error('updateCoordinateurPedagogique:', e)
    return { success: false, error: e.message || 'Erreur lors de la mise à jour' }
  }
}
