-- ============================================
-- SCRIPT SQL : RETIRER LES ÉTUDIANTS DES CLASSES
-- ============================================
-- Ce script retire tous les étudiants des classes auxquelles ils ont été
-- automatiquement assignés, pour permettre une réaffectation manuelle.
--
-- ATTENTION : Cette opération est irréversible. Faites une sauvegarde avant d'exécuter.
-- ============================================

BEGIN;

-- Étape 0 : Vérifier et modifier la contrainte si nécessaire
-- (Si classe_id est NOT NULL, on doit d'abord le rendre nullable)
DO $$
BEGIN
    -- Vérifier si la colonne classe_id est NOT NULL
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'inscriptions'
          AND column_name = 'classe_id'
          AND is_nullable = 'NO'
    ) THEN
        -- Rendre la colonne nullable
        ALTER TABLE inscriptions ALTER COLUMN classe_id DROP NOT NULL;
        RAISE NOTICE 'Colonne classe_id rendue nullable';
    ELSE
        RAISE NOTICE 'Colonne classe_id est déjà nullable';
    END IF;
END $$;

-- Étape 1 : Décrémenter l'effectif de toutes les classes concernées
-- (on décrémente pour chaque inscription qui a une classe assignée)
UPDATE classes
SET effectif = GREATEST(0, effectif - (
    SELECT COUNT(*)
    FROM inscriptions
    WHERE inscriptions.classe_id = classes.id
))
WHERE id IN (
    SELECT DISTINCT classe_id
    FROM inscriptions
    WHERE classe_id IS NOT NULL
);

-- Étape 2 : Retirer les étudiants des classes (mettre classe_id à NULL)
UPDATE inscriptions
SET classe_id = NULL
WHERE classe_id IS NOT NULL;

-- Étape 3 : Mettre le statut à 'INSCRIT' pour que les étudiants apparaissent dans la répartition
-- (uniquement pour les étudiants qui ont le statut 'VALIDEE' ou 'EN_ATTENTE')
UPDATE inscriptions
SET statut = 'INSCRIT'
WHERE statut IN ('VALIDEE', 'EN_ATTENTE')
  AND classe_id IS NULL;

-- Vérification : Afficher le nombre d'étudiants retirés
SELECT 
    COUNT(*) as total_etudiants_retires,
    COUNT(DISTINCT filiere_id) as nombre_filieres_affectees
FROM inscriptions
WHERE classe_id IS NULL;

COMMIT;

-- ============================================
-- REQUÊTE DE VÉRIFICATION (à exécuter après)
-- ============================================
-- Pour vérifier que tout s'est bien passé, exécutez cette requête :

-- SELECT 
--     i.id,
--     e.matricule,
--     e.nom,
--     e.prenom,
--     f.nom as filiere,
--     n.nom as niveau,
--     i.statut,
--     i.classe_id
-- FROM inscriptions i
-- JOIN etudiants e ON i.etudiant_id = e.id
-- JOIN filieres f ON i.filiere_id = f.id
-- JOIN niveaux n ON i.niveau_id = n.id
-- WHERE i.classe_id IS NULL
-- ORDER BY e.nom, e.prenom;

