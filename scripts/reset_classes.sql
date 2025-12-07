-- ============================================
-- Script de Réinitialisation des Classes
-- ============================================
-- Ce script retire les classes des étudiants et supprime les classes existantes
-- pour permettre au chef de département de faire la répartition

-- ÉTAPE 1 : Retirer l'assignation de classe pour tous les étudiants inscrits
-- Cela met classe_id à NULL pour toutes les inscriptions
UPDATE inscriptions
SET classe_id = NULL
WHERE statut = 'INSCRIT';

-- ÉTAPE 2 : Supprimer toutes les classes existantes
-- ATTENTION : Cela supprimera aussi les modules, emplois du temps, etc. liés aux classes
-- Si vous voulez garder certaines classes, ajoutez une condition WHERE

DELETE FROM classes;

-- ÉTAPE 3 : Vérification - Compter les étudiants sans classe
SELECT 
  COUNT(*) as total_inscriptions,
  COUNT(classe_id) as avec_classe,
  COUNT(*) - COUNT(classe_id) as sans_classe
FROM inscriptions
WHERE statut = 'INSCRIT';

-- ÉTAPE 4 : Vérification - Voir la répartition par filière et niveau
SELECT 
  f.code as filiere,
  f.nom as nom_filiere,
  n.code as niveau,
  COUNT(i.id) as nombre_etudiants
FROM inscriptions i
JOIN filieres f ON f.id = i.filiere_id
JOIN niveaux n ON n.id = i.niveau_id
WHERE i.statut = 'INSCRIT'
  AND i.classe_id IS NULL
GROUP BY f.code, f.nom, n.code
ORDER BY f.code, n.code;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================
-- Après l'exécution de ce script :
-- - Tous les étudiants inscrits n'auront plus de classe (classe_id = NULL)
-- - Toutes les classes seront supprimées
-- - Le chef de département pourra créer de nouvelles classes et répartir les étudiants
