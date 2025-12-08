-- Migration: Corriger les colonnes de la table notes pour les rendre optionnelles

-- Rendre inscription_id et enseignant_id nullable car ces informations
-- peuvent être déduites d'autres relations
ALTER TABLE notes ALTER COLUMN inscription_id DROP NOT NULL;
ALTER TABLE notes ALTER COLUMN enseignant_id DROP NOT NULL;

-- Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notes_semestre ON notes(semestre);
CREATE INDEX IF NOT EXISTS idx_notes_annee_academique ON notes(annee_academique);

COMMENT ON COLUMN notes.inscription_id IS 'ID de l''inscription (optionnel, peut être déduit de etudiant_id + classe_id)';
COMMENT ON COLUMN notes.enseignant_id IS 'ID de l''enseignant (optionnel, peut être déduit du module)';

