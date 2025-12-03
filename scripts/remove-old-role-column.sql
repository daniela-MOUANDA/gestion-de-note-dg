-- Script pour supprimer l'ancienne colonne role et le type enum RoleUtilisateur
-- À exécuter après avoir vérifié que tous les utilisateurs ont un roleId valide

-- Vérifier d'abord que tous les utilisateurs ont un roleId
SELECT 
    COUNT(*) as total_utilisateurs,
    COUNT("roleId") as avec_roleId,
    COUNT(*) - COUNT("roleId") as sans_roleId
FROM "utilisateurs";

-- Si tous les utilisateurs ont un roleId, on peut supprimer l'ancienne colonne
-- ATTENTION: Ne décommentez ces lignes que si tous les utilisateurs ont un roleId

-- Supprimer l'ancienne colonne role
ALTER TABLE "utilisateurs" DROP COLUMN IF EXISTS "role";

-- Supprimer le type enum RoleUtilisateur (seulement s'il n'est plus utilisé ailleurs)
DROP TYPE IF EXISTS "RoleUtilisateur";

