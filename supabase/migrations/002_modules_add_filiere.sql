-- Migration: Ajouter filiere_id à la table modules et rendre classe_id nullable
-- Les modules sont maintenant liés aux filières plutôt qu'aux classes

-- Ajouter la colonne filiere_id
ALTER TABLE modules 
ADD COLUMN filiere_id UUID REFERENCES filieres(id) ON DELETE CASCADE;

-- Rendre classe_id nullable (optionnel pour compatibilité)
ALTER TABLE modules 
ALTER COLUMN classe_id DROP NOT NULL;

-- Supprimer l'ancienne contrainte unique
ALTER TABLE modules 
DROP CONSTRAINT IF EXISTS modules_code_classe_id_key;

-- Ajouter une nouvelle contrainte unique (code, filiere_id, semestre)
ALTER TABLE modules 
ADD CONSTRAINT modules_code_filiere_semestre_unique UNIQUE(code, filiere_id, semestre);

-- Créer un index sur filiere_id
CREATE INDEX idx_modules_filiere ON modules(filiere_id);

-- Mettre à jour les modules existants pour copier la filière depuis la classe
UPDATE modules m
SET filiere_id = c.filiere_id
FROM classes c
WHERE m.classe_id = c.id AND m.filiere_id IS NULL;

