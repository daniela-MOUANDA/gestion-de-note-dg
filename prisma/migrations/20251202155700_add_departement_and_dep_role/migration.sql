-- AlterEnum
ALTER TYPE "RoleUtilisateur" ADD VALUE 'DEP';

-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "departementId" TEXT;

-- CreateTable
CREATE TABLE "departements" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departements_nom_key" ON "departements"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "departements_code_key" ON "departements"("code");

-- AddForeignKey
ALTER TABLE "utilisateurs" ADD CONSTRAINT "utilisateurs_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "departements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
