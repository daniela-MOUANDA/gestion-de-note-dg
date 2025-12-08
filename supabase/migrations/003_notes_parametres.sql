-- Migration: Créer les tables pour la gestion des notes avec paramètres de notation

-- Table des paramètres de notation (configuration des évaluations pour chaque module)
CREATE TABLE IF NOT EXISTS parametres_notation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  semestre VARCHAR(10) NOT NULL,
  evaluations JSONB NOT NULL,  -- Structure: [{ id, type, ponderation, nombreEvaluations }]
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_modification TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(module_id, semestre)
);

-- Modifier la table notes pour ajouter evaluation_id
ALTER TABLE notes ADD COLUMN IF NOT EXISTS evaluation_id VARCHAR(50);
ALTER TABLE notes ADD COLUMN IF NOT EXISTS annee_academique VARCHAR(20) DEFAULT '2024-2025';

-- Supprimer les anciennes colonnes si elles existent
ALTER TABLE notes DROP COLUMN IF EXISTS type_note;
ALTER TABLE notes DROP COLUMN IF EXISTS coefficient;
ALTER TABLE notes DROP COLUMN IF EXISTS commentaire;

-- Modifier les contraintes
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_unique;
ALTER TABLE notes ADD CONSTRAINT notes_unique UNIQUE(etudiant_id, module_id, classe_id, semestre, evaluation_id);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_parametres_notation_module ON parametres_notation(module_id);
CREATE INDEX IF NOT EXISTS idx_parametres_notation_semestre ON parametres_notation(semestre);
CREATE INDEX IF NOT EXISTS idx_notes_evaluation ON notes(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_notes_module_classe ON notes(module_id, classe_id);

-- Fonction pour mettre à jour la date de modification
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour automatiquement la date de modification
DROP TRIGGER IF EXISTS update_parametres_notation_modtime ON parametres_notation;
CREATE TRIGGER update_parametres_notation_modtime
    BEFORE UPDATE ON parametres_notation
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

COMMENT ON TABLE parametres_notation IS 'Paramètres de notation pour chaque module (types d''évaluations, notes max, coefficients)';
COMMENT ON COLUMN parametres_notation.evaluations IS 'Configuration JSON des évaluations: [{ id, type, noteMax, nombreEvaluations, coefficient }]';
COMMENT ON COLUMN notes.evaluation_id IS 'Identifiant de l''évaluation au format: {id_param}_{numero}';

