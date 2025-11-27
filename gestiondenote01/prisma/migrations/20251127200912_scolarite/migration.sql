-- CreateEnum
CREATE TYPE "RoleUtilisateur" AS ENUM ('AGENT_SCOLARITE', 'SP_SCOLARITE', 'CHEF_SERVICE_SCOLARITE', 'CHEF_DEPARTEMENT', 'ETUDIANT', 'ENSEIGNANT', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatutPromotion" AS ENUM ('EN_COURS', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "TypeInscription" AS ENUM ('INSCRIPTION', 'REINSCRIPTION');

-- CreateEnum
CREATE TYPE "StatutInscription" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'REJETEE', 'INSCRIT');

-- CreateEnum
CREATE TYPE "Semestre" AS ENUM ('S1', 'S2');

-- CreateEnum
CREATE TYPE "StatutRecuperation" AS ENUM ('NON_RECUPERE', 'RECUPERE');

-- CreateEnum
CREATE TYPE "TypeDiplome" AS ENUM ('DTS', 'LICENCE');

-- CreateEnum
CREATE TYPE "TypeProcesVerbal" AS ENUM ('AVANT_RATTRAPAGES', 'APRES_RATTRAPAGES', 'ANNUEL');

-- CreateEnum
CREATE TYPE "PeriodePV" AS ENUM ('S1', 'S2', 'ANNUEL');

-- CreateEnum
CREATE TYPE "StatutPV" AS ENUM ('NOUVEAU', 'VU', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "TypeDestinataire" AS ENUM ('INDIVIDUEL', 'CLASSE', 'COLLECTIF');

-- CreateEnum
CREATE TYPE "TypeAction" AS ENUM ('CONNEXION', 'DECONNEXION', 'INSCRIPTION', 'ATTESTATION', 'BULLETIN', 'DIPLOME', 'MESSAGE', 'PV', 'ARCHIVAGE', 'ERROR');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "RoleUtilisateur" NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "derniereConnexion" TIMESTAMP(3),

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "annee" TEXT NOT NULL,
    "statut" "StatutPromotion" NOT NULL DEFAULT 'EN_COURS',
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "formations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filieres" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "filieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "niveaux" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordinal" TEXT NOT NULL,

    CONSTRAINT "niveaux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "filiereId" TEXT NOT NULL,
    "niveauId" TEXT NOT NULL,
    "effectif" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etudiants" (
    "id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3),
    "lieuNaissance" TEXT,
    "nationalite" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "photo" TEXT,

    CONSTRAINT "etudiants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscriptions" (
    "id" TEXT NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "formationId" TEXT NOT NULL,
    "filiereId" TEXT NOT NULL,
    "niveauId" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "typeInscription" "TypeInscription" NOT NULL,
    "statut" "StatutInscription" NOT NULL DEFAULT 'EN_ATTENTE',
    "dateInscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateValidation" TIMESTAMP(3),
    "agentValideurId" TEXT,
    "copieReleve" TEXT,
    "copieDiplome" TEXT,
    "copieActeNaissance" TEXT,
    "photoIdentite" TEXT,
    "quittance" TEXT,

    CONSTRAINT "inscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attestations" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "dateGeneration" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anneeAcademique" TEXT NOT NULL,
    "lieu" TEXT NOT NULL DEFAULT 'Libreville',
    "archivee" BOOLEAN NOT NULL DEFAULT false,
    "dateArchivage" TIMESTAMP(3),

    CONSTRAINT "attestations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulletins" (
    "id" TEXT NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "semestre" "Semestre" NOT NULL,
    "anneeAcademique" TEXT NOT NULL,
    "statut" "StatutRecuperation" NOT NULL DEFAULT 'NON_RECUPERE',
    "dateRecuperation" TIMESTAMP(3),
    "agentRecuperation" TEXT,

    CONSTRAINT "bulletins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diplomes" (
    "id" TEXT NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "typeDiplome" "TypeDiplome" NOT NULL,
    "anneeAcademique" TEXT NOT NULL,
    "statut" "StatutRecuperation" NOT NULL DEFAULT 'NON_RECUPERE',
    "dateRecuperation" TIMESTAMP(3),
    "agentRecuperation" TEXT,

    CONSTRAINT "diplomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proces_verbaux" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "filiereId" TEXT NOT NULL,
    "niveauId" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "typePV" "TypeProcesVerbal" NOT NULL,
    "periode" "PeriodePV" NOT NULL,
    "anneeAcademique" TEXT NOT NULL,
    "statut" "StatutPV" NOT NULL DEFAULT 'NOUVEAU',
    "dateReception" TIMESTAMP(3),
    "dateArchivage" TIMESTAMP(3),
    "fichierPV" TEXT,

    CONSTRAINT "proces_verbaux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abandons" (
    "id" TEXT NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "niveauId" TEXT NOT NULL,
    "filiereId" TEXT NOT NULL,
    "dateAbandon" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raison" TEXT,

    CONSTRAINT "abandons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "expediteurId" TEXT NOT NULL,
    "destinataireId" TEXT,
    "classeId" TEXT,
    "typeDestinataire" "TypeDestinataire" NOT NULL,
    "sujet" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "dateEnvoi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actions_audit" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "typeAction" "TypeAction" NOT NULL,
    "dateAction" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "actions_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidats_admis" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "filiere" TEXT NOT NULL,
    "anneeAcademique" TEXT NOT NULL,
    "dateImport" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importePar" TEXT,
    "inscrit" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "candidats_admis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_username_key" ON "utilisateurs"("username");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_annee_key" ON "promotions"("annee");

-- CreateIndex
CREATE UNIQUE INDEX "formations_code_key" ON "formations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "filieres_code_key" ON "filieres"("code");

-- CreateIndex
CREATE UNIQUE INDEX "niveaux_code_key" ON "niveaux"("code");

-- CreateIndex
CREATE UNIQUE INDEX "classes_code_filiereId_niveauId_key" ON "classes"("code", "filiereId", "niveauId");

-- CreateIndex
CREATE UNIQUE INDEX "etudiants_matricule_key" ON "etudiants"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "etudiants_email_key" ON "etudiants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "attestations_numero_key" ON "attestations"("numero");

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "niveaux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "etudiants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "formations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "niveaux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "etudiants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulletins" ADD CONSTRAINT "bulletins_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "etudiants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulletins" ADD CONSTRAINT "bulletins_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulletins" ADD CONSTRAINT "bulletins_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diplomes" ADD CONSTRAINT "diplomes_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "etudiants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diplomes" ADD CONSTRAINT "diplomes_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diplomes" ADD CONSTRAINT "diplomes_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proces_verbaux" ADD CONSTRAINT "proces_verbaux_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proces_verbaux" ADD CONSTRAINT "proces_verbaux_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proces_verbaux" ADD CONSTRAINT "proces_verbaux_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "niveaux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proces_verbaux" ADD CONSTRAINT "proces_verbaux_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abandons" ADD CONSTRAINT "abandons_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "etudiants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abandons" ADD CONSTRAINT "abandons_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abandons" ADD CONSTRAINT "abandons_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "niveaux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abandons" ADD CONSTRAINT "abandons_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_expediteurId_fkey" FOREIGN KEY ("expediteurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_destinataireId_fkey" FOREIGN KEY ("destinataireId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions_audit" ADD CONSTRAINT "actions_audit_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
