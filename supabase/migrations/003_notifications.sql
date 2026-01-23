-- Création de la table notifications pour le système de notifications étudiant

-- Supprimer la table si elle existe déjà (pour réinitialisation)
DROP TABLE IF EXISTS notifications CASCADE;

-- Table des notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etudiant_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ACADEMIQUE', 'INSCRIPTION', 'SYSTEME', 'PERSONNEL')),
    titre TEXT NOT NULL,
    message TEXT NOT NULL,
    lien TEXT,
    lu BOOLEAN DEFAULT FALSE,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB,
    
    -- Contrainte de clé étrangère
    CONSTRAINT notifications_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES etudiants(id) ON DELETE CASCADE
);

-- Index pour optimiser les requêtes fréquentes
CREATE INDEX idx_notifications_etudiant_id ON notifications(etudiant_id);
CREATE INDEX idx_notifications_lu ON notifications(lu);
CREATE INDEX idx_notifications_date_creation ON notifications(date_creation DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Index composite pour les requêtes courantes
CREATE INDEX idx_notifications_etudiant_lu ON notifications(etudiant_id, lu);

COMMENT ON TABLE notifications IS 'Table des notifications pour les étudiants';
COMMENT ON COLUMN notifications.type IS 'Type de notification: ACADEMIQUE, INSCRIPTION, SYSTEME, PERSONNEL';
COMMENT ON COLUMN notifications.metadata IS 'Données JSON additionnelles (document_type, note_id, etc.)';
