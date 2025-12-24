-- ============================================
-- SCRIPT SQL SIMPLIFIÉ : RETIRER LES ÉTUDIANTS DES CLASSES
-- ============================================
-- Version simplifiée pour retirer tous les étudiants des classes
-- et les rendre disponibles pour réaffectation manuelle
-- ============================================

-- IMPORTANT : Exécutez d'abord cette commande si classe_id est NOT NULL :
-- ALTER TABLE inscriptions ALTER COLUMN classe_id DROP NOT NULL;

BEGIN;

-- 1. Sauvegarder les effectifs actuels (pour vérification)
CREATE TEMP TABLE IF NOT EXISTS effectifs_avant AS
SELECT 
    c.id as classe_id,
    c.code as classe_code,
    c.effectif as effectif_avant,
    COUNT(i.id) as inscriptions_actuelles
FROM classes c
LEFT JOIN inscriptions i ON i.classe_id = c.id
GROUP BY c.id, c.code, c.effectif;

-- 2. Décrémenter l'effectif des classes
UPDATE classes c
SET effectif = GREATEST(0, c.effectif - (
    SELECT COUNT(*)
    FROM inscriptions i
    WHERE i.classe_id = c.id
))
WHERE EXISTS (
    SELECT 1
    FROM inscriptions i
    WHERE i.classe_id = c.id
);

-- 3. Retirer tous les étudiants des classes (mettre classe_id à NULL)
UPDATE inscriptions
SET classe_id = NULL
WHERE classe_id IS NOT NULL;

-- 4. Mettre le statut à 'INSCRIT' pour qu'ils apparaissent dans la répartition
UPDATE inscriptions
SET statut = 'INSCRIT'
WHERE statut IN ('VALIDEE', 'EN_ATTENTE')
  AND classe_id IS NULL;

-- 5. Afficher un résumé
SELECT 
    'Résumé de l''opération' as info,
    (SELECT COUNT(*) FROM inscriptions WHERE classe_id IS NULL) as etudiants_sans_classe,
    (SELECT COUNT(DISTINCT filiere_id) FROM inscriptions WHERE classe_id IS NULL) as filieres_affectees,
    (SELECT COUNT(DISTINCT niveau_id) FROM inscriptions WHERE classe_id IS NULL) as niveaux_affectes;

COMMIT;

-- ============================================
-- REQUÊTE DE VÉRIFICATION
-- ============================================
-- Exécutez cette requête pour voir les étudiants retirés :

/*
SELECT 
    e.matricule,
    e.nom || ' ' || e.prenom as nom_complet,
    f.nom as filiere,
    n.nom as niveau,
    i.statut,
    i.date_inscription
FROM inscriptions i
JOIN etudiants e ON i.etudiant_id = e.id
JOIN filieres f ON i.filiere_id = f.id
JOIN niveaux n ON i.niveau_id = n.id
WHERE i.classe_id IS NULL
ORDER BY f.nom, n.nom, e.nom, e.prenom;
*/

