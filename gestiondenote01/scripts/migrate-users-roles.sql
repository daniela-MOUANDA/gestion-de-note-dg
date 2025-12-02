-- Script SQL pour migrer les utilisateurs existants vers la table Role
-- Ce script assigne un roleId à chaque utilisateur basé sur son ancien enum role

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

-- Vérifier que tous les utilisateurs ont un roleId
SELECT 
    COUNT(*) as total_utilisateurs,
    COUNT("roleId") as utilisateurs_avec_roleId,
    COUNT(*) - COUNT("roleId") as utilisateurs_sans_roleId
FROM "utilisateurs";

