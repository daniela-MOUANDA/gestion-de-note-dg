-- ============================================
-- Fix MTIC Department Configuration
-- ============================================
-- This script links the MMI filiere to MTIC department
-- and ensures Christine BEKALE is properly configured

-- STEP 1: Verify current configuration
SELECT 
  'Current Departments' as info,
  id, code, nom
FROM departements
WHERE code IN ('MTIC', 'RSN')
ORDER BY code;

-- STEP 2: Check MMI filiere current department
SELECT 
  'MMI Filiere Current Config' as info,
  f.id,
  f.code,
  f.nom,
  f.departement_id,
  d.nom as departement_actuel
FROM filieres f
LEFT JOIN departements d ON d.id = f.departement_id
WHERE f.code = 'MMI' OR f.nom LIKE '%Management et Multimedia%';

-- STEP 3: Link MMI filiere to MTIC department
UPDATE filieres
SET departement_id = (SELECT id FROM departements WHERE code = 'MTIC')
WHERE code = 'MMI' OR nom LIKE '%Management et Multimedia%';

-- STEP 4: Verify Christine BEKALE's department
SELECT 
  'Christine BEKALE Config' as info,
  u.id,
  u.nom,
  u.prenom,
  u.departement_id,
  d.code as departement_code,
  d.nom as departement_nom
FROM utilisateurs u
LEFT JOIN departements d ON d.id = u.departement_id
WHERE u.nom = 'BEKALE' AND u.prenom = 'Christine';

-- STEP 5: Link Christine to MTIC department (if needed)
UPDATE utilisateurs
SET departement_id = (SELECT id FROM departements WHERE code = 'MTIC')
WHERE nom = 'BEKALE' AND prenom = 'Christine';

-- STEP 6: Verify the fix - Check students in MMI
SELECT 
  'Students in MMI' as info,
  COUNT(*) as total_etudiants,
  n.code as niveau
FROM inscriptions i
JOIN filieres f ON f.id = i.filiere_id
JOIN niveaux n ON n.id = i.niveau_id
WHERE f.code = 'MMI'
  AND i.statut = 'INSCRIT'
GROUP BY n.code
ORDER BY n.code;

-- STEP 7: Verify the fix - Check classes in MMI
SELECT 
  'Classes in MMI' as info,
  COUNT(*) as total_classes
FROM classes c
JOIN filieres f ON f.id = c.filiere_id
WHERE f.code = 'MMI';

-- STEP 8: Verify the fix - Check teachers in MTIC
SELECT 
  'Teachers in MTIC' as info,
  COUNT(*) as total_enseignants
FROM enseignants e
WHERE e.departement_id = (SELECT id FROM departements WHERE code = 'MTIC')
  AND e.actif = true;

-- STEP 9: Final verification - What Christine should see
SELECT 
  'Final Config for MTIC Dashboard' as info,
  (SELECT COUNT(*) FROM classes c 
   JOIN filieres f ON f.id = c.filiere_id 
   WHERE f.departement_id = (SELECT id FROM departements WHERE code = 'MTIC')) as total_classes,
  (SELECT COUNT(*) FROM enseignants 
   WHERE departement_id = (SELECT id FROM departements WHERE code = 'MTIC') 
   AND actif = true) as total_enseignants,
  (SELECT COUNT(*) FROM inscriptions i 
   JOIN filieres f ON f.id = i.filiere_id 
   WHERE f.departement_id = (SELECT id FROM departements WHERE code = 'MTIC') 
   AND i.statut = 'INSCRIT') as total_etudiants;

-- ============================================
-- EXPECTED RESULTS
-- ============================================
-- After running this script:
-- - MMI filiere should be linked to MTIC department
-- - Christine BEKALE should be linked to MTIC department
-- - Dashboard should show real counts for classes, teachers, students
