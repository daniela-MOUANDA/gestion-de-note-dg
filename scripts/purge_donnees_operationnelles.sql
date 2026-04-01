-- =============================================================================
-- Purge des données « métier » / importées — conservation du référentiel
-- =============================================================================
-- CONSERVE : roles, departements, formations, filieres, niveaux, promotions (optionnel, voir ci‑dessous)
--
-- En pratique on vide aussi promotions (années, affectations) pour repartir sans inscriptions.
-- Si tu préfères garder les lignes promotions existantes, commente 'promotions' dans la liste
-- tables_to_truncate plus bas, puis adapte (sinon inscriptions orphelines FK).
--
-- CONSERVE : utilisateurs SAUF ceux avec rôle ETUDIANT ou ENSEIGNANT (comptes de connexion liés aux données vidées).
--
-- À exécuter dans Supabase SQL Editor (postgres / bypass RLS) ou psql.
-- Sauvegarde recommandée avant exécution.
-- =============================================================================

BEGIN;

DO $$
DECLARE
  tbls text[] := ARRAY[
    'actions_audit',
    'messages',
    'notes',
    'parametres_notation',
    'emplois_du_temps',
    'affectations_module_enseignant',
    'modules',
    'statut_notes_classes',
    'notifications',
    'candidats_admis',
    'proces_verbaux',
    'abandons',
    'diplomes',
    'bulletins',
    'attestations',
    'parents',
    'inscriptions',
    'etudiants',
    'classes',
    'enseignants',
    'promotions'
  ];
  sql text;
BEGIN
  SELECT 'TRUNCATE TABLE '
    || string_agg(format('public.%I', sub.table_name), ', ' ORDER BY sub.ord)
    || ' RESTART IDENTITY CASCADE'
  INTO sql
  FROM (
    SELECT t.table_name,
           array_position(tbls, t.table_name)::int AS ord
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_name = ANY (tbls)
  ) sub;

  IF sql IS NULL OR sql = 'TRUNCATE TABLE  RESTART IDENTITY CASCADE' THEN
    RAISE EXCEPTION 'Aucune table à tronquer trouvée (schéma incomplet ?)';
  END IF;

  RAISE NOTICE 'Exécution : %', sql;
  EXECUTE sql;
END $$;

-- Comptes liés aux étudiants / enseignants (les fiches enseignants et étudiants sont déjà tronquées)
DELETE FROM public.utilisateurs u
USING public.roles r
WHERE u.role_id = r.id
  AND r.code IN ('ETUDIANT', 'ENSEIGNANT');

COMMIT;

-- --- Vérifications rapides ---
-- SELECT COUNT(*) AS roles FROM public.roles;
-- SELECT COUNT(*) AS filieres FROM public.filieres;
-- SELECT COUNT(*) AS etudiants FROM public.etudiants;
-- SELECT COUNT(*) AS classes FROM public.classes;
-- SELECT COUNT(*) AS modules FROM public.modules;
-- SELECT COUNT(*) AS enseignants FROM public.enseignants;
-- SELECT COUNT(*) AS utilisateurs_staff FROM public.utilisateurs u
--   JOIN public.roles r ON r.id = u.role_id
--   WHERE r.code NOT IN ('ETUDIANT', 'ENSEIGNANT');
