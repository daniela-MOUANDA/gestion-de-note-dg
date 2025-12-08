-- ============================================
-- Create Test Students for MMI Filiere
-- ============================================
-- This script creates 5 test students enrolled in MMI L1
-- without class assignment so the chef de département can test
-- the class distribution feature

DO $$
DECLARE
  mmi_filiere_id UUID;
  l1_niveau_id UUID;
  promotion_id UUID;
  formation_id UUID;
  i INT;
  etudiant_id UUID;
BEGIN
  -- Get required IDs
  SELECT id INTO mmi_filiere_id FROM filieres WHERE code = 'MMI';
  SELECT id INTO l1_niveau_id FROM niveaux WHERE code = 'L1';
  SELECT id INTO promotion_id FROM promotions WHERE statut = 'EN_COURS' LIMIT 1;
  SELECT id INTO formation_id FROM formations WHERE code = 'INITIAL_1' LIMIT 1;
  
  -- Verify IDs were found
  IF mmi_filiere_id IS NULL THEN
    RAISE EXCEPTION 'MMI filiere not found';
  END IF;
  
  IF l1_niveau_id IS NULL THEN
    RAISE EXCEPTION 'L1 niveau not found';
  END IF;
  
  -- Create 10 test students for better testing
  FOR i IN 1..10 LOOP
    -- Insert student
    INSERT INTO etudiants (matricule, nom, prenom, email, sexe)
    VALUES (
      'MMI2025' || LPAD(i::TEXT, 3, '0'),
      CASE 
        WHEN i % 4 = 0 THEN 'KOUASSI'
        WHEN i % 4 = 1 THEN 'DIALLO'
        WHEN i % 4 = 2 THEN 'TRAORE'
        ELSE 'KONE'
      END,
      'Etudiant ' || i,
      'etudiant.mmi' || i || '@inptic.ga',
      CASE WHEN i % 2 = 0 THEN 'M' ELSE 'F' END
    )
    RETURNING id INTO etudiant_id;
    
    -- Insert inscription WITHOUT classe_id (so chef can assign later)
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
      NULL,  -- No class assigned - chef will assign
      'INSCRIPTION',
      'INSCRIT'
    );
  END LOOP;
  
  RAISE NOTICE '10 test students created for MMI L1';
END $$;

-- Verify creation
SELECT 
  'Verification' as info,
  COUNT(*) as total_students_created,
  COUNT(CASE WHEN sexe = 'M' THEN 1 END) as masculin,
  COUNT(CASE WHEN sexe = 'F' THEN 1 END) as feminin
FROM inscriptions i
JOIN etudiants e ON e.id = i.etudiant_id
WHERE i.filiere_id = (SELECT id FROM filieres WHERE code = 'MMI')
AND i.classe_id IS NULL;

-- Show the created students
SELECT 
  e.matricule,
  e.nom,
  e.prenom,
  e.sexe,
  n.code as niveau,
  i.statut
FROM inscriptions i
JOIN etudiants e ON e.id = i.etudiant_id
JOIN niveaux n ON n.id = i.niveau_id
WHERE i.filiere_id = (SELECT id FROM filieres WHERE code = 'MMI')
ORDER BY e.matricule;
