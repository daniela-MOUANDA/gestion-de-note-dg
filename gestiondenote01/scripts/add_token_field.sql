-- Script SQL pour ajouter le champ token à la table utilisateurs
-- Exécutez ce script dans votre base de données PostgreSQL si la migration Prisma échoue

-- Ajouter le champ token si il n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'utilisateurs' AND column_name = 'token'
    ) THEN
        ALTER TABLE utilisateurs ADD COLUMN token TEXT;
    END IF;
END $$;


