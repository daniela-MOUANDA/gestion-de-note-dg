-- MMI seul n'est pas une filière : seuls les parcours MMI-Web Mastering et MMI-Ecommerce Digital restent.
-- Suppression de la ligne code MMI ; renommage MMI-WM / MMI-ED vers des codes explicites (foreign keys inchangées : mêmes UUID).

ALTER TABLE public.filieres
  ALTER COLUMN code TYPE VARCHAR(64);

DO $$
DECLARE
  id_mmi uuid;
  id_wm uuid;
  id_ed uuid;
BEGIN
  SELECT id INTO id_mmi FROM public.filieres WHERE code = 'MMI' LIMIT 1;
  SELECT id INTO id_wm FROM public.filieres WHERE code = 'MMI-WM' LIMIT 1;
  SELECT id INTO id_ed FROM public.filieres WHERE code = 'MMI-ED' LIMIT 1;

  IF id_mmi IS NOT NULL THEN
    -- Réaffecter toute donnée encore liée au parent MMI (par défaut : Web Mastering si disponible)
    IF id_wm IS NULL AND id_ed IS NOT NULL THEN
      id_wm := id_ed;
    END IF;
    IF id_wm IS NOT NULL THEN
      UPDATE public.inscriptions SET filiere_id = id_wm WHERE filiere_id = id_mmi;
      UPDATE public.classes SET filiere_id = id_wm WHERE filiere_id = id_mmi;
      UPDATE public.modules SET filiere_id = id_wm WHERE filiere_id = id_mmi;
      UPDATE public.abandons SET filiere_id = id_wm WHERE filiere_id = id_mmi;
      UPDATE public.proces_verbaux SET filiere_id = id_wm WHERE filiere_id = id_mmi;
    END IF;
    UPDATE public.filieres SET parent_filiere_id = NULL WHERE parent_filiere_id = id_mmi;
    DELETE FROM public.filieres WHERE id = id_mmi;
  END IF;

  IF id_wm IS NOT NULL THEN
    UPDATE public.filieres
    SET code = 'MMI-Web-Mastering',
        nom = 'MMI-Web Mastering',
        parent_filiere_id = NULL,
        type_filiere = 'parcours'
    WHERE id = id_wm;
  END IF;

  IF id_ed IS NOT NULL THEN
    UPDATE public.filieres
    SET code = 'MMI-Ecommerce-Digital',
        nom = 'MMI-Ecommerce Digital',
        parent_filiere_id = NULL,
        type_filiere = 'parcours'
    WHERE id = id_ed;
  END IF;
END $$;

COMMENT ON TABLE public.filieres IS 'Les parcours MMI sont MMI-Web-Mastering et MMI-Ecommerce-Digital (plus de ligne parente MMI).';
