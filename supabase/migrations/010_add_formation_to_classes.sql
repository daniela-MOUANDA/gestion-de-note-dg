-- ============================================
-- MIGRATION : Ajouter formation_id à la table classes
-- ============================================
-- Les classes doivent être liées à une formation (Initiale 1 ou Initiale 2)
-- car on peut avoir des classes GI L1 pour Initiale 1 et des classes GI L1 pour Initiale 2

-- Ajouter la colonne formation_id
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS formation_id UUID REFERENCES formations(id) ON DELETE CASCADE;

-- Mettre à jour la contrainte unique pour inclure la formation
-- D'abord, supprimer l'ancienne contrainte unique si elle existe
ALTER TABLE classes
DROP CONSTRAINT IF EXISTS classes_code_filiere_id_niveau_id_key;

-- Créer une nouvelle contrainte unique incluant la formation
ALTER TABLE classes
ADD CONSTRAINT classes_code_filiere_id_niveau_id_formation_id_key 
UNIQUE (code, filiere_id, niveau_id, formation_id);

-- Commentaire pour documenter
COMMENT ON COLUMN classes.formation_id IS 'Formation à laquelle appartient la classe (Initiale 1 ou Initiale 2)';
