-- Script de vérification des champs ajoutés
-- Exécutez ce script pour vérifier que les champs ont bien été ajoutés

SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'utilisateurs' 
AND column_name IN ('photo', 'telephone', 'adresse')
ORDER BY column_name;

