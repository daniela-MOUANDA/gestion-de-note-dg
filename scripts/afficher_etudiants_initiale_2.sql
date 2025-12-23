-- ============================================
-- REQUÊTE : Afficher tous les étudiants en Initiale 2
-- ============================================

-- Option 1 : Afficher les étudiants avec leurs informations d'inscription
SELECT 
  e.id as etudiant_id,
  e.matricule,
  e.nom,
  e.prenom,
  e.email,
  e.telephone,
  e.date_naissance,
  e.lieu_naissance,
  e.nationalite,
  e.sexe,
  i.id as inscription_id,
  i.date_inscription,
  i.statut as statut_inscription,
  i.type_inscription,
  f.code as formation_code,
  f.nom as formation_nom,
  fil.code as filiere_code,
  fil.nom as filiere_nom,
  n.code as niveau_code,
  n.nom as niveau_nom,
  c.code as classe_code,
  c.nom as classe_nom,
  p.annee as promotion
FROM etudiants e
INNER JOIN inscriptions i ON i.etudiant_id = e.id
INNER JOIN formations f ON i.formation_id = f.id
LEFT JOIN filieres fil ON i.filiere_id = fil.id
LEFT JOIN niveaux n ON i.niveau_id = n.id
LEFT JOIN classes c ON i.classe_id = c.id
LEFT JOIN promotions p ON i.promotion_id = p.id
WHERE f.code = 'INITIAL_2'
ORDER BY e.nom, e.prenom;

-- Option 2 : Compter les étudiants par statut d'inscription
SELECT 
  i.statut,
  COUNT(DISTINCT e.id) as nombre_etudiants
FROM etudiants e
INNER JOIN inscriptions i ON i.etudiant_id = e.id
INNER JOIN formations f ON i.formation_id = f.id
WHERE f.code = 'INITIAL_2'
GROUP BY i.statut
ORDER BY i.statut;

-- Option 3 : Compter les étudiants par filière et niveau
SELECT 
  fil.code as filiere_code,
  fil.nom as filiere_nom,
  n.code as niveau_code,
  n.nom as niveau_nom,
  COUNT(DISTINCT e.id) as nombre_etudiants
FROM etudiants e
INNER JOIN inscriptions i ON i.etudiant_id = e.id
INNER JOIN formations f ON i.formation_id = f.id
LEFT JOIN filieres fil ON i.filiere_id = fil.id
LEFT JOIN niveaux n ON i.niveau_id = n.id
WHERE f.code = 'INITIAL_2'
GROUP BY fil.code, fil.nom, n.code, n.nom
ORDER BY fil.code, n.code;

-- Option 4 : Afficher les étudiants sans classe assignée
SELECT 
  e.id as etudiant_id,
  e.matricule,
  e.nom,
  e.prenom,
  e.email,
  i.statut as statut_inscription,
  fil.code as filiere_code,
  fil.nom as filiere_nom,
  n.code as niveau_code,
  n.nom as niveau_nom,
  CASE 
    WHEN i.classe_id IS NULL THEN 'Sans classe'
    ELSE c.code
  END as classe
FROM etudiants e
INNER JOIN inscriptions i ON i.etudiant_id = e.id
INNER JOIN formations f ON i.formation_id = f.id
LEFT JOIN filieres fil ON i.filiere_id = fil.id
LEFT JOIN niveaux n ON i.niveau_id = n.id
LEFT JOIN classes c ON i.classe_id = c.id
WHERE f.code = 'INITIAL_2'
ORDER BY i.classe_id NULLS FIRST, e.nom, e.prenom;

-- Option 5 : Résumé global
SELECT 
  COUNT(DISTINCT e.id) as total_etudiants_initiale_2,
  COUNT(DISTINCT CASE WHEN i.classe_id IS NULL THEN e.id END) as etudiants_sans_classe,
  COUNT(DISTINCT CASE WHEN i.classe_id IS NOT NULL THEN e.id END) as etudiants_avec_classe,
  COUNT(DISTINCT CASE WHEN i.statut = 'INSCRIT' THEN e.id END) as etudiants_inscrits,
  COUNT(DISTINCT CASE WHEN i.statut = 'EN_ATTENTE' THEN e.id END) as etudiants_en_attente,
  COUNT(DISTINCT CASE WHEN i.statut = 'VALIDEE' THEN e.id END) as etudiants_valides
FROM etudiants e
INNER JOIN inscriptions i ON i.etudiant_id = e.id
INNER JOIN formations f ON i.formation_id = f.id
WHERE f.code = 'INITIAL_2';
