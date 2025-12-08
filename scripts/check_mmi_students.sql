-- ============================================
-- Complete Diagnostic for MMI Students
-- ============================================

-- STEP 1: Check if MMI filiere exists and is linked to MTIC
SELECT 
  'MMI Filiere Configuration' as check_type,
  f.id,
  f.code,
  f.nom,
  f.departement_id,
  d.code as dept_code,
  d.nom as dept_nom
FROM filieres f
LEFT JOIN departements d ON d.id = f.departement_id
WHERE f.code = 'MMI' OR f.nom LIKE '%Management et Multimedia%';

-- STEP 2: Check ALL inscriptions in MMI (with or without classe_id)
SELECT 
  'All MMI Inscriptions' as check_type,
  COUNT(*) as total,
  COUNT(CASE WHEN classe_id IS NULL THEN 1 END) as sans_classe,
  COUNT(CASE WHEN classe_id IS NOT NULL THEN 1 END) as avec_classe
FROM inscriptions
WHERE filiere_id = (SELECT id FROM filieres WHERE code = 'MMI')
  AND statut = 'INSCRIT';

-- STEP 3: Detailed list of MMI students
SELECT 
  'MMI Students Detail' as check_type,
  i.id as inscription_id,
  e.matricule,
  e.nom,
  e.prenom,
  n.code as niveau,
  i.classe_id,
  c.code as classe_code,
  i.statut
FROM inscriptions i
JOIN etudiants e ON e.id = i.etudiant_id
JOIN filieres f ON f.id = i.filiere_id
JOIN niveaux n ON n.id = i.niveau_id
LEFT JOIN classes c ON c.id = i.classe_id
WHERE f.code = 'MMI'
ORDER BY n.code, e.nom;

-- STEP 4: Check if there are ANY students in the database
SELECT 
  'Total Students in System' as check_type,
  COUNT(*) as total_etudiants
FROM etudiants;

-- STEP 5: Check inscriptions by filiere
SELECT 
  'Inscriptions by Filiere' as check_type,
  f.code as filiere,
  f.nom,
  COUNT(i.id) as total_inscriptions,
  COUNT(CASE WHEN i.classe_id IS NULL THEN 1 END) as sans_classe
FROM filieres f
LEFT JOIN inscriptions i ON i.filiere_id = f.id AND i.statut = 'INSCRIT'
GROUP BY f.id, f.code, f.nom
ORDER BY f.code;

-- STEP 6: If no students in MMI, check if we need to create test data
-- This will show if the database is empty or if it's just MMI
SELECT 
  'Need Test Data?' as check_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM inscriptions WHERE filiere_id = (SELECT id FROM filieres WHERE code = 'MMI')) = 0 
    THEN 'YES - No students in MMI, create test data'
    WHEN (SELECT COUNT(*) FROM inscriptions WHERE filiere_id = (SELECT id FROM filieres WHERE code = 'MMI') AND classe_id IS NULL) = 0
    THEN 'YES - All MMI students have classes, need to remove classes or add new students'
    ELSE 'NO - There are students without classes'
  END as recommendation;

-- ============================================
-- If you need to create test students for MMI
-- ============================================

-- Uncomment and run this section if you need test data:

/*
-- Create 5 test students for MMI L1
DO $$
DECLARE
  mmi_filiere_id UUID;
  l1_niveau_id UUID;
  promotion_id UUID;
  formation_id UUID;
  i INT;
  etudiant_id UUID;
BEGIN
  -- Get IDs
  SELECT id INTO mmi_filiere_id FROM filieres WHERE code = 'MMI';
  SELECT id INTO l1_niveau_id FROM niveaux WHERE code = 'L1';
  SELECT id INTO promotion_id FROM promotions WHERE statut = 'EN_COURS' LIMIT 1;
  SELECT id INTO formation_id FROM formations WHERE code = 'INITIAL_1' LIMIT 1;
  
  -- Create 5 students
  FOR i IN 1..5 LOOP
    -- Insert student
    INSERT INTO etudiants (matricule, nom, prenom, email, sexe)
    VALUES (
      'MMI' || LPAD(i::TEXT, 3, '0'),
      'ETUDIANT',
      'Test ' || i,
      'test.mmi' || i || '@inptic.ga',
      CASE WHEN i % 2 = 0 THEN 'M' ELSE 'F' END
    )
    RETURNING id INTO etudiant_id;
    
    -- Insert inscription WITHOUT classe_id
    INSERT INTO inscriptions (
      etudiant_id,
      promotion_id,
      formation_id,
      filiere_id,
      niveau_id,
      classe_id,
      type_inscription,
      statut
    )
    VALUES (
      etudiant_id,
      promotion_id,
      formation_id,
      mmi_filiere_id,
      l1_niveau_id,
      NULL,  -- No class assigned
      'INSCRIPTION',
      'INSCRIT'
    );
  END LOOP;
  
  RAISE NOTICE '5 test students created for MMI L1';
END $$;

-- Verify creation
SELECT COUNT(*) as new_students FROM inscriptions 
WHERE filiere_id = (SELECT id FROM filieres WHERE code = 'MMI')
AND classe_id IS NULL;
*/
