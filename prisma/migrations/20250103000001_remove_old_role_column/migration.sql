-- Supprimer l'ancienne colonne role de la table utilisateurs
ALTER TABLE "utilisateurs" DROP COLUMN IF EXISTS "role";

-- Supprimer le type enum RoleUtilisateur (seulement s'il n'est plus utilisé ailleurs)
DROP TYPE IF EXISTS "RoleUtilisateur";

