-- Migration pour ajouter les champs nécessaires pour la gestion des bulletins

-- 1. Ajouter le champ nombre_modules à la table classes
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS nombre_modules INTEGER DEFAULT 0;

-- 2. Ajouter le champ statut_visa à la table bulletins
-- Les valeurs possibles seront: 'EN_ATTENTE', 'VALIDE', 'REJETE'
ALTER TABLE bulletins
ADD COLUMN IF NOT EXISTS statut_visa VARCHAR(20) DEFAULT 'EN_ATTENTE';

-- 3. Ajouter le champ date_generation pour savoir quand le bulletin a été généré
ALTER TABLE bulletins
ADD COLUMN IF NOT EXISTS date_generation TIMESTAMP WITH TIME ZONE;

-- 4. Ajouter le champ genere_par pour savoir qui a généré le bulletin
ALTER TABLE bulletins
ADD COLUMN IF NOT EXISTS genere_par UUID REFERENCES utilisateurs(id);

-- 5. Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_bulletins_statut_visa ON bulletins(statut_visa);
CREATE INDEX IF NOT EXISTS idx_bulletins_date_generation ON bulletins(date_generation);

