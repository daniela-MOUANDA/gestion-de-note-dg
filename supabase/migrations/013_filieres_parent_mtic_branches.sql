-- Filières MTIC : TC + parcours MMI (sans ligne parente « MMI »)
-- parent_filiere_id peut servir à d'autres départements plus tard.

ALTER TABLE public.filieres
  ADD COLUMN IF NOT EXISTS parent_filiere_id UUID REFERENCES public.filieres(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_filieres_parent_filiere_id ON public.filieres(parent_filiere_id);

-- TC (Technico-commercial)
INSERT INTO public.filieres (code, nom, departement_id, parent_filiere_id)
SELECT 'TC',
       'Technico-commercial',
       d.id,
       NULL
FROM public.departements d
WHERE d.code = 'MTIC'
LIMIT 1
ON CONFLICT (code) DO UPDATE SET
  nom = EXCLUDED.nom,
  departement_id = EXCLUDED.departement_id,
  parent_filiere_id = EXCLUDED.parent_filiere_id;

-- Parcours MMI (filières réelles, sans parent)
INSERT INTO public.filieres (code, nom, departement_id, parent_filiere_id)
SELECT 'MMI-Web-Mastering',
       'MMI-Web Mastering',
       d.id,
       NULL
FROM public.departements d
WHERE d.code = 'MTIC'
LIMIT 1
ON CONFLICT (code) DO UPDATE SET
  nom = EXCLUDED.nom,
  departement_id = EXCLUDED.departement_id,
  parent_filiere_id = NULL;

INSERT INTO public.filieres (code, nom, departement_id, parent_filiere_id)
SELECT 'MMI-Ecommerce-Digital',
       'MMI-Ecommerce Digital',
       d.id,
       NULL
FROM public.departements d
WHERE d.code = 'MTIC'
LIMIT 1
ON CONFLICT (code) DO UPDATE SET
  nom = EXCLUDED.nom,
  departement_id = EXCLUDED.departement_id,
  parent_filiere_id = NULL;
