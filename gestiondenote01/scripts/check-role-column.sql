-- Vérifier l'état de la colonne role
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'utilisateurs' 
  AND column_name = 'role';

-- Vérifier que tous les utilisateurs ont un roleId
SELECT 
    COUNT(*) as total_utilisateurs,
    COUNT("roleId") as avec_roleId,
    COUNT(*) - COUNT("roleId") as sans_roleId
FROM "utilisateurs";

