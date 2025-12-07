-- Script de vérification pour diagnostiquer le problème d'affichage des étudiants

-- 1. Vérifier les filières disponibles
SELECT id, code, nom, departement_id 
FROM filieres 
ORDER BY nom;

-- 2. Vérifier les niveaux disponibles
SELECT id, code, nom 
FROM niveaux 
ORDER BY code;

-- 3. Vérifier les inscriptions pour MMIC L1
-- (Remplacer les IDs selon les résultats des requêtes ci-dessus)
SELECT 
  i.id,
  i.statut,
  i.classe_id,
  e.matricule,
  e.nom,
  e.prenom,
  f.code as filiere,
  n.code as niveau
FROM inscriptions i
JOIN etudiants e ON e.id = i.etudiant_id
JOIN filieres f ON f.id = i.filiere_id
JOIN niveaux n ON n.id = i.niveau_id
WHERE f.code = 'MMIC' -- ou le code correct de la filière
  AND n.code = 'L1'
ORDER BY i.date_inscription;

-- 4. Vérifier si classe_id est déjà NULL dans la base
SELECT 
  COUNT(*) as total_inscriptions,
  COUNT(classe_id) as avec_classe,
  COUNT(*) - COUNT(classe_id) as sans_classe
FROM inscriptions
WHERE statut = 'INSCRIT';

-- 5. Vérifier la structure de la table inscriptions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'inscriptions'
  AND column_name = 'classe_id';
