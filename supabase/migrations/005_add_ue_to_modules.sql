-- Migration: Ajouter le champ Unité d'Enseignement (UE) aux modules

-- Ajouter la colonne ue à la table modules
ALTER TABLE modules ADD COLUMN IF NOT EXISTS ue VARCHAR(10) DEFAULT 'UE1';

-- Mettre à jour les modules existants avec UE1 par défaut
UPDATE modules SET ue = 'UE1' WHERE ue IS NULL;

-- Rendre la colonne NOT NULL après avoir mis à jour les valeurs
ALTER TABLE modules ALTER COLUMN ue SET NOT NULL;

-- Ajouter un check constraint pour s'assurer que seuls UE1 et UE2 sont acceptés
ALTER TABLE modules ADD CONSTRAINT modules_ue_check CHECK (ue IN ('UE1', 'UE2'));

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_modules_ue ON modules(ue);

COMMENT ON COLUMN modules.ue IS 'Unité d''Enseignement (UE1 ou UE2)';






