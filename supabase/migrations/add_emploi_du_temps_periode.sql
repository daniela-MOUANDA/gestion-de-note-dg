-- Migration pour ajouter le support des périodes et types d'activités aux emplois du temps
-- À exécuter dans Supabase SQL Editor

-- 1. Créer l'enum pour les types d'activités
CREATE TYPE "TypeActivite" AS ENUM ('COURS', 'TP', 'TD', 'DEVOIR');

-- 2. Ajouter les nouvelles colonnes à la table emplois_du_temps
ALTER TABLE "emplois_du_temps" 
  ADD COLUMN "date_debut" DATE,
  ADD COLUMN "date_fin" DATE,
  ADD COLUMN "type_activite" "TypeActivite" DEFAULT 'COURS',
  ADD COLUMN "est_recurrent" BOOLEAN DEFAULT true,
  ADD COLUMN "date_specifique" DATE,
  ADD COLUMN "groupe_recurrence" UUID;

-- 3. Mettre à jour les données existantes
-- Définir une période par défaut pour les emplois du temps existants
-- (Ajuster les dates selon vos besoins)
UPDATE "emplois_du_temps"
SET 
  "date_debut" = CASE 
    WHEN "semestre" = 'S1' THEN DATE('2025-09-01')
    ELSE DATE('2026-02-01')
  END,
  "date_fin" = CASE 
    WHEN "semestre" = 'S1' THEN DATE('2026-01-31')
    ELSE DATE('2026-06-30')
  END,
  "type_activite" = 'COURS',
  "est_recurrent" = true,
  "groupe_recurrence" = gen_random_uuid()
WHERE "date_debut" IS NULL;

-- 4. Rendre les colonnes obligatoires maintenant qu'elles ont des valeurs
ALTER TABLE "emplois_du_temps" 
  ALTER COLUMN "date_debut" SET NOT NULL,
  ALTER COLUMN "date_fin" SET NOT NULL,
  ALTER COLUMN "type_activite" SET NOT NULL,
  ALTER COLUMN "est_recurrent" SET NOT NULL;

-- 5. Ajouter des index pour améliorer les performances
CREATE INDEX "idx_emplois_du_temps_periode" ON "emplois_du_temps" ("classe_id", "date_debut", "date_fin");
CREATE INDEX "idx_emplois_du_temps_groupe" ON "emplois_du_temps" ("groupe_recurrence");
CREATE INDEX "idx_emplois_du_temps_date_specifique" ON "emplois_du_temps" ("date_specifique") WHERE "date_specifique" IS NOT NULL;

-- 6. Ajouter une contrainte pour vérifier la cohérence des dates
ALTER TABLE "emplois_du_temps"
  ADD CONSTRAINT "check_dates_coherentes" CHECK ("date_fin" >= "date_debut");

-- 7. Ajouter une contrainte pour les devoirs ponctuels
ALTER TABLE "emplois_du_temps"
  ADD CONSTRAINT "check_devoir_date_specifique" 
  CHECK (
    ("est_recurrent" = true AND "date_specifique" IS NULL) OR
    ("est_recurrent" = false AND "date_specifique" IS NOT NULL)
  );

-- 8. Créer une vue pour faciliter les requêtes d'emploi du temps
CREATE OR REPLACE VIEW "v_emplois_du_temps_detailles" AS
SELECT 
  edt.id,
  edt.classe_id,
  edt.module_id,
  edt.enseignant_id,
  edt.jour,
  edt.heure_debut,
  edt.heure_fin,
  edt.salle,
  edt.semestre,
  edt.annee_academique,
  edt.date_debut,
  edt.date_fin,
  edt.type_activite,
  edt.est_recurrent,
  edt.date_specifique,
  edt.groupe_recurrence,
  c.code as classe_code,
  c.nom as classe_nom,
  m.code as module_code,
  m.nom as module_nom,
  m.credit as module_credit,
  e.nom as enseignant_nom,
  e.prenom as enseignant_prenom,
  e.email as enseignant_email
FROM "emplois_du_temps" edt
JOIN "classes" c ON edt.classe_id = c.id
JOIN "modules" m ON edt.module_id = m.id
JOIN "enseignants" e ON edt.enseignant_id = e.id;

-- 9. Créer une fonction pour obtenir les dates d'un jour de la semaine dans une période
CREATE OR REPLACE FUNCTION get_dates_for_weekday(
  p_jour TEXT,
  p_date_debut DATE,
  p_date_fin DATE
)
RETURNS TABLE(date_occurrence DATE) AS $$
DECLARE
  v_jour_numero INT;
  v_current_date DATE;
BEGIN
  -- Convertir le jour en numéro (1=Lundi, 7=Dimanche)
  v_jour_numero := CASE p_jour
    WHEN 'LUNDI' THEN 1
    WHEN 'MARDI' THEN 2
    WHEN 'MERCREDI' THEN 3
    WHEN 'JEUDI' THEN 4
    WHEN 'VENDREDI' THEN 5
    WHEN 'SAMEDI' THEN 6
    WHEN 'DIMANCHE' THEN 7
  END;
  
  -- Trouver le premier jour correspondant
  v_current_date := p_date_debut;
  WHILE EXTRACT(ISODOW FROM v_current_date) != v_jour_numero LOOP
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;
  
  -- Générer toutes les dates
  WHILE v_current_date <= p_date_fin LOOP
    date_occurrence := v_current_date;
    RETURN NEXT;
    v_current_date := v_current_date + INTERVAL '7 days';
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 10. Commentaires sur les colonnes pour documentation
COMMENT ON COLUMN "emplois_du_temps"."date_debut" IS 'Date de début de la période de validité de l''emploi du temps';
COMMENT ON COLUMN "emplois_du_temps"."date_fin" IS 'Date de fin de la période de validité de l''emploi du temps';
COMMENT ON COLUMN "emplois_du_temps"."type_activite" IS 'Type d''activité: COURS, TP, TD ou DEVOIR';
COMMENT ON COLUMN "emplois_du_temps"."est_recurrent" IS 'Indique si l''activité se répète chaque semaine (true) ou est ponctuelle (false)';
COMMENT ON COLUMN "emplois_du_temps"."date_specifique" IS 'Date spécifique pour les activités ponctuelles (devoirs)';
COMMENT ON COLUMN "emplois_du_temps"."groupe_recurrence" IS 'UUID pour regrouper les occurrences d''un même cours récurrent';

-- Migration terminée avec succès
