-- Migration pour créer une table de suivi du statut des notes par classe et semestre
-- Cette table stocke le nombre de modules avec notes saisies pour chaque classe et semestre

CREATE TABLE IF NOT EXISTS statut_notes_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  semestre VARCHAR(10) NOT NULL,
  nombre_modules_avec_notes INTEGER DEFAULT 0, -- Nombre de modules avec au moins une note saisie
  nombre_modules_complets INTEGER DEFAULT 0, -- Nombre de modules avec toutes les notes complètes
  nombre_etudiants_avec_notes INTEGER DEFAULT 0, -- Nombre d'étudiants avec au moins une note
  nombre_etudiants_complets INTEGER DEFAULT 0, -- Nombre d'étudiants avec toutes leurs notes
  date_mise_a_jour TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(classe_id, semestre)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_statut_notes_classe ON statut_notes_classes(classe_id);
CREATE INDEX IF NOT EXISTS idx_statut_notes_semestre ON statut_notes_classes(semestre);
CREATE INDEX IF NOT EXISTS idx_statut_notes_classe_semestre ON statut_notes_classes(classe_id, semestre);

-- Fonction pour mettre à jour automatiquement la date de mise à jour
CREATE OR REPLACE FUNCTION update_statut_notes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_mise_a_jour = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour automatiquement la date de mise à jour
DROP TRIGGER IF EXISTS update_statut_notes_timestamp_trigger ON statut_notes_classes;
CREATE TRIGGER update_statut_notes_timestamp_trigger
    BEFORE UPDATE ON statut_notes_classes
    FOR EACH ROW
    EXECUTE FUNCTION update_statut_notes_timestamp();

