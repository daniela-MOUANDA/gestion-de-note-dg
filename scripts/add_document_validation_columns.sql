-- Migration SQL pour ajouter les colonnes de validation des documents
-- À exécuter sur la base de données Supabase dans l'éditeur SQL

-- 1. PHOTO D'IDENTITÉ
ALTER TABLE inscriptions
ADD COLUMN IF NOT EXISTS photo_identite_statut TEXT DEFAULT 'EN_ATTENTE',
ADD COLUMN IF NOT EXISTS photo_identite_commentaire TEXT,
ADD COLUMN IF NOT EXISTS photo_identite_date_validation TIMESTAMPTZ;

-- 2. ACTE DE NAISSANCE (Colonne existante: copie_acte_naissance)
ALTER TABLE inscriptions
ADD COLUMN IF NOT EXISTS copie_acte_naissance_statut TEXT DEFAULT 'EN_ATTENTE',
ADD COLUMN IF NOT EXISTS copie_acte_naissance_commentaire TEXT,
ADD COLUMN IF NOT EXISTS copie_acte_naissance_date_validation TIMESTAMPTZ;

-- 3. ATTESTATION/DIPLOME BAC (Colonne existante: copie_diplome)
ALTER TABLE inscriptions
ADD COLUMN IF NOT EXISTS copie_diplome_statut TEXT DEFAULT 'EN_ATTENTE',
ADD COLUMN IF NOT EXISTS copie_diplome_commentaire TEXT,
ADD COLUMN IF NOT EXISTS copie_diplome_date_validation TIMESTAMPTZ;

-- 4. RELEVÉ DE NOTES BAC (Colonne existante: copie_releve)
ALTER TABLE inscriptions
ADD COLUMN IF NOT EXISTS copie_releve_statut TEXT DEFAULT 'EN_ATTENTE',
ADD COLUMN IF NOT EXISTS copie_releve_commentaire TEXT,
ADD COLUMN IF NOT EXISTS copie_releve_date_validation TIMESTAMPTZ;

-- 5. PIÈCE D'IDENTITÉ (Colonne existante: piece_identite)
ALTER TABLE inscriptions
ADD COLUMN IF NOT EXISTS piece_identite_statut TEXT DEFAULT 'EN_ATTENTE',
ADD COLUMN IF NOT EXISTS piece_identite_commentaire TEXT,
ADD COLUMN IF NOT EXISTS piece_identite_date_validation TIMESTAMPTZ;

-- 6. QUITTANCE DE PAIEMENT (Colonne existante: quittance)
ALTER TABLE inscriptions
ADD COLUMN IF NOT EXISTS quittance_statut TEXT DEFAULT 'EN_ATTENTE',
ADD COLUMN IF NOT EXISTS quittance_commentaire TEXT,
ADD COLUMN IF NOT EXISTS quittance_date_validation TIMESTAMPTZ;

-- 7. AGENT VALIDEUR
ALTER TABLE inscriptions
ADD COLUMN IF NOT EXISTS agent_valideur_id UUID REFERENCES utilisateurs(id);

-- Créer l'index pour les performances
CREATE INDEX IF NOT EXISTS idx_inscriptions_documents_pending_v2
ON inscriptions (
  photo_identite_statut,
  copie_acte_naissance_statut,
  copie_diplome_statut,
  piece_identite_statut,
  quittance_statut
);
