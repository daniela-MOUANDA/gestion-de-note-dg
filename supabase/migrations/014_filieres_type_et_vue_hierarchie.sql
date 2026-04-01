-- Présentation métier : type_filiere (parcours / groupe / sous_parcours selon parent_filiere_id)
-- + vue de lecture avec libellé hiérarchique pour le Table Editor / requêtes.

ALTER TABLE public.filieres
  ADD COLUMN IF NOT EXISTS type_filiere VARCHAR(20) DEFAULT 'parcours';

UPDATE public.filieres SET type_filiere = 'parcours' WHERE type_filiere IS NULL;

ALTER TABLE public.filieres
  ALTER COLUMN type_filiere SET DEFAULT 'parcours';

ALTER TABLE public.filieres
  ALTER COLUMN type_filiere SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'filieres_type_filiere_check'
  ) THEN
    ALTER TABLE public.filieres
      ADD CONSTRAINT filieres_type_filiere_check
      CHECK (type_filiere IN ('parcours', 'groupe', 'sous_parcours'));
  END IF;
END $$;

COMMENT ON COLUMN public.filieres.type_filiere IS
'parcours: filière inscriptible seule ; groupe: regroupement sans choix final (ex. MMI, choisir un sous-parcours) ; sous_parcours: parcours sous une filière parente (inscriptible).';

-- Hiérarchie : enfants d'une filière parente ; anciens codes MMI-WM/MMI-ED ; parent MMI (supprimé par migration 015)
UPDATE public.filieres SET type_filiere = 'sous_parcours' WHERE parent_filiere_id IS NOT NULL;
UPDATE public.filieres SET type_filiere = 'sous_parcours' WHERE code IN ('MMI-WM', 'MMI-ED');
UPDATE public.filieres SET type_filiere = 'groupe' WHERE code = 'MMI';

CREATE OR REPLACE VIEW public.v_filieres_hierarchie AS
SELECT
  f.id,
  f.code,
  f.nom,
  f.departement_id,
  f.parent_filiere_id,
  f.type_filiere,
  p.code AS parent_code,
  p.nom AS parent_nom,
  d.code AS departement_code,
  d.nom AS departement_nom,
  CASE
    WHEN f.parent_filiere_id IS NULL THEN f.code || ' — ' || f.nom
    ELSE COALESCE(p.code || ' › ', '') || f.nom
  END AS libelle_hierarchique
FROM public.filieres f
LEFT JOIN public.filieres p ON p.id = f.parent_filiere_id
LEFT JOIN public.departements d ON d.id = f.departement_id;

COMMENT ON VIEW public.v_filieres_hierarchie IS
'Consultation : libellé hiérarchique si parent_filiere_id (type_filiere = groupe : pas d''inscription directe).';

GRANT SELECT ON public.v_filieres_hierarchie TO anon;
GRANT SELECT ON public.v_filieres_hierarchie TO authenticated;
GRANT SELECT ON public.v_filieres_hierarchie TO service_role;
