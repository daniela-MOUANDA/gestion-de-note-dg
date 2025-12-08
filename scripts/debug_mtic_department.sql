-- ============================================
-- Diagnostic Script for MTIC Department
-- ============================================
-- This script checks the configuration and data for MTIC department

-- STEP 1: Check all departments
SELECT id, code, nom, actif
FROM departements
ORDER BY nom;

-- STEP 2: Check MTIC department specifically
SELECT id, code, nom, actif
FROM departements
WHERE nom LIKE '%MTIC%' OR code LIKE '%MTIC%';

-- STEP 3: Check filieres and their department associations
SELECT 
  f.id,
  f.code,
  f.nom,
  f.departement_id,
  d.nom as departement_nom,
  d.code as departement_code
FROM filieres f
LEFT JOIN departements d ON d.id = f.departement_id
ORDER BY f.nom;

-- STEP 4: Check MMIC filiere specifically
SELECT 
  f.id,
  f.code,
  f.nom,
  f.departement_id,
  d.nom as departement_nom
FROM filieres f
LEFT JOIN departements d ON d.id = f.departement_id
WHERE f.code LIKE '%MMI%' OR f.nom LIKE '%Multimedia%' OR f.nom LIKE '%Management%';

-- STEP 5: Check if there are students enrolled in MMIC
SELECT 
  COUNT(*) as total_inscriptions,
  f.code as filiere,
  n.code as niveau
FROM inscriptions i
JOIN filieres f ON f.id = i.filiere_id
JOIN niveaux n ON n.id = i.niveau_id
WHERE f.code LIKE '%MMI%'
  AND i.statut = 'INSCRIT'
GROUP BY f.code, n.code;

-- STEP 6: Check chef de département MTIC
SELECT 
  u.id,
  u.nom,
  u.prenom,
  u.email,
  u.departement_id,
  d.nom as departement_nom,
  d.code as departement_code,
  r.code as role_code
FROM utilisateurs u
LEFT JOIN departements d ON d.id = u.departement_id
LEFT JOIN roles r ON r.id = u.role_id
WHERE r.code = 'CHEF_DEPARTEMENT'
  AND (d.nom LIKE '%MTIC%' OR d.code LIKE '%MTIC%' OR u.nom LIKE '%BEKALE%');

-- STEP 7: Check classes for MMIC filiere
SELECT 
  c.id,
  c.code,
  c.nom,
  c.effectif,
  f.code as filiere,
  n.code as niveau
FROM classes c
JOIN filieres f ON f.id = c.filiere_id
JOIN niveaux n ON n.id = c.niveau_id
WHERE f.code LIKE '%MMI%';

-- STEP 8: Check enseignants in MTIC department
SELECT 
  e.id,
  e.nom,
  e.prenom,
  e.email,
  e.departement_id,
  d.nom as departement_nom
FROM enseignants e
LEFT JOIN departements d ON d.id = e.departement_id
WHERE d.nom LIKE '%MTIC%' OR d.code LIKE '%MTIC%';

-- ============================================
-- DIAGNOSTIC SUMMARY
-- ============================================
-- After running these queries, check:
-- 1. Does MTIC department exist?
-- 2. Is MMIC filiere linked to MTIC department?
-- 3. Are there students enrolled in MMIC?
-- 4. Is Christine BEKALE's departement_id correct?
-- 5. Are there classes created for MMIC?
-- 6. Are there teachers in MTIC department?
