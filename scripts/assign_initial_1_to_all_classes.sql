-- ============================================
-- SCRIPT : Assigner Initiale 1 à toutes les classes existantes
-- ============================================
-- Ce script assigne la formation "Initiale 1" à toutes les classes existantes
-- qui n'ont pas encore de formation_id.

-- Assigner Initiale 1 à toutes les classes sans formation
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
  c.effectif,
  COUNT(i.id) as nombre_etudiants_inscrits
FROM classes c
LEFT JOIN formations f ON c.formation_id = f.id
LEFT JOIN inscriptions i ON i.classe_id = c.id
GROUP BY c.id, c.code, c.nom, f.code, f.nom, c.effectif
ORDER BY c.code;

-- Afficher le nombre de classes mises à jour
SELECT 
  COUNT(*) as total_classes,
  COUNT(CASE WHEN formation_id IS NOT NULL THEN 1 END) as classes_avec_formation,
  COUNT(CASE WHEN formation_id IS NULL THEN 1 END) as classes_sans_formation
FROM classes;
