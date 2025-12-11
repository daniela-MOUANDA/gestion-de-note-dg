-- Migration: Ajouter les champs statut et grade aux enseignants

-- Ajouter la colonne statut
ALTER TABLE enseignants ADD COLUMN IF NOT EXISTS statut VARCHAR(20) DEFAULT 'PERMANENT';

-- Ajouter la colonne grade
ALTER TABLE enseignants ADD COLUMN IF NOT EXISTS grade VARCHAR(20) DEFAULT NULL;

-- Ajouter un check constraint pour le statut
ALTER TABLE enseignants ADD CONSTRAINT enseignants_statut_check 
CHECK (statut IN ('PERMANENT', 'VACATAIRE'));

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_enseignants_statut ON enseignants(statut);
CREATE INDEX IF NOT EXISTS idx_enseignants_grade ON enseignants(grade);

COMMENT ON COLUMN enseignants.statut IS 'Statut de l''enseignant (PERMANENT ou VACATAIRE)';
COMMENT ON COLUMN enseignants.grade IS 'Grade académique de l''enseignant (Dr, Pr, MC, MA, etc.)';






