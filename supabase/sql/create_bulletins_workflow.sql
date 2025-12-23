-- Création du type ENUM pour le statut du visa
CREATE TYPE "StatutVisa" AS ENUM ('EN_ATTENTE', 'VISE');

-- Ajout de la colonne statut_visa à la table bulletins existante
ALTER TABLE "bulletins" ADD COLUMN IF NOT EXISTS "statut_visa" "StatutVisa" DEFAULT 'EN_ATTENTE';
ALTER TABLE "bulletins" ADD COLUMN IF NOT EXISTS "date_visa" TIMESTAMP(3);
ALTER TABLE "bulletins" ADD COLUMN IF NOT EXISTS "dep_id" UUID;


-- Création de la table bulletins_generes
CREATE TABLE "bulletins_generes" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "classeId" UUID NOT NULL,
  "semestre" TEXT NOT NULL,
  "departementId" UUID NOT NULL,
  "chefDepartementId" UUID NOT NULL,
  "dateGeneration" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "statut" "StatutVisa" NOT NULL DEFAULT 'EN_ATTENTE',
  "dateVisa" TIMESTAMP(3),
  "depId" UUID,
  "pdfPath" TEXT,
  "pdfPathVise" TEXT,
  "nombreEtudiants" INTEGER NOT NULL,
  "anneeAcademique" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "bulletins_generes_pkey" PRIMARY KEY ("id")
);

-- Ajout des contraintes de clés étrangères (Relations)
ALTER TABLE "bulletins_generes" ADD CONSTRAINT "bulletins_generes_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bulletins_generes" ADD CONSTRAINT "bulletins_generes_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "departements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bulletins_generes" ADD CONSTRAINT "bulletins_generes_chefDepartementId_fkey" FOREIGN KEY ("chefDepartementId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bulletins_generes" ADD CONSTRAINT "bulletins_generes_depId_fkey" FOREIGN KEY ("depId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Création d'un index pour accélérer les recherches par statut
CREATE INDEX "bulletins_generes_statut_idx" ON "bulletins_generes"("statut");
CREATE INDEX "bulletins_generes_departementId_idx" ON "bulletins_generes"("departementId");
