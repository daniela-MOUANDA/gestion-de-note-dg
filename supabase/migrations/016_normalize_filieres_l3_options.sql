-- Normalisation filières/options L3
-- Objectif: garder les filières "tronc commun" (L1/L2) et créer/rattacher les options L3.
-- Cette migration est idempotente (ré-exécutable sans casser).

ALTER TABLE public.filieres
  ADD COLUMN IF NOT EXISTS parent_filiere_id UUID REFERENCES public.filieres(id) ON DELETE SET NULL;

ALTER TABLE public.filieres
  ADD COLUMN IF NOT EXISTS type_filiere VARCHAR(20) DEFAULT 'parcours';

-- 1) S'assurer que les filières parentes existent
INSERT INTO public.filieres (code, nom, departement_id, parent_filiere_id, type_filiere)
SELECT 'MMI', 'Métiers du Multimédia et de l''Internet', d.id, NULL, 'parcours'
FROM public.departements d
WHERE d.code = 'MTIC'
ON CONFLICT (code) DO UPDATE SET
  nom = EXCLUDED.nom,
  departement_id = EXCLUDED.departement_id,
  parent_filiere_id = NULL;

INSERT INTO public.filieres (code, nom, departement_id, parent_filiere_id, type_filiere)
SELECT 'MTIC', 'Management des Techniques de l''Information et de la Communication', d.id, NULL, 'parcours'
FROM public.departements d
WHERE d.code = 'MTIC'
ON CONFLICT (code) DO UPDATE SET
  nom = EXCLUDED.nom,
  departement_id = EXCLUDED.departement_id,
  parent_filiere_id = NULL;

INSERT INTO public.filieres (code, nom, departement_id, parent_filiere_id, type_filiere)
SELECT 'GI', 'Génie Informatique', d.id, NULL, 'parcours'
FROM public.departements d
WHERE d.code = 'RSN'
ON CONFLICT (code) DO UPDATE SET
  nom = EXCLUDED.nom,
  departement_id = EXCLUDED.departement_id,
  parent_filiere_id = NULL;

INSERT INTO public.filieres (code, nom, departement_id, parent_filiere_id, type_filiere)
SELECT 'RT', 'Réseaux et Télécom', d.id, NULL, 'parcours'
FROM public.departements d
WHERE d.code = 'RSN'
ON CONFLICT (code) DO UPDATE SET
  nom = EXCLUDED.nom,
  departement_id = EXCLUDED.departement_id,
  parent_filiere_id = NULL;

INSERT INTO public.filieres (code, nom, departement_id, parent_filiere_id, type_filiere)
SELECT 'TC', 'Technico-commercial', d.id, NULL, 'parcours'
FROM public.departements d
WHERE d.code = 'MTIC'
ON CONFLICT (code) DO UPDATE SET
  nom = EXCLUDED.nom,
  departement_id = EXCLUDED.departement_id,
  parent_filiere_id = NULL;

-- 2) Harmoniser l'ancienne option MMI-ED -> MMI-CD (Communication Digitale)
DO $$
DECLARE
  id_mmi_cd UUID;
BEGIN
  SELECT id INTO id_mmi_cd FROM public.filieres WHERE code = 'MMI-CD' LIMIT 1;
  IF id_mmi_cd IS NULL AND EXISTS (SELECT 1 FROM public.filieres WHERE code = 'MMI-ED') THEN
    UPDATE public.filieres
    SET code = 'MMI-CD',
        nom = 'MMI option Communication Digitale'
    WHERE code = 'MMI-ED';
  END IF;
END $$;

-- 3) Créer / rattacher les options L3
-- MMI: Web Mastering, Communication Digitale
INSERT INTO public.filieres (code, nom, departement_id, parent_filiere_id, type_filiere)
SELECT 'MMI-WM', 'MMI option Web Mastering', p.departement_id, p.id, 'sous_parcours'
FROM public.filieres p
WHERE p.code = 'MMI'
ON CONFLICT (code) DO UPDATE SET
  nom = EXCLUDED.nom,
  departement_id = EXCLUDED.departement_id,
  parent_filiere_id = EXCLUDED.parent_filiere_id,
  type_filiere = 'sous_parcours';

INSERT INTO public.filieres (code, nom, departement_id, parent_filiere_id, type_filiere)
SELECT 'MMI-CD', 'MMI option Communication Digitale', p.departement_id, p.id, 'sous_parcours'
FROM public.filieres p
WHERE p.code = 'MMI'
ON CONFLICT (code) DO UPDATE SET
  nom = EXCLUDED.nom,
  departement_id = EXCLUDED.departement_id,
  parent_filiere_id = EXCLUDED.parent_filiere_id,
  type_filiere = 'sous_parcours';

-- MTIC: E-Marketing Communication Digitale, Technico-commercial (option)
INSERT INTO public.filieres (code, nom, departement_id, parent_filiere_id, type_filiere)
SELECT 'MTIC-EMCD', 'MTIC option E-Marketing Communication Digitale', p.departement_id, p.id, 'sous_parcours'
FROM public.filieres p
WHERE p.code = 'MTIC'
ON CONFLICT (code) DO UPDATE SET
  nom = EXCLUDED.nom,
  departement_id = EXCLUDED.departement_id,
  parent_filiere_id = EXCLUDED.parent_filiere_id,
  type_filiere = 'sous_parcours';

INSERT INTO public.filieres (code, nom, departement_id, parent_filiere_id, type_filiere)
SELECT 'MTIC-TC', 'MTIC option Technico-commercial', p.departement_id, p.id, 'sous_parcours'
FROM public.filieres p
WHERE p.code = 'MTIC'
ON CONFLICT (code) DO UPDATE SET
  nom = EXCLUDED.nom,
  departement_id = EXCLUDED.departement_id,
  parent_filiere_id = EXCLUDED.parent_filiere_id,
  type_filiere = 'sous_parcours';

-- GI: DAR, ASDB
INSERT INTO public.filieres (code, nom, departement_id, parent_filiere_id, type_filiere)
SELECT 'GI-DAR', 'GI option DAR (Développement d''Applications Réparties)', p.departement_id, p.id, 'sous_parcours'
FROM public.filieres p
WHERE p.code = 'GI'
ON CONFLICT (code) DO UPDATE SET
  nom = EXCLUDED.nom,
  departement_id = EXCLUDED.departement_id,
  parent_filiere_id = EXCLUDED.parent_filiere_id,
  type_filiere = 'sous_parcours';

INSERT INTO public.filieres (code, nom, departement_id, parent_filiere_id, type_filiere)
SELECT 'GI-ASDB', 'GI option ASDB (Administration Sécurisée des Bases de Données)', p.departement_id, p.id, 'sous_parcours'
FROM public.filieres p
WHERE p.code = 'GI'
ON CONFLICT (code) DO UPDATE SET
  nom = EXCLUDED.nom,
  departement_id = EXCLUDED.departement_id,
  parent_filiere_id = EXCLUDED.parent_filiere_id,
  type_filiere = 'sous_parcours';

-- RT: RT, AZUR
INSERT INTO public.filieres (code, nom, departement_id, parent_filiere_id, type_filiere)
SELECT 'RT-RT', 'RT option Réseaux & Télécom', p.departement_id, p.id, 'sous_parcours'
FROM public.filieres p
WHERE p.code = 'RT'
ON CONFLICT (code) DO UPDATE SET
  nom = EXCLUDED.nom,
  departement_id = EXCLUDED.departement_id,
  parent_filiere_id = EXCLUDED.parent_filiere_id,
  type_filiere = 'sous_parcours';

INSERT INTO public.filieres (code, nom, departement_id, parent_filiere_id, type_filiere)
SELECT 'RT-AZUR', 'RT option AZUR', p.departement_id, p.id, 'sous_parcours'
FROM public.filieres p
WHERE p.code = 'RT'
ON CONFLICT (code) DO UPDATE SET
  nom = EXCLUDED.nom,
  departement_id = EXCLUDED.departement_id,
  parent_filiere_id = EXCLUDED.parent_filiere_id,
  type_filiere = 'sous_parcours';

-- 4) Reclasser les parents en "parcours" et les options en "sous_parcours"
UPDATE public.filieres
SET type_filiere = 'parcours'
WHERE code IN ('MMI', 'MTIC', 'GI', 'RT', 'TC');

UPDATE public.filieres
SET type_filiere = 'sous_parcours'
WHERE code IN ('MMI-WM', 'MMI-CD', 'MTIC-EMCD', 'MTIC-TC', 'GI-DAR', 'GI-ASDB', 'RT-RT', 'RT-AZUR');

