-- ============================================
-- SCRIPT : Mettre à jour les classes existantes avec une formation
-- ============================================
-- Ce script assigne une formation (Initiale 1 par défaut) aux classes existantes
-- qui n'ont pas encore de formation_id.
-- 
-- IMPORTANT : Vous pouvez modifier ce script pour :
-- 1. Assigner Initiale 2 au lieu de Initiale 1
-- 2. Assigner la formation en fonction des inscriptions des étudiants dans chaque classe
-- 3. Assigner manuellement des formations spécifiques à certaines classes

-- Option 1 : Assigner Initiale 1 par défaut à toutes les classes sans formation
-- (Décommentez cette section si vous voulez cette approche)
/*
UPDATE classes
SET formation_id = (
  SELECT id FROM formations WHERE code = 'INITIAL_1' LIMIT 1
)
WHERE formation_id IS NULL;
*/

-- Option 2 : Assigner la formation en fonction des inscriptions des étudiants
-- Cette approche détermine la formation de la classe en fonction de la formation
-- la plus fréquente parmi les étudiants inscrits dans cette classe
UPDATE classes c
SET formation_id = (
  SELECT i.formation_id
  FROM inscriptions i
  WHERE i.classe_id = c.id
    AND i.formation_id IS NOT NULL
  GROUP BY i.formation_id
  ORDER BY COUNT(*) DESC
  LIMIT 1
)
WHERE c.formation_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM inscriptions i
    WHERE i.classe_id = c.id
      AND i.formation_id IS NOT NULL
  );

-- Pour les classes qui n'ont toujours pas de formation (pas d'étudiants inscrits),
-- assigner Initiale 1 par défaut
UPDATE classes
SET formation_id = (
  SELECT id FROM formations WHERE code = 'INITIAL_1' LIMIT 1
)
WHERE formation_id IS NULL;

-- Vérifier le résultat
SELECT 
  c.id,
  c.code,
  c.nom,
  f.code as formation_code,
  f.nom as formation_nom,
  COUNT(i.id) as nombre_etudiants
FROM classes c
LEFT JOIN formations f ON c.formation_id = f.id
LEFT JOIN inscriptions i ON i.classe_id = c.id
GROUP BY c.id, c.code, c.nom, f.code, f.nom
ORDER BY c.code;

