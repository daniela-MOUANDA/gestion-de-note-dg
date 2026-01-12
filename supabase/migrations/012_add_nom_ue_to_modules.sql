-- Migration: Ajouter le champ Nom de l'Unité d'Enseignement (nom_ue)
-- Et supprimer la contrainte limitant l'UE à UE1/UE2

-- 1. Supprimer la contrainte existante si elle existe
ALTER TABLE modules DROP CONSTRAINT IF EXISTS modules_ue_check;

-- 2. Augmenter la taille de la colonne ue pour permettre des noms comme "UE 1-1"
ALTER TABLE modules ALTER COLUMN ue TYPE VARCHAR(50);

-- 3. Ajouter la colonne nom_ue
ALTER TABLE modules ADD COLUMN IF NOT EXISTS nom_ue VARCHAR(255);

-- 4. Mettre à jour les noms d'UE par défaut pour la transition
UPDATE modules SET nom_ue = 'Unité d''Enseignement 1' WHERE ue = 'UE1' AND nom_ue IS NULL;
UPDATE modules SET nom_ue = 'Unité d''Enseignement 2' WHERE ue = 'UE2' AND nom_ue IS NULL;

COMMENT ON COLUMN modules.ue IS 'Code de l''Unité d''Enseignement (ex: UE 1-1)';
COMMENT ON COLUMN modules.nom_ue IS 'Nom complet de l''Unité d''Enseignement (ex: Bases de l''Informatique)';
