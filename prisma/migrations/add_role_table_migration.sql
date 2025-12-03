-- Migration pour créer la table Role et migrer les utilisateurs
-- Cette migration doit être exécutée en plusieurs étapes

-- Étape 1: Créer la table roles
CREATE TABLE IF NOT EXISTS "roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "routeDashboard" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- Étape 2: Créer l'index unique sur code
CREATE UNIQUE INDEX IF NOT EXISTS "roles_code_key" ON "roles"("code");

-- Étape 3: Ajouter la colonne roleId (nullable d'abord)
ALTER TABLE "utilisateurs" ADD COLUMN IF NOT EXISTS "roleId" TEXT;

-- Étape 4: Insérer les rôles
INSERT INTO "roles" ("id", "code", "nom", "description", "routeDashboard", "actif", "dateCreation")
VALUES 
    (gen_random_uuid()::text, 'AGENT_SCOLARITE', 'Agent Scolarité', 'Agent du service scolarité', '/scolarite/dashboard', true, NOW()),
    (gen_random_uuid()::text, 'SP_SCOLARITE', 'SP-Scolarité', 'Secrétaire Particulière du service scolarité', '/sp-scolarite/dashboard', true, NOW()),
    (gen_random_uuid()::text, 'CHEF_SERVICE_SCOLARITE', 'Chef de Service Scolarité', 'Chef du service scolarité', '/chef-scolarite/dashboard', true, NOW()),
    (gen_random_uuid()::text, 'CHEF_DEPARTEMENT', 'Chef de Département', 'Chef d''un département académique', '/chef/departement/dashboard', true, NOW()),
    (gen_random_uuid()::text, 'DEP', 'Directeur des Études et de la Pédagogie', 'Directeur des Études et de la Pédagogie', '/dep/dashboard', true, NOW()),
    (gen_random_uuid()::text, 'ETUDIANT', 'Étudiant', 'Étudiant inscrit', '/dashboard', true, NOW()),
    (gen_random_uuid()::text, 'ENSEIGNANT', 'Enseignant', 'Enseignant', '/login', true, NOW()),
    (gen_random_uuid()::text, 'ADMIN', 'Administrateur', 'Administrateur système', '/admin/dashboard', true, NOW())
ON CONFLICT ("code") DO NOTHING;

-- Étape 5: Migrer les utilisateurs existants (assigner roleId basé sur l'ancien enum)
UPDATE "utilisateurs" u
SET "roleId" = r."id"
FROM "roles" r
WHERE 
    (u."role"::text = 'AGENT_SCOLARITE' AND r."code" = 'AGENT_SCOLARITE') OR
    (u."role"::text = 'SP_SCOLARITE' AND r."code" = 'SP_SCOLARITE') OR
    (u."role"::text = 'CHEF_SERVICE_SCOLARITE' AND r."code" = 'CHEF_SERVICE_SCOLARITE') OR
    (u."role"::text = 'CHEF_DEPARTEMENT' AND r."code" = 'CHEF_DEPARTEMENT') OR
    (u."role"::text = 'DEP' AND r."code" = 'DEP') OR
    (u."role"::text = 'ETUDIANT' AND r."code" = 'ETUDIANT') OR
    (u."role"::text = 'ENSEIGNANT' AND r."code" = 'ENSEIGNANT') OR
    (u."role"::text = 'ADMIN' AND r."code" = 'ADMIN');

-- Étape 6: Ajouter la contrainte de clé étrangère
ALTER TABLE "utilisateurs" 
ADD CONSTRAINT "utilisateurs_roleId_fkey" 
FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Étape 7: Rendre roleId non-nullable (après avoir migré toutes les données)
-- ATTENTION: Ne décommentez cette ligne que si TOUS les utilisateurs ont un roleId
-- ALTER TABLE "utilisateurs" ALTER COLUMN "roleId" SET NOT NULL;

-- Étape 8: Supprimer l'ancienne colonne role (après vérification)
-- ATTENTION: Ne décommentez cette ligne que si vous êtes sûr que tout fonctionne
-- ALTER TABLE "utilisateurs" DROP COLUMN "role";
-- DROP TYPE "RoleUtilisateur";

