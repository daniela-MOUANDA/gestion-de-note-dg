-- ============================================
-- Migration: Add Gender Field to Users and Students
-- ============================================
-- This script adds a 'sexe' field to both utilisateurs and etudiants tables
-- and populates existing records with random M/F values

-- STEP 1: Create the Sexe enum type
DO $$ BEGIN
    CREATE TYPE "Sexe" AS ENUM ('M', 'F');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- STEP 2: Add sexe column to utilisateurs table
ALTER TABLE utilisateurs 
ADD COLUMN IF NOT EXISTS sexe "Sexe";

-- STEP 3: Add sexe column to etudiants table
ALTER TABLE etudiants 
ADD COLUMN IF NOT EXISTS sexe "Sexe";

-- STEP 4: Populate utilisateurs with random gender (roughly 50/50 split)
-- This uses a random function to assign M or F
UPDATE utilisateurs
SET sexe = CASE 
    WHEN random() < 0.5 THEN 'M'::"Sexe"
    ELSE 'F'::"Sexe"
END
WHERE sexe IS NULL;

-- STEP 5: Populate etudiants with random gender (roughly 50/50 split)
UPDATE etudiants
SET sexe = CASE 
    WHEN random() < 0.5 THEN 'M'::"Sexe"
    ELSE 'F'::"Sexe"
END
WHERE sexe IS NULL;

-- STEP 6: Verification - Count by gender in utilisateurs
SELECT 
    sexe,
    COUNT(*) as nombre
FROM utilisateurs
GROUP BY sexe
ORDER BY sexe;

-- STEP 7: Verification - Count by gender in etudiants
SELECT 
    sexe,
    COUNT(*) as nombre
FROM etudiants
GROUP BY sexe
ORDER BY sexe;

-- STEP 8: Add comment to document the field
COMMENT ON COLUMN utilisateurs.sexe IS 'Sexe de l''utilisateur: M (Masculin) ou F (Féminin)';
COMMENT ON COLUMN etudiants.sexe IS 'Sexe de l''étudiant: M (Masculin) ou F (Féminin)';

-- ============================================
-- EXPECTED RESULTS
-- ============================================
-- After running this script:
-- - Both tables will have a 'sexe' column of type Sexe enum
-- - All existing records will have a random M or F value
-- - Roughly 50% M and 50% F distribution
