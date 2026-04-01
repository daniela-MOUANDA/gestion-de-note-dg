-- Purge complète des étudiants + données liées (schéma type gestion-de-note-dg / Supabase).
-- À exécuter dans l'éditeur SQL Supabase (rôle service_role / postgres) ou psql.
-- Sauvegarde recommandée avant exécution.

BEGIN;

-- 1) Toutes les lignes liées avec ON DELETE CASCADE depuis etudiants sont supprimées automatiquement :
--    inscriptions, parents, notes, notifications, attestations, bulletins, diplomes, abandons, etc.
DELETE FROM public.etudiants;

-- 2) Comptes de connexion « étudiant » (pas de clé étrangère vers etudiants)
DELETE FROM public.utilisateurs u
USING public.roles r
WHERE u.role_id = r.id
  AND r.code = 'ETUDIANT';

-- 3) Effectifs des classes (plus d'inscriptions)
UPDATE public.classes SET effectif = 0;

-- 4) Suivi des notes par classe (les notes ont été supprimées en cascade ; on vide les agrégats si la table existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'statut_notes_classes'
  ) THEN
    DELETE FROM public.statut_notes_classes;
  END IF;
END $$;

COMMIT;

-- --- Vérifications ---
-- SELECT COUNT(*) AS nb_etudiants FROM public.etudiants;
-- SELECT COUNT(*) AS nb_inscriptions FROM public.inscriptions;
-- SELECT COUNT(*) AS nb_notes FROM public.notes;
-- SELECT COUNT(*) AS nb_comptes_etudiant
-- FROM public.utilisateurs u
-- JOIN public.roles r ON r.id = u.role_id
-- WHERE r.code = 'ETUDIANT';
