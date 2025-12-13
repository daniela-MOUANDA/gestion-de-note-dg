-- Migration: Ajouter une contrainte unique pour empêcher l'affectation d'un module à plusieurs enseignants

-- Supprimer les doublons existants (garder seulement la première affectation)
DELETE FROM affectations_module_enseignant a
USING affectations_module_enseignant b
WHERE a.id > b.id 
  AND a.module_id = b.module_id;

-- Ajouter une contrainte unique sur module_id
-- Cela garantit qu'un module ne peut être affecté qu'à un seul enseignant à la fois
ALTER TABLE affectations_module_enseignant 
DROP CONSTRAINT IF EXISTS affectations_module_enseignant_module_id_unique;

ALTER TABLE affectations_module_enseignant 
ADD CONSTRAINT affectations_module_enseignant_module_id_unique 
UNIQUE (module_id);

COMMENT ON CONSTRAINT affectations_module_enseignant_module_id_unique 
ON affectations_module_enseignant 
IS 'Un module ne peut être affecté qu''à un seul enseignant à la fois';









