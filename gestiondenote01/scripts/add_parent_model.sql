-- Script SQL pour ajouter le modèle Parent à la base de données
-- Exécutez ce script dans votre base de données PostgreSQL si la migration Prisma échoue

-- Créer l'enum TypeParent
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TypeParent') THEN
        CREATE TYPE "TypeParent" AS ENUM ('PERE', 'MERE', 'TUTEUR');
    END IF;
END $$;

-- Créer la table parents
CREATE TABLE IF NOT EXISTS "parents" (
    "id" TEXT NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "type" "TypeParent" NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "email" TEXT,
    "profession" TEXT,
    "adresse" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- Ajouter la clé étrangère
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'parents_etudiantId_fkey'
    ) THEN
        ALTER TABLE "parents" ADD CONSTRAINT "parents_etudiantId_fkey" 
        FOREIGN KEY ("etudiantId") REFERENCES "etudiants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Créer un index sur etudiantId pour améliorer les performances
CREATE INDEX IF NOT EXISTS "parents_etudiantId_idx" ON "parents"("etudiantId");


