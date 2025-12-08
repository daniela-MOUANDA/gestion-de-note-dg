-- ============================================
-- Fix: Correct MTIC Inscriptions to MMI Filiere
-- ============================================
-- Problem: Students were enrolled with MTIC (department) as filiere
-- Solution: Change their filiere_id to MMI (the actual filiere)

-- STEP 1: Verify the problem - Check if there's a MTIC filiere
SELECT 
  'Current Filieres' as info,
  id,
  code,
  nom,
  departement_id
FROM filieres
WHERE code IN ('MTIC', 'MMI')
ORDER BY code;

-- STEP 2: Count students enrolled with wrong filiere
SELECT 
  'Students with MTIC as filiere' as info,
  COUNT(*) as total_students
FROM inscriptions
WHERE filiere_id = (SELECT id FROM filieres WHERE code = 'MTIC');

-- STEP 3: Show sample of affected students
SELECT 
  'Sample of affected students' as info,
  e.matricule,
  e.nom,
  e.prenom,
  f.code as current_filiere,
  n.code as niveau
FROM inscriptions i
JOIN etudiants e ON e.id = i.etudiant_id
JOIN filieres f ON f.id = i.filiere_id
JOIN niveaux n ON n.id = i.niveau_id
WHERE f.code = 'MTIC'
LIMIT 10;

-- STEP 4: FIX - Update all MTIC inscriptions to MMI
UPDATE inscriptions
SET filiere_id = (SELECT id FROM filieres WHERE code = 'MMI')
WHERE filiere_id = (SELECT id FROM filieres WHERE code = 'MTIC');

-- STEP 5: Verify the fix
SELECT 
  'After Fix - MMI Students' as info,
  COUNT(*) as total_students,
  COUNT(CASE WHEN classe_id IS NULL THEN 1 END) as sans_classe,
  COUNT(CASE WHEN classe_id IS NOT NULL THEN 1 END) as avec_classe
FROM inscriptions
WHERE filiere_id = (SELECT id FROM filieres WHERE code = 'MMI')
  AND statut = 'INSCRIT';

-- STEP 6: Verify by niveau
SELECT 
  'MMI Students by Niveau' as info,
  n.code as niveau,
  COUNT(*) as total_students,
  COUNT(CASE WHEN i.classe_id IS NULL THEN 1 END) as sans_classe
FROM inscriptions i
JOIN niveaux n ON n.id = i.niveau_id
WHERE i.filiere_id = (SELECT id FROM filieres WHERE code = 'MMI')
  AND i.statut = 'INSCRIT'
GROUP BY n.code
ORDER BY n.code;

-- STEP 7: Check if MTIC filiere should be deleted
-- (Since MTIC is a department, not a filiere)
SELECT 
  'Should MTIC filiere be deleted?' as info,
  CASE 
    WHEN COUNT(*) = 0 THEN 'YES - No more students in MTIC filiere, safe to delete'
    ELSE 'NO - Still has ' || COUNT(*) || ' students'
  END as recommendation
FROM inscriptions
WHERE filiere_id = (SELECT id FROM filieres WHERE code = 'MTIC');

-- OPTIONAL: Delete MTIC filiere if it's empty
-- Uncomment if you want to remove it

DELETE FROM filieres WHERE code = 'MTIC';
SELECT 'MTIC filiere deleted' as info;


-- STEP 8: Final verification - What Christine should see now
SELECT 
  'Final Stats for MTIC Dashboard' as info,
  (SELECT COUNT(*) FROM classes c 
   JOIN filieres f ON f.id = c.filiere_id 
   WHERE f.code = 'MMI') as total_classes,
  (SELECT COUNT(*) FROM enseignants 
   WHERE departement_id = (SELECT id FROM departements WHERE code = 'MTIC') 
   AND actif = true) as total_enseignants,
  (SELECT COUNT(*) FROM inscriptions i 
   WHERE i.filiere_id = (SELECT id FROM filieres WHERE code = 'MMI')
   AND i.statut = 'INSCRIT') as total_etudiants,
  (SELECT COUNT(*) FROM inscriptions i 
   WHERE i.filiere_id = (SELECT id FROM filieres WHERE code = 'MMI')
   AND i.statut = 'INSCRIT'
   AND i.classe_id IS NULL) as etudiants_sans_classe;
