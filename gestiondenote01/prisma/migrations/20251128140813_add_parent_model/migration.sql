-- CreateEnum
CREATE TYPE "TypeParent" AS ENUM ('PERE', 'MERE', 'TUTEUR');

-- CreateTable
CREATE TABLE "parents" (
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

-- AddForeignKey
ALTER TABLE "parents" ADD CONSTRAINT "parents_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "etudiants"("id") ON DELETE CASCADE ON UPDATE CASCADE;


