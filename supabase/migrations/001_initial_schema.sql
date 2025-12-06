-- ============================================
-- MIGRATION INITIALE - SCHÉMA SUPABASE
-- ============================================
-- Ce script crée toutes les tables nécessaires pour l'application
-- de gestion de notes dans Supabase

-- Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TYPES ENUM
-- ============================================

CREATE TYPE statut_promotion AS ENUM ('EN_COURS', 'ARCHIVE');
CREATE TYPE type_inscription AS ENUM ('INSCRIPTION', 'REINSCRIPTION');
CREATE TYPE statut_inscription AS ENUM ('EN_ATTENTE', 'VALIDEE', 'REJETEE', 'INSCRIT');
CREATE TYPE type_parent AS ENUM ('PERE', 'MERE', 'TUTEUR');
CREATE TYPE semestre AS ENUM ('S1', 'S2');
CREATE TYPE statut_recuperation AS ENUM ('NON_RECUPERE', 'RECUPERE');
CREATE TYPE type_diplome AS ENUM ('DTS', 'LICENCE');
CREATE TYPE type_proces_verbal AS ENUM ('AVANT_RATTRAPAGES', 'APRES_RATTRAPAGES', 'ANNUEL');
CREATE TYPE periode_pv AS ENUM ('S1', 'S2', 'ANNUEL');
CREATE TYPE statut_pv AS ENUM ('NOUVEAU', 'VU', 'ARCHIVE');
CREATE TYPE type_destinataire AS ENUM ('INDIVIDUEL', 'CLASSE', 'COLLECTIF');
CREATE TYPE type_action AS ENUM ('CONNEXION', 'DECONNEXION', 'INSCRIPTION', 'ATTESTATION', 'BULLETIN', 'DIPLOME', 'MESSAGE', 'PV', 'ARCHIVAGE', 'ERROR');
CREATE TYPE type_note AS ENUM ('CONTINU', 'EXAMEN', 'RATTRAPAGE', 'ORAL', 'PRATIQUE');

-- ============================================
-- TABLES UTILISATEURS ET AUTHENTIFICATION
-- ============================================

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  nom VARCHAR(100) NOT NULL,
  description TEXT,
  route_dashboard VARCHAR(100),
  actif BOOLEAN DEFAULT true,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE departements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(100) UNIQUE NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  actif BOOLEAN DEFAULT true,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE utilisateurs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  token TEXT,
  photo TEXT,
  telephone VARCHAR(20),
  adresse TEXT,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  actif BOOLEAN DEFAULT true,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  derniere_connexion TIMESTAMP WITH TIME ZONE,
  departement_id UUID REFERENCES departements(id) ON DELETE SET NULL
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX idx_utilisateurs_username ON utilisateurs(username);
CREATE INDEX idx_utilisateurs_role_id ON utilisateurs(role_id);

-- ============================================
-- TABLES ACADÉMIQUES
-- ============================================

CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  annee VARCHAR(20) UNIQUE NOT NULL,
  statut statut_promotion DEFAULT 'EN_COURS',
  date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
  date_fin TIMESTAMP WITH TIME ZONE
);

CREATE TABLE formations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,
  nom VARCHAR(100) NOT NULL
);

CREATE TABLE filieres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,
  nom VARCHAR(100) NOT NULL,
  departement_id UUID REFERENCES departements(id) ON DELETE SET NULL
);

CREATE TABLE niveaux (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) UNIQUE NOT NULL,
  nom VARCHAR(50) NOT NULL,
  ordinal VARCHAR(10) NOT NULL
);

CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  filiere_id UUID NOT NULL REFERENCES filieres(id) ON DELETE CASCADE,
  niveau_id UUID NOT NULL REFERENCES niveaux(id) ON DELETE CASCADE,
  effectif INTEGER DEFAULT 0,
  UNIQUE(code, filiere_id, niveau_id)
);

CREATE INDEX idx_classes_filiere ON classes(filiere_id);
CREATE INDEX idx_classes_niveau ON classes(niveau_id);

-- ============================================
-- TABLES ÉTUDIANTS ET INSCRIPTIONS
-- ============================================

CREATE TABLE etudiants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matricule VARCHAR(50) UNIQUE NOT NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  date_naissance DATE,
  lieu_naissance VARCHAR(100),
  nationalite VARCHAR(50),
  email VARCHAR(255) UNIQUE,
  telephone VARCHAR(20),
  adresse TEXT,
  photo TEXT
);

CREATE INDEX idx_etudiants_matricule ON etudiants(matricule);
CREATE INDEX idx_etudiants_email ON etudiants(email);

CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  etudiant_id UUID NOT NULL REFERENCES etudiants(id) ON DELETE CASCADE,
  type type_parent NOT NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  telephone VARCHAR(20),
  email VARCHAR(255),
  profession VARCHAR(100),
  adresse TEXT,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_parents_etudiant ON parents(etudiant_id);

CREATE TABLE inscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  etudiant_id UUID NOT NULL REFERENCES etudiants(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  filiere_id UUID NOT NULL REFERENCES filieres(id) ON DELETE CASCADE,
  niveau_id UUID NOT NULL REFERENCES niveaux(id) ON DELETE CASCADE,
  classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  type_inscription type_inscription NOT NULL,
  statut statut_inscription DEFAULT 'EN_ATTENTE',
  date_inscription TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_validation TIMESTAMP WITH TIME ZONE,
  agent_valideur_id UUID,
  copie_releve TEXT,
  copie_diplome TEXT,
  copie_acte_naissance TEXT,
  photo_identite TEXT,
  quittance TEXT,
  piece_identite TEXT
);

CREATE INDEX idx_inscriptions_etudiant ON inscriptions(etudiant_id);
CREATE INDEX idx_inscriptions_promotion ON inscriptions(promotion_id);
CREATE INDEX idx_inscriptions_classe ON inscriptions(classe_id);
CREATE INDEX idx_inscriptions_statut ON inscriptions(statut);

-- ============================================
-- TABLES ATTESTATIONS
-- ============================================

CREATE TABLE attestations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero VARCHAR(100) UNIQUE NOT NULL,
  etudiant_id UUID NOT NULL REFERENCES etudiants(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  date_generation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  annee_academique VARCHAR(20) NOT NULL,
  lieu VARCHAR(100) DEFAULT 'Libreville',
  archivee BOOLEAN DEFAULT false,
  date_archivage TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_attestations_etudiant ON attestations(etudiant_id);
CREATE INDEX idx_attestations_promotion ON attestations(promotion_id);

-- ============================================
-- TABLES BULLETINS ET DIPLÔMES
-- ============================================

CREATE TABLE bulletins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  etudiant_id UUID NOT NULL REFERENCES etudiants(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  semestre semestre NOT NULL,
  annee_academique VARCHAR(20) NOT NULL,
  statut statut_recuperation DEFAULT 'NON_RECUPERE',
  date_recuperation TIMESTAMP WITH TIME ZONE,
  agent_recuperation UUID
);

CREATE INDEX idx_bulletins_etudiant ON bulletins(etudiant_id);
CREATE INDEX idx_bulletins_classe ON bulletins(classe_id);

CREATE TABLE diplomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  etudiant_id UUID NOT NULL REFERENCES etudiants(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  type_diplome type_diplome NOT NULL,
  annee_academique VARCHAR(20) NOT NULL,
  statut statut_recuperation DEFAULT 'NON_RECUPERE',
  date_recuperation TIMESTAMP WITH TIME ZONE,
  agent_recuperation UUID
);

CREATE INDEX idx_diplomes_etudiant ON diplomes(etudiant_id);
CREATE INDEX idx_diplomes_classe ON diplomes(classe_id);

-- ============================================
-- TABLES PROCÈS-VERBAUX
-- ============================================

CREATE TABLE proces_verbaux (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  filiere_id UUID NOT NULL REFERENCES filieres(id) ON DELETE CASCADE,
  niveau_id UUID NOT NULL REFERENCES niveaux(id) ON DELETE CASCADE,
  classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  type_pv type_proces_verbal NOT NULL,
  periode periode_pv NOT NULL,
  annee_academique VARCHAR(20) NOT NULL,
  statut statut_pv DEFAULT 'NOUVEAU',
  date_reception TIMESTAMP WITH TIME ZONE,
  date_archivage TIMESTAMP WITH TIME ZONE,
  fichier_pv TEXT
);

CREATE INDEX idx_pv_promotion ON proces_verbaux(promotion_id);
CREATE INDEX idx_pv_classe ON proces_verbaux(classe_id);

-- ============================================
-- TABLES ARCHIVAGE
-- ============================================

CREATE TABLE abandons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  etudiant_id UUID NOT NULL REFERENCES etudiants(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  niveau_id UUID NOT NULL REFERENCES niveaux(id) ON DELETE CASCADE,
  filiere_id UUID NOT NULL REFERENCES filieres(id) ON DELETE CASCADE,
  date_abandon TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raison TEXT
);

CREATE INDEX idx_abandons_etudiant ON abandons(etudiant_id);

-- ============================================
-- TABLES MESSAGERIE
-- ============================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expediteur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  destinataire_id UUID REFERENCES utilisateurs(id) ON DELETE CASCADE,
  classe_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  type_destinataire type_destinataire NOT NULL,
  sujet VARCHAR(255) NOT NULL,
  contenu TEXT NOT NULL,
  lu BOOLEAN DEFAULT false,
  date_envoi TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_expediteur ON messages(expediteur_id);
CREATE INDEX idx_messages_destinataire ON messages(destinataire_id);

-- ============================================
-- TABLES AUDIT
-- ============================================

CREATE TABLE actions_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  type_action type_action NOT NULL,
  date_action TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(50),
  user_agent TEXT
);

CREATE INDEX idx_audit_utilisateur ON actions_audit(utilisateur_id);
CREATE INDEX idx_audit_date ON actions_audit(date_action);
CREATE INDEX idx_audit_type ON actions_audit(type_action);

-- ============================================
-- TABLES CANDIDATS ADMIS
-- ============================================

CREATE TABLE candidats_admis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  telephone VARCHAR(20),
  filiere VARCHAR(20) NOT NULL,
  annee_academique VARCHAR(20) NOT NULL,
  date_import TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  importe_par UUID,
  inscrit BOOLEAN DEFAULT false
);

-- ============================================
-- TABLES CHEF DE DÉPARTEMENT
-- ============================================

CREATE TABLE enseignants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telephone VARCHAR(20),
  departement_id UUID NOT NULL REFERENCES departements(id) ON DELETE CASCADE,
  actif BOOLEAN DEFAULT true,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_enseignants_departement ON enseignants(departement_id);

CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  credit INTEGER NOT NULL,
  semestre VARCHAR(10) NOT NULL,
  classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  departement_id UUID NOT NULL REFERENCES departements(id) ON DELETE CASCADE,
  actif BOOLEAN DEFAULT true,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(code, classe_id)
);

CREATE INDEX idx_modules_classe ON modules(classe_id);
CREATE INDEX idx_modules_departement ON modules(departement_id);

CREATE TABLE affectations_module_enseignant (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  enseignant_id UUID NOT NULL REFERENCES enseignants(id) ON DELETE CASCADE,
  date_affectation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(module_id, enseignant_id)
);

CREATE TABLE emplois_du_temps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  enseignant_id UUID NOT NULL REFERENCES enseignants(id) ON DELETE CASCADE,
  jour VARCHAR(20) NOT NULL,
  heure_debut VARCHAR(10) NOT NULL,
  heure_fin VARCHAR(10) NOT NULL,
  salle VARCHAR(50),
  semestre VARCHAR(10) NOT NULL,
  annee_academique VARCHAR(20) NOT NULL,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_emplois_classe ON emplois_du_temps(classe_id);

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  etudiant_id UUID NOT NULL REFERENCES etudiants(id) ON DELETE CASCADE,
  inscription_id UUID NOT NULL REFERENCES inscriptions(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  enseignant_id UUID NOT NULL REFERENCES enseignants(id) ON DELETE CASCADE,
  classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  type_note type_note NOT NULL,
  valeur DECIMAL(4,2) NOT NULL,
  coefficient DECIMAL(3,2) DEFAULT 1.0,
  semestre VARCHAR(10) NOT NULL,
  annee_academique VARCHAR(20) NOT NULL,
  date_evaluation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  commentaire TEXT
);

CREATE INDEX idx_notes_etudiant ON notes(etudiant_id);
CREATE INDEX idx_notes_module ON notes(module_id);
CREATE INDEX idx_notes_classe ON notes(classe_id);

-- ============================================
-- DONNÉES INITIALES - RÔLES
-- ============================================

INSERT INTO roles (code, nom, description, route_dashboard) VALUES
  ('DG', 'Directeur Général', 'Directeur Général de l''établissement', '/dg/dashboard'),
  ('DEP', 'Directeur des Études et de la Pédagogie', 'Responsable des études et de la pédagogie', '/dep/dashboard'),
  ('CHEF_SERVICE_SCOLARITE', 'Chef de Service Scolarité', 'Chef du service scolarité', '/chef-scolarite/dashboard'),
  ('AGENT_SCOLARITE', 'Agent Scolarité', 'Agent du service scolarité', '/scolarite/dashboard'),
  ('SP_SCOLARITE', 'SP Scolarité', 'Secrétaire particulier scolarité', '/sp-scolarite/dashboard'),
  ('CHEF_DEPARTEMENT', 'Chef de Département', 'Chef d''un département académique', '/chef/dashboard'),
  ('ETUDIANT', 'Étudiant', 'Étudiant inscrit', '/dashboard');

-- ============================================
-- DONNÉES INITIALES - FORMATIONS
-- ============================================

INSERT INTO formations (code, nom) VALUES
  ('INITIAL_1', 'Formation Initiale 1'),
  ('INITIAL_2', 'Formation Initiale 2');

-- ============================================
-- DONNÉES INITIALES - NIVEAUX
-- ============================================

INSERT INTO niveaux (code, nom, ordinal) VALUES
  ('L1', '1ère année Licence', '1ère'),
  ('L2', '2ème année Licence', '2ème'),
  ('L3', '3ème année Licence', '3ème');

-- ============================================
-- POLITIQUES RLS (Row Level Security)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departements ENABLE ROW LEVEL SECURITY;
ALTER TABLE etudiants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE diplomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions_audit ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'accès en lecture aux utilisateurs authentifiés
CREATE POLICY "Utilisateurs authentifiés peuvent lire les rôles" ON roles
  FOR SELECT USING (true);

CREATE POLICY "Utilisateurs authentifiés peuvent lire les départements" ON departements
  FOR SELECT USING (true);

-- Politique pour les utilisateurs (accès complet pour le service role)
CREATE POLICY "Service role a accès complet aux utilisateurs" ON utilisateurs
  FOR ALL USING (true);

-- Note: Les politiques RLS plus restrictives peuvent être ajoutées selon les besoins
-- Pour le moment, on utilise le service role key côté serveur qui bypass les RLS

