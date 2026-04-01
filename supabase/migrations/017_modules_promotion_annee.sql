-- Modules rattachés à une promotion (= année académique : promotions.annee)
-- Permet d'avoir le même code/sémestre/filière sur des années différentes.

ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES public.promotions(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.modules.promotion_id IS 'Promotion (année académique) d''application du module ; promotions.annee affiche l''étiquette (ex. 2024-2025).';

CREATE INDEX IF NOT EXISTS idx_modules_promotion_id ON public.modules(promotion_id);

-- Ancienne unicité : (code, filiere_id, semestre) — à remplacer par une clé incluant l'année

ALTER TABLE public.modules DROP CONSTRAINT IF EXISTS modules_code_filiere_semestre_unique;

-- Rétro-remplissage : promotion EN COURS, sinon la plus récente par année
UPDATE public.modules m
SET promotion_id = p.id
FROM (
  SELECT id
  FROM public.promotions
  WHERE statut = 'EN_COURS'
  ORDER BY date_debut DESC NULLS LAST
  LIMIT 1
) p
WHERE m.promotion_id IS NULL;

UPDATE public.modules m
SET promotion_id = (
  SELECT id FROM public.promotions ORDER BY annee DESC LIMIT 1
)
WHERE m.promotion_id IS NULL;

ALTER TABLE public.modules
  ADD CONSTRAINT modules_code_filiere_semestre_promotion_unique
  UNIQUE (code, filiere_id, semestre, promotion_id);
