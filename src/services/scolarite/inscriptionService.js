import { supabaseAdmin } from '../../lib/supabase.js'
import bcrypt from 'bcrypt'

// Récupérer toutes les formations
export const getFormations = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('formations')
      .select('*')
      .order('code', { ascending: true })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erreur lors de la récupération des formations:', error)
    throw error
  }
}

// Récupérer toutes les filières
export const getFilieres = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('filieres')
      .select('*')
      .order('code', { ascending: true })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erreur lors de la récupération des filières:', error)
    throw error
  }
}

// Récupérer les niveaux disponibles selon la formation et la filière
export const getNiveauxDisponibles = async (formationId, filiereId) => {
  try {
    // Récupérer la formation
    const { data: formation, error: formError } = await supabaseAdmin
      .from('formations')
      .select('*')
      .eq('id', formationId)
      .single()
    
    if (formError) throw formError
    
    if (formation?.code === 'INITIAL_2') {
      // Récupérer la filière
      const { data: filiere, error: filError } = await supabaseAdmin
        .from('filieres')
        .select('*')
        .eq('id', filiereId)
        .single()
      
      if (filError) throw filError
      
      if (filiere?.code === 'MTIC') {
        // MTIC Initial 2 a tous les niveaux
        const { data, error } = await supabaseAdmin
          .from('niveaux')
          .select('*')
          .order('code', { ascending: true })
        if (error) throw error
        return data
      } else {
        // Autres filières Initial 2 n'ont que L1
        const { data, error } = await supabaseAdmin
          .from('niveaux')
          .select('*')
          .eq('code', 'L1')
        if (error) throw error
        return data
      }
    } else {
      // Initial 1 a tous les niveaux
      const { data, error } = await supabaseAdmin
        .from('niveaux')
        .select('*')
        .order('code', { ascending: true })
      if (error) throw error
      return data
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des niveaux:', error)
    throw error
  }
}

// Récupérer les classes d'une filière et d'un niveau
export const getClasses = async (filiereId, niveauId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('classes')
      .select(`
        *,
        filieres (*),
        niveaux (*)
      `)
      .eq('filiere_id', filiereId)
      .eq('niveau_id', niveauId)
      .order('code', { ascending: true })
    
    if (error) throw error
    
    // Mapper les noms de colonnes pour la compatibilité
    return data.map(c => ({
      id: c.id,
      code: c.code,
      nom: c.nom,
      filiereId: c.filiere_id,
      niveauId: c.niveau_id,
      effectif: c.effectif,
      filiere: c.filieres,
      niveau: c.niveaux
    }))
  } catch (error) {
    console.error('Erreur lors de la récupération des classes:', error)
    throw error
  }
}

// Récupérer les étudiants par filière et niveau (sans classe)
export const getEtudiantsParFiliereNiveau = async (filiereId, niveauId, promotionId, formationId, typeInscription) => {
  try {
    // IMPORTANT : Filtrer UNIQUEMENT par la formation sélectionnée
    // Ne pas inclure toutes les formations Initiale 1 et Initiale 2
    if (!formationId) {
      throw new Error('Formation ID est requis')
    }
    
    const { data: inscriptions, error } = await supabaseAdmin
      .from('inscriptions')
      .select(`
        *,
        etudiants (*),
        formations (*),
        filieres (*),
        niveaux (*)
      `)
      .eq('filiere_id', filiereId)
      .eq('niveau_id', niveauId)
      .eq('promotion_id', promotionId)
      .eq('formation_id', formationId) // Filtrer UNIQUEMENT par la formation sélectionnée
      .eq('type_inscription', typeInscription === 'inscription' ? 'INSCRIPTION' : 'REINSCRIPTION')
      .order('etudiants(nom)', { ascending: true })
    
    if (error) throw error
    
    return inscriptions.map(inscription => ({
      id: inscription.etudiants.id,
      inscriptionId: inscription.id,
      matricule: inscription.etudiants.matricule,
      nom: inscription.etudiants.nom,
      prenom: inscription.etudiants.prenom,
      email: inscription.etudiants.email,
      telephone: inscription.etudiants.telephone,
      photo: inscription.etudiants.photo || null,
      dateNaissance: inscription.etudiants.date_naissance ? 
        inscription.etudiants.date_naissance.split('T')[0] : null,
      lieuNaissance: inscription.etudiants.lieu_naissance || null,
      adresse: inscription.etudiants.adresse || null,
      formation: inscription.formations.nom,
      filiere: inscription.filieres.nom,
      niveau: inscription.niveaux.nom,
      inscrit: inscription.statut === 'INSCRIT',
      statut: inscription.statut,
      dateInscription: inscription.date_inscription,
      documents: {
        acteNaissance: inscription.copie_acte_naissance ? { nom: 'acte_naissance.pdf', uploaded: true, url: inscription.copie_acte_naissance } : null,
        photo: inscription.photo_identite ? { nom: 'photo.jpg', uploaded: true, url: inscription.photo_identite } : null,
        quittance: inscription.quittance ? { nom: 'quittance.pdf', uploaded: true, url: inscription.quittance } : null,
        pieceIdentite: inscription.piece_identite ? { nom: 'cni.pdf', uploaded: true, url: inscription.piece_identite } : null,
        releveBac: inscription.copie_releve ? { nom: 'releve_bac.pdf', uploaded: true, url: inscription.copie_releve } : null,
        attestationReussiteBac: inscription.copie_diplome ? { nom: 'attestation_reussite_bac.pdf', uploaded: true, url: inscription.copie_diplome } : null
      }
    }))
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants:', error)
    throw error
  }
}

// Récupérer les étudiants d'une classe avec leur statut d'inscription (gardé pour compatibilité)
export const getEtudiantsParClasse = async (classeId, promotionId, typeInscription) => {
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
      .eq('classe_id', classeId)
      .eq('promotion_id', promotionId)
      .eq('type_inscription', typeInscription === 'inscription' ? 'INSCRIPTION' : 'REINSCRIPTION')
      .order('etudiants(nom)', { ascending: true })
    
    if (error) throw error
    
    return inscriptions.map(inscription => ({
      id: inscription.etudiants.id,
      inscriptionId: inscription.id,
      matricule: inscription.etudiants.matricule,
      nom: inscription.etudiants.nom,
      prenom: inscription.etudiants.prenom,
      email: inscription.etudiants.email,
      telephone: inscription.etudiants.telephone,
      photo: inscription.etudiants.photo || null,
      dateNaissance: inscription.etudiants.date_naissance ? 
        inscription.etudiants.date_naissance.split('T')[0] : null,
      lieuNaissance: inscription.etudiants.lieu_naissance || null,
      adresse: inscription.etudiants.adresse || null,
      formation: inscription.formations.nom,
      filiere: inscription.filieres.nom,
      niveau: inscription.niveaux.nom,
      inscrit: inscription.statut === 'INSCRIT',
      statut: inscription.statut,
      dateInscription: inscription.date_inscription,
      documents: {
        acteNaissance: inscription.copie_acte_naissance ? { nom: 'acte_naissance.pdf', uploaded: true, url: inscription.copie_acte_naissance } : null,
        photo: inscription.photo_identite ? { nom: 'photo.jpg', uploaded: true, url: inscription.photo_identite } : null,
        quittance: inscription.quittance ? { nom: 'quittance.pdf', uploaded: true, url: inscription.quittance } : null,
        pieceIdentite: inscription.piece_identite ? { nom: 'cni.pdf', uploaded: true, url: inscription.piece_identite } : null,
        releveBac: inscription.copie_releve ? { nom: 'releve_bac.pdf', uploaded: true, url: inscription.copie_releve } : null,
        attestationReussiteBac: inscription.copie_diplome ? { nom: 'attestation_reussite_bac.pdf', uploaded: true, url: inscription.copie_diplome } : null
      }
    }))
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants:', error)
    throw error
  }
}

// Valider une inscription
export const validerInscription = async (inscriptionId, agentId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('inscriptions')
      .update({
        statut: 'VALIDEE',
        date_validation: new Date().toISOString(),
        agent_valideur_id: agentId
      })
      .eq('id', inscriptionId)
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erreur lors de la validation de l\'inscription:', error)
    throw error
  }
}

// Générer un mot de passe aléatoire sécurisé
const generatePassword = () => {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*'
  let password = ''
  
  // S'assurer qu'il y a au moins une majuscule, une minuscule, un chiffre et un caractère spécial
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
  password += '0123456789'[Math.floor(Math.random() * 10)]
  password += '!@#$%&*'[Math.floor(Math.random() * 7)]
  
  // Remplir le reste avec des caractères aléatoires
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  // Mélanger les caractères
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// Finaliser une inscription (scolarité soldée)
export const finaliserInscription = async (inscriptionId, agentId) => {
  try {
    // Récupérer l'inscription avec les données de l'étudiant
    const { data: inscription, error: inscError } = await supabaseAdmin
      .from('inscriptions')
      .select(`
        *,
        etudiants (*),
        promotions (annee)
      `)
      .eq('id', inscriptionId)
      .single()

    if (inscError || !inscription) {
      throw new Error('Inscription non trouvée')
    }

    if (!inscription.etudiants) {
      throw new Error('Étudiant non trouvé pour cette inscription')
    }

    const etudiant = inscription.etudiants

    // Vérifier que l'étudiant a un email
    if (!etudiant.email || etudiant.email.trim() === '') {
      throw new Error('L\'étudiant doit avoir une adresse email pour recevoir ses identifiants de connexion')
    }

    // Générer un mot de passe automatique
    const generatedPassword = generatePassword()
    console.log(`🔑 Mot de passe généré pour ${etudiant.prenom} ${etudiant.nom}: ${generatedPassword}`)

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(generatedPassword, 10)

    // Vérifier si un compte Utilisateur existe déjà pour cet étudiant
    const { data: existingUser } = await supabaseAdmin
      .from('utilisateurs')
      .select('*')
      .or(`email.eq.${etudiant.email.trim().toLowerCase()},username.eq.${etudiant.matricule.trim()}`)
      .single()

    // Récupérer le rôle ETUDIANT
    const { data: roleEtudiant, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('code', 'ETUDIANT')
      .single()

    if (roleError || !roleEtudiant) {
      throw new Error('Rôle ETUDIANT non trouvé')
    }

    let utilisateur = existingUser

    // Créer ou mettre à jour le compte Utilisateur
    if (utilisateur) {
      // Mettre à jour le mot de passe si le compte existe déjà
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('utilisateurs')
        .update({
          password: hashedPassword,
          email: etudiant.email.trim().toLowerCase(),
          actif: true,
          role_id: roleEtudiant.id
        })
        .eq('id', utilisateur.id)
        .select()
        .single()
      
      if (updateError) throw updateError
      utilisateur = updatedUser
      console.log('✅ Compte Utilisateur mis à jour pour l\'étudiant:', utilisateur.email)
    } else {
      // Créer un nouveau compte Utilisateur
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('utilisateurs')
        .insert({
          nom: etudiant.nom,
          prenom: etudiant.prenom,
          email: etudiant.email.trim().toLowerCase(),
          username: etudiant.matricule.trim().toLowerCase(),
          password: hashedPassword,
          role_id: roleEtudiant.id,
          actif: true,
          photo: etudiant.photo || null,
          telephone: etudiant.telephone || null,
          adresse: etudiant.adresse || null
        })
        .select()
        .single()
      
      if (createError) throw createError
      utilisateur = newUser
      console.log('✅ Compte Utilisateur créé pour l\'étudiant:', utilisateur.email)
    }

    // Mettre à jour le statut de l'inscription
    const { data: inscriptionUpdated, error: updateInscError } = await supabaseAdmin
      .from('inscriptions')
      .update({
        statut: 'INSCRIT',
        date_validation: new Date().toISOString(),
        agent_valideur_id: agentId
      })
      .eq('id', inscriptionId)
      .select()
      .single()

    if (updateInscError) throw updateInscError

    // Retourner le mot de passe généré pour l'afficher à l'utilisateur
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ INSCRIPTION FINALISÉE AVEC SUCCÈS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📧 Étudiant: ${etudiant.prenom} ${etudiant.nom}`)
    console.log(`📧 Email: ${etudiant.email}`)
    console.log(`🆔 Matricule: ${etudiant.matricule}`)
    console.log(`🔑 Mot de passe: ${generatedPassword}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💡 IMPORTANT: Notez ces identifiants et communiquez-les à l\'étudiant')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    return {
      ...inscriptionUpdated,
      password: generatedPassword,
      etudiantEmail: etudiant.email,
      etudiantMatricule: etudiant.matricule,
      etudiantNom: `${etudiant.prenom} ${etudiant.nom}`
    }
  } catch (error) {
    console.error('Erreur lors de la finalisation de l\'inscription:', error)
    throw error
  }
}

// Récupérer toutes les promotions
export const getPromotions = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('promotions')
      .select('*')
      .order('annee', { ascending: false })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Erreur lors de la récupération des promotions:', error)
    throw error
  }
}
