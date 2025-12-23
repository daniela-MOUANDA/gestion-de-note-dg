-- Force schema cache reload
-- Cette commande demande à PostgREST de recharger sa configuration et son cache de schéma.
NOTIFY pgrst, 'reload config';

-- Vérification de sécurité pour s'assurer que les colonnes existent bien
DO $$ 
BEGIN 
    -- Vérification date_visa
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bulletins' AND column_name='date_visa') THEN
        ALTER TABLE "bulletins" ADD COLUMN "date_visa" TIMESTAMP(3);
    END IF;

    -- Vérification statut_visa
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bulletins' AND column_name='statut_visa') THEN
       -- Assurez-vous que le type ENUM existe
       IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StatutVisa') THEN
           CREATE TYPE "StatutVisa" AS ENUM ('EN_ATTENTE', 'VISE');
       END IF;
       ALTER TABLE "bulletins" ADD COLUMN "statut_visa" "StatutVisa" DEFAULT 'EN_ATTENTE';
    END IF;
    
    -- Vérification dep_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bulletins' AND column_name='dep_id') THEN
        ALTER TABLE "bulletins" ADD COLUMN "dep_id" UUID;
    END IF;
END $$;
