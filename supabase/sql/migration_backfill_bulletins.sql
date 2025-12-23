-- Script pour récupérer les anciens bulletins et les mettre dans la file d'attente du DEP
-- Version V3 : Correction des jointures (Classe -> Filiere -> Departement) et des noms de colonnes

DO $$ 
DECLARE 
    chef_role_id UUID;
BEGIN
    -- Récupérer l'ID du rôle CHEF_DEPARTEMENT
    SELECT id INTO chef_role_id FROM roles WHERE code = 'CHEF_DEPARTEMENT' LIMIT 1;

    -- Insertion des lots dans bulletins_generes
    INSERT INTO "bulletins_generes" (
      "classeId", 
      "semestre", 
      "departementId", 
      "chefDepartementId", 
      "dateGeneration", 
      "statut", 
      "nombreEtudiants", 
      "anneeAcademique"
    )
    SELECT 
      b.classe_id, 
      b.semestre::text,
      f.departement_id, -- Le département est lié à la filière
      -- Essayer de trouver le chef du département
      COALESCE(
        (SELECT u.id FROM utilisateurs u WHERE u.departement_id = f.departement_id AND u.role_id = chef_role_id LIMIT 1),
        (SELECT u.id FROM utilisateurs u LIMIT 1) -- Fallback
      ) as "chefDepartementId",
      NOW() as "dateGeneration",
      CASE 
        WHEN b.statut_visa::text = 'VISE' THEN 'VISE'::"StatutVisa" 
        ELSE 'EN_ATTENTE'::"StatutVisa" 
      END as statut,
      COUNT(b.id) as "nombreEtudiants",
      b.annee_academique
    FROM "bulletins" b
    JOIN "classes" c ON b.classe_id = c.id
    JOIN "filieres" f ON c.filiere_id = f.id -- Jointure supplémentaire pour récupérer le département
    LEFT JOIN "bulletins_generes" bg ON 
        bg."classeId" = b.classe_id AND 
        bg.semestre = b.semestre::text AND 
        bg."anneeAcademique" = b.annee_academique
    WHERE bg.id IS NULL
    GROUP BY 
      b.classe_id, 
      b.semestre, 
      f.departement_id, 
      b.statut_visa, 
      b.annee_academique;
      
END $$;

-- Vérification
SELECT count(*) as nouveaux_lots_crees FROM "bulletins_generes";
