-- Script SQL pour ajouter les champs manquants à la table utilisateurs
-- Exécutez ce script dans votre base de données PostgreSQL si la migration Prisma échoue

-- Ajouter le champ photo si il n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'utilisateurs' AND column_name = 'photo'
    ) THEN
        ALTER TABLE utilisateurs ADD COLUMN photo VARCHAR(255);
    END IF;
END $$;

-- Ajouter le champ telephone si il n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'utilisateurs' AND column_name = 'telephone'
    ) THEN
        ALTER TABLE utilisateurs ADD COLUMN telephone VARCHAR(50);
    END IF;
END $$;

-- Ajouter le champ adresse si il n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'utilisateurs' AND column_name = 'adresse'
    ) THEN
        ALTER TABLE utilisateurs ADD COLUMN adresse VARCHAR(255);
    END IF;
END $$;

