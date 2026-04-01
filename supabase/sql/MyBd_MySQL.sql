-- ============================================================
-- SchÃ©ma MySQL converti depuis PostgreSQL
-- Compatible MySQL 5.7+ / MariaDB 10.3+ (Hostinger)
-- GÃ©nÃ©rÃ© le : 08/03/2026 07:45:06
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET NAMES utf8mb4;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--




--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--



--
-- Name: PeriodePV; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: Semestre; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: Sexe; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: StatutInscription; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: StatutPV; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: StatutPromotion; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: StatutRecuperation; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: StatutVisa; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: TypeAction; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: TypeActivite; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: TypeDestinataire; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: TypeDiplome; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: TypeInscription; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: TypeNote; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: TypeParent; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: TypeProcesVerbal; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: periode_pv; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: semestre; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: statut_inscription; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: statut_promotion; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: statut_pv; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: statut_recuperation; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: type_action; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: type_destinataire; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: type_diplome; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: type_inscription; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: type_note; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: type_parent; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: type_proces_verbal; Type: TYPE; Schema: public; Owner: postgres
--




--
-- Name: get_dates_for_weekday(text, date, date); Type: FUNCTION; Schema: public; Owner: postgres
--




--
-- Name: update_modified_column(); Type: FUNCTION; Schema: public; Owner: postgres
--




--
-- Name: update_statut_notes_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--






--
-- Name: abandons; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: abandons
CREATE TABLE IF NOT EXISTS `abandons` (
  `id` CHAR(36) NOT NULL,
  `etudiant_id` CHAR(36) NOT NULL,
  `promotion_id` CHAR(36) NOT NULL,
  `niveau_id` CHAR(36) NOT NULL,
  `filiere_id` CHAR(36) NOT NULL,
  `date_abandon` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `raison` LONGTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: actions_audit; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: actions_audit
CREATE TABLE IF NOT EXISTS `actions_audit` (
  `id` CHAR(36) NOT NULL,
  `utilisateur_id` CHAR(36) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` LONGTEXT,
  `type_action` ENUM('CONNEXION', 'DECONNEXION', 'INSCRIPTION', 'ATTESTATION', 'BULLETIN', 'DIPLOME', 'MESSAGE', 'PV', 'ARCHIVAGE', 'ERROR') NOT NULL,
  `date_action` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `ip_address` VARCHAR(50),
  `user_agent` LONGTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: affectations_module_enseignant; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: affectations_module_enseignant
CREATE TABLE IF NOT EXISTS `affectations_module_enseignant` (
  `id` CHAR(36) NOT NULL,
  `module_id` CHAR(36) NOT NULL,
  `enseignant_id` CHAR(36) NOT NULL,
  `date_affectation` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: attestations; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: attestations
CREATE TABLE IF NOT EXISTS `attestations` (
  `id` CHAR(36) NOT NULL,
  `numero` VARCHAR(100) NOT NULL,
  `etudiant_id` CHAR(36) NOT NULL,
  `promotion_id` CHAR(36) NOT NULL,
  `date_generation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `annee_academique` VARCHAR(20) NOT NULL,
  `lieu` VARCHAR(100) DEFAULT 'Libreville',
  `archivee` TINYINT(1) DEFAULT 0,
  `date_archivage` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: bulletins; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: bulletins
CREATE TABLE IF NOT EXISTS `bulletins` (
  `id` CHAR(36) NOT NULL,
  `etudiant_id` CHAR(36) NOT NULL,
  `promotion_id` CHAR(36) NOT NULL,
  `classe_id` CHAR(36) NOT NULL,
  `semestre` ENUM('S1', 'S2') NOT NULL,
  `annee_academique` VARCHAR(20) NOT NULL,
  `statut` ENUM('NON_RECUPERE', 'RECUPERE') DEFAULT 'NON_RECUPERE',
  `date_recuperation` DATETIME,
  `agent_recuperation` CHAR(36),
  `statut_visa` VARCHAR(20) DEFAULT 'EN_ATTENTE',
  `date_generation` DATETIME,
  `genere_par` CHAR(36),
  `date_visa` DATETIME,
  `dep_id` CHAR(36)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: bulletins_generes; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: bulletins_generes
CREATE TABLE IF NOT EXISTS `bulletins_generes` (
  `id` CHAR(36) NOT NULL,
  `classeId` CHAR(36) NOT NULL,
  `semestre` LONGTEXT NOT NULL,
  `departementId` CHAR(36) NOT NULL,
  `chefDepartementId` CHAR(36) NOT NULL,
  `dateGeneration` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `statut` ENUM('EN_ATTENTE', 'VISE') DEFAULT 'EN_ATTENTE' NOT NULL,
  `dateVisa` DATETIME,
  `depId` CHAR(36),
  `pdfPath` LONGTEXT,
  `pdfPathVise` LONGTEXT,
  `nombreEtudiants` INT NOT NULL,
  `anneeAcademique` LONGTEXT NOT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: candidats_admis; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: candidats_admis
CREATE TABLE IF NOT EXISTS `candidats_admis` (
  `id` CHAR(36) NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  `prenom` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255),
  `telephone` VARCHAR(20),
  `filiere` VARCHAR(20) NOT NULL,
  `annee_academique` VARCHAR(20) NOT NULL,
  `date_import` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `importe_par` CHAR(36),
  `inscrit` TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: classes; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: classes
CREATE TABLE IF NOT EXISTS `classes` (
  `id` CHAR(36) NOT NULL,
  `code` VARCHAR(20) NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  `filiere_id` CHAR(36) NOT NULL,
  `niveau_id` CHAR(36) NOT NULL,
  `effectif` INT DEFAULT 0,
  `nombre_modules` INT DEFAULT 0,
  `formation_id` CHAR(36)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: COLUMN classes.formation_id; Type: COMMENT; Schema: public; Owner: postgres
--



--
-- Name: departements; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: departements
CREATE TABLE IF NOT EXISTS `departements` (
  `id` CHAR(36) NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  `code` VARCHAR(20) NOT NULL,
  `description` LONGTEXT,
  `actif` TINYINT(1) DEFAULT 1,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: diplomes; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: diplomes
CREATE TABLE IF NOT EXISTS `diplomes` (
  `id` CHAR(36) NOT NULL,
  `etudiant_id` CHAR(36) NOT NULL,
  `promotion_id` CHAR(36) NOT NULL,
  `classe_id` CHAR(36) NOT NULL,
  `type_diplome` ENUM('DTS', 'LICENCE') NOT NULL,
  `annee_academique` VARCHAR(20) NOT NULL,
  `statut` ENUM('NON_RECUPERE', 'RECUPERE') DEFAULT 'NON_RECUPERE',
  `date_recuperation` DATETIME,
  `agent_recuperation` CHAR(36)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: emplois_du_temps; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: emplois_du_temps
CREATE TABLE IF NOT EXISTS `emplois_du_temps` (
  `id` CHAR(36) NOT NULL,
  `classe_id` CHAR(36) NOT NULL,
  `module_id` CHAR(36) NOT NULL,
  `enseignant_id` CHAR(36) NOT NULL,
  `jour` VARCHAR(20) NOT NULL,
  `heure_debut` VARCHAR(10) NOT NULL,
  `heure_fin` VARCHAR(10) NOT NULL,
  `salle` VARCHAR(50),
  `semestre` VARCHAR(10) NOT NULL,
  `annee_academique` VARCHAR(20) NOT NULL,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `date_debut` DATE NOT NULL,
  `date_fin` DATE NOT NULL,
  `type_activite` ENUM('COURS', 'TP', 'TD', 'DEVOIR') DEFAULT 'COURS' NOT NULL,
  `est_recurrent` TINYINT(1) DEFAULT 1 NOT NULL,
  `date_specifique` DATE,
  `groupe_recurrence` CHAR(36)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: COLUMN emplois_du_temps.date_debut; Type: COMMENT; Schema: public; Owner: postgres
--



--
-- Name: COLUMN emplois_du_temps.date_fin; Type: COMMENT; Schema: public; Owner: postgres
--



--
-- Name: COLUMN emplois_du_temps.type_activite; Type: COMMENT; Schema: public; Owner: postgres
--



--
-- Name: COLUMN emplois_du_temps.est_recurrent; Type: COMMENT; Schema: public; Owner: postgres
--



--
-- Name: COLUMN emplois_du_temps.date_specifique; Type: COMMENT; Schema: public; Owner: postgres
--



--
-- Name: COLUMN emplois_du_temps.groupe_recurrence; Type: COMMENT; Schema: public; Owner: postgres
--



--
-- Name: enseignants; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: enseignants
CREATE TABLE IF NOT EXISTS `enseignants` (
  `id` CHAR(36) NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  `prenom` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `telephone` VARCHAR(20),
  `departement_id` CHAR(36) NOT NULL,
  `actif` TINYINT(1) DEFAULT 1,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `statut` VARCHAR(20) DEFAULT 'PERMANENT',
  `grade` VARCHAR(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: etudiants; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: etudiants
CREATE TABLE IF NOT EXISTS `etudiants` (
  `id` CHAR(36) NOT NULL,
  `matricule` VARCHAR(50) NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  `prenom` VARCHAR(100) NOT NULL,
  `date_naissance` DATE,
  `lieu_naissance` VARCHAR(100),
  `nationalite` VARCHAR(50),
  `email` VARCHAR(255),
  `telephone` VARCHAR(20),
  `adresse` LONGTEXT,
  `photo` LONGTEXT,
  `sexe` ENUM('M', 'F')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: COLUMN etudiants.sexe; Type: COMMENT; Schema: public; Owner: postgres
--



--
-- Name: filieres; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: filieres
CREATE TABLE IF NOT EXISTS `filieres` (
  `id` CHAR(36) NOT NULL,
  `code` VARCHAR(20) NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  `departement_id` CHAR(36)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: formations; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: formations
CREATE TABLE IF NOT EXISTS `formations` (
  `id` CHAR(36) NOT NULL,
  `code` VARCHAR(20) NOT NULL,
  `nom` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: inscriptions; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: inscriptions
CREATE TABLE IF NOT EXISTS `inscriptions` (
  `id` CHAR(36) NOT NULL,
  `etudiant_id` CHAR(36) NOT NULL,
  `promotion_id` CHAR(36) NOT NULL,
  `formation_id` CHAR(36) NOT NULL,
  `filiere_id` CHAR(36) NOT NULL,
  `niveau_id` CHAR(36) NOT NULL,
  `classe_id` CHAR(36),
  `type_inscription` ENUM('INSCRIPTION', 'REINSCRIPTION') NOT NULL,
  `statut` ENUM('EN_ATTENTE', 'VALIDEE', 'REJETEE', 'INSCRIT') DEFAULT 'EN_ATTENTE',
  `date_inscription` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `date_validation` DATETIME,
  `agent_valideur_id` CHAR(36),
  `copie_releve` LONGTEXT,
  `copie_diplome` LONGTEXT,
  `copie_acte_naissance` LONGTEXT,
  `photo_identite` LONGTEXT,
  `quittance` LONGTEXT,
  `piece_identite` LONGTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: COLUMN inscriptions.classe_id; Type: COMMENT; Schema: public; Owner: postgres
--



--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: messages
CREATE TABLE IF NOT EXISTS `messages` (
  `id` CHAR(36) NOT NULL,
  `expediteur_id` CHAR(36) NOT NULL,
  `destinataire_id` CHAR(36),
  `classe_id` CHAR(36),
  `type_destinataire` ENUM('INDIVIDUEL', 'CLASSE', 'COLLECTIF') NOT NULL,
  `sujet` VARCHAR(255) NOT NULL,
  `contenu` LONGTEXT NOT NULL,
  `lu` TINYINT(1) DEFAULT 0,
  `date_envoi` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: modules; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: modules
CREATE TABLE IF NOT EXISTS `modules` (
  `id` CHAR(36) NOT NULL,
  `code` VARCHAR(20) NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  `credit` INT NOT NULL,
  `semestre` VARCHAR(10) NOT NULL,
  `classe_id` CHAR(36),
  `departement_id` CHAR(36) NOT NULL,
  `actif` TINYINT(1) DEFAULT 1,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `filiere_id` CHAR(36),
  `ue` VARCHAR(50) DEFAULT 'UE1' NOT NULL,
  `nom_ue` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: COLUMN modules.ue; Type: COMMENT; Schema: public; Owner: postgres
--



--
-- Name: COLUMN modules.nom_ue; Type: COMMENT; Schema: public; Owner: postgres
--



--
-- Name: niveaux; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: niveaux
CREATE TABLE IF NOT EXISTS `niveaux` (
  `id` CHAR(36) NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  `nom` VARCHAR(50) NOT NULL,
  `ordinal` VARCHAR(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: notes; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: notes
CREATE TABLE IF NOT EXISTS `notes` (
  `id` CHAR(36) NOT NULL,
  `etudiant_id` CHAR(36) NOT NULL,
  `inscription_id` CHAR(36),
  `module_id` CHAR(36) NOT NULL,
  `enseignant_id` CHAR(36),
  `classe_id` CHAR(36) NOT NULL,
  `valeur` DECIMAL(4,2) NOT NULL,
  `semestre` VARCHAR(10) NOT NULL,
  `annee_academique` VARCHAR(20) NOT NULL,
  `date_evaluation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `evaluation_id` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: COLUMN notes.inscription_id; Type: COMMENT; Schema: public; Owner: postgres
--



--
-- Name: COLUMN notes.enseignant_id; Type: COMMENT; Schema: public; Owner: postgres
--



--
-- Name: COLUMN notes.evaluation_id; Type: COMMENT; Schema: public; Owner: postgres
--



--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` CHAR(36) NOT NULL,
  `etudiant_id` CHAR(36) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `titre` LONGTEXT NOT NULL,
  `message` LONGTEXT NOT NULL,
  `lien` LONGTEXT,
  `lu` TINYINT(1) DEFAULT 0,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `metadata` JSON
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: TABLE notifications; Type: COMMENT; Schema: public; Owner: postgres
--



--
-- Name: COLUMN notifications.type; Type: COMMENT; Schema: public; Owner: postgres
--



--
-- Name: COLUMN notifications.metadata; Type: COMMENT; Schema: public; Owner: postgres
--



--
-- Name: parametres_notation; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: parametres_notation
CREATE TABLE IF NOT EXISTS `parametres_notation` (
  `id` CHAR(36) NOT NULL,
  `module_id` CHAR(36) NOT NULL,
  `semestre` VARCHAR(10) NOT NULL,
  `evaluations` JSON NOT NULL,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `date_modification` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: TABLE parametres_notation; Type: COMMENT; Schema: public; Owner: postgres
--



--
-- Name: COLUMN parametres_notation.evaluations; Type: COMMENT; Schema: public; Owner: postgres
--



--
-- Name: parents; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: parents
CREATE TABLE IF NOT EXISTS `parents` (
  `id` CHAR(36) NOT NULL,
  `etudiant_id` CHAR(36) NOT NULL,
  `type` ENUM('PERE', 'MERE', 'TUTEUR') NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  `prenom` VARCHAR(100) NOT NULL,
  `telephone` VARCHAR(20),
  `email` VARCHAR(255),
  `profession` VARCHAR(100),
  `adresse` LONGTEXT,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: proces_verbaux; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: proces_verbaux
CREATE TABLE IF NOT EXISTS `proces_verbaux` (
  `id` CHAR(36) NOT NULL,
  `promotion_id` CHAR(36) NOT NULL,
  `filiere_id` CHAR(36) NOT NULL,
  `niveau_id` CHAR(36) NOT NULL,
  `classe_id` CHAR(36) NOT NULL,
  `type_pv` ENUM('AVANT_RATTRAPAGES', 'APRES_RATTRAPAGES', 'ANNUEL') NOT NULL,
  `periode` ENUM('S1', 'S2', 'ANNUEL') NOT NULL,
  `annee_academique` VARCHAR(20) NOT NULL,
  `statut` ENUM('NOUVEAU', 'VU', 'ARCHIVE') DEFAULT 'NOUVEAU',
  `date_reception` DATETIME,
  `date_archivage` DATETIME,
  `fichier_pv` LONGTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: promotions; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: promotions
CREATE TABLE IF NOT EXISTS `promotions` (
  `id` CHAR(36) NOT NULL,
  `annee` VARCHAR(20) NOT NULL,
  `statut` ENUM('EN_COURS', 'ARCHIVE') DEFAULT 'EN_COURS',
  `date_debut` DATETIME NOT NULL,
  `date_fin` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` CHAR(36) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  `description` LONGTEXT,
  `route_dashboard` VARCHAR(100),
  `actif` TINYINT(1) DEFAULT 1,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: statut_notes_classes; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: statut_notes_classes
CREATE TABLE IF NOT EXISTS `statut_notes_classes` (
  `id` CHAR(36) NOT NULL,
  `classe_id` CHAR(36) NOT NULL,
  `semestre` VARCHAR(10) NOT NULL,
  `nombre_modules_avec_notes` INT DEFAULT 0,
  `nombre_modules_complets` INT DEFAULT 0,
  `nombre_etudiants_avec_notes` INT DEFAULT 0,
  `nombre_etudiants_complets` INT DEFAULT 0,
  `date_mise_a_jour` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: utilisateurs; Type: TABLE; Schema: public; Owner: postgres
--

-- Table: utilisateurs
CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id` CHAR(36) NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  `prenom` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `token` LONGTEXT,
  `photo` LONGTEXT,
  `telephone` VARCHAR(20),
  `adresse` LONGTEXT,
  `role_id` CHAR(36) NOT NULL,
  `actif` TINYINT(1) DEFAULT 1,
  `date_creation` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `derniere_connexion` DATETIME,
  `departement_id` CHAR(36),
  `sexe` ENUM('M', 'F')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




--
-- Name: COLUMN utilisateurs.sexe; Type: COMMENT; Schema: public; Owner: postgres
--



--
-- Name: v_emplois_du_temps_detailles; Type: VIEW; Schema: public; Owner: postgres
--




--
-- Name: abandons abandons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: actions_audit actions_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: affectations_module_enseignant affectations_module_enseignant_module_id_enseignant_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: affectations_module_enseignant affectations_module_enseignant_module_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: affectations_module_enseignant affectations_module_enseignant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: attestations attestations_numero_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: attestations attestations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: bulletins_generes bulletins_generes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: bulletins bulletins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: candidats_admis candidats_admis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: classes classes_code_filiere_id_niveau_id_formation_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: departements departements_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: departements departements_nom_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: departements departements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: diplomes diplomes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: emplois_du_temps emplois_du_temps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: enseignants enseignants_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: enseignants enseignants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: etudiants etudiants_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: etudiants etudiants_matricule_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: etudiants etudiants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: filieres filieres_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: filieres filieres_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: formations formations_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: formations formations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: inscriptions inscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: modules modules_code_filiere_semestre_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: niveaux niveaux_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: niveaux niveaux_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: parametres_notation parametres_notation_module_id_semestre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: parametres_notation parametres_notation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: parents parents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: proces_verbaux proces_verbaux_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: promotions promotions_annee_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: roles roles_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: statut_notes_classes statut_notes_classes_classe_id_semestre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: statut_notes_classes statut_notes_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: utilisateurs utilisateurs_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: utilisateurs utilisateurs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: utilisateurs utilisateurs_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: bulletins_generes_departementId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX `bulletins_generes_departementId_idx` ON bulletins_generes (`departementId`);


--
-- Name: bulletins_generes_statut_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bulletins_generes_statut_idx ON bulletins_generes (statut);


--
-- Name: idx_abandons_etudiant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_abandons_etudiant ON abandons (etudiant_id);


--
-- Name: idx_attestations_etudiant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attestations_etudiant ON attestations (etudiant_id);


--
-- Name: idx_attestations_promotion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attestations_promotion ON attestations (promotion_id);


--
-- Name: idx_audit_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_date ON actions_audit (date_action);


--
-- Name: idx_audit_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_type ON actions_audit (type_action);


--
-- Name: idx_audit_utilisateur; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_utilisateur ON actions_audit (utilisateur_id);


--
-- Name: idx_bulletins_classe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bulletins_classe ON bulletins (classe_id);


--
-- Name: idx_bulletins_date_generation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bulletins_date_generation ON bulletins (date_generation);


--
-- Name: idx_bulletins_etudiant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bulletins_etudiant ON bulletins (etudiant_id);


--
-- Name: idx_bulletins_statut_visa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bulletins_statut_visa ON bulletins (statut_visa);


--
-- Name: idx_classes_filiere; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_classes_filiere ON classes (filiere_id);


--
-- Name: idx_classes_niveau; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_classes_niveau ON classes (niveau_id);


--
-- Name: idx_diplomes_classe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_diplomes_classe ON diplomes (classe_id);


--
-- Name: idx_diplomes_etudiant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_diplomes_etudiant ON diplomes (etudiant_id);


--
-- Name: idx_emplois_classe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emplois_classe ON emplois_du_temps (classe_id);


--
-- Name: idx_emplois_du_temps_date_specifique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emplois_du_temps_date_specifique ON emplois_du_temps (date_specifique);


--
-- Name: idx_emplois_du_temps_groupe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emplois_du_temps_groupe ON emplois_du_temps (groupe_recurrence);


--
-- Name: idx_emplois_du_temps_periode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emplois_du_temps_periode ON emplois_du_temps (classe_id, date_debut, date_fin);


--
-- Name: idx_enseignants_departement; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enseignants_departement ON enseignants (departement_id);


--
-- Name: idx_enseignants_grade; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enseignants_grade ON enseignants (grade);


--
-- Name: idx_enseignants_statut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enseignants_statut ON enseignants (statut);


--
-- Name: idx_etudiants_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_etudiants_email ON etudiants (email);


--
-- Name: idx_etudiants_matricule; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_etudiants_matricule ON etudiants (matricule);


--
-- Name: idx_inscriptions_classe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inscriptions_classe ON inscriptions (classe_id);


--
-- Name: idx_inscriptions_etudiant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inscriptions_etudiant ON inscriptions (etudiant_id);


--
-- Name: idx_inscriptions_promotion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inscriptions_promotion ON inscriptions (promotion_id);


--
-- Name: idx_inscriptions_statut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inscriptions_statut ON inscriptions (statut);


--
-- Name: idx_messages_destinataire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_destinataire ON messages (destinataire_id);


--
-- Name: idx_messages_expediteur; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_expediteur ON messages (expediteur_id);


--
-- Name: idx_modules_classe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_modules_classe ON modules (classe_id);


--
-- Name: idx_modules_departement; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_modules_departement ON modules (departement_id);


--
-- Name: idx_modules_filiere; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_modules_filiere ON modules (filiere_id);


--
-- Name: idx_modules_ue; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_modules_ue ON modules (ue);


--
-- Name: idx_notes_annee_academique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notes_annee_academique ON notes (annee_academique);


--
-- Name: idx_notes_classe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notes_classe ON notes (classe_id);


--
-- Name: idx_notes_etudiant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notes_etudiant ON notes (etudiant_id);


--
-- Name: idx_notes_evaluation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notes_evaluation ON notes (evaluation_id);


--
-- Name: idx_notes_module; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notes_module ON notes (module_id);


--
-- Name: idx_notes_module_classe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notes_module_classe ON notes (module_id, classe_id);


--
-- Name: idx_notes_semestre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notes_semestre ON notes (semestre);


--
-- Name: idx_notifications_date_creation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_date_creation ON notifications (date_creation DESC);


--
-- Name: idx_notifications_etudiant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_etudiant_id ON notifications (etudiant_id);


--
-- Name: idx_notifications_etudiant_lu; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_etudiant_lu ON notifications (etudiant_id, lu);


--
-- Name: idx_notifications_lu; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_lu ON notifications (lu);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_type ON notifications (type);


--
-- Name: idx_parametres_notation_module; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_parametres_notation_module ON parametres_notation (module_id);


--
-- Name: idx_parametres_notation_semestre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_parametres_notation_semestre ON parametres_notation (semestre);


--
-- Name: idx_parents_etudiant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_parents_etudiant ON parents (etudiant_id);


--
-- Name: idx_pv_classe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pv_classe ON proces_verbaux (classe_id);


--
-- Name: idx_pv_promotion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pv_promotion ON proces_verbaux (promotion_id);


--
-- Name: idx_statut_notes_classe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_statut_notes_classe ON statut_notes_classes (classe_id);


--
-- Name: idx_statut_notes_classe_semestre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_statut_notes_classe_semestre ON statut_notes_classes (classe_id, semestre);


--
-- Name: idx_statut_notes_semestre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_statut_notes_semestre ON statut_notes_classes (semestre);


--
-- Name: idx_utilisateurs_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utilisateurs_email ON utilisateurs (email);


--
-- Name: idx_utilisateurs_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utilisateurs_role_id ON utilisateurs (role_id);


--
-- Name: idx_utilisateurs_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utilisateurs_username ON utilisateurs (username);


--
-- Name: parametres_notation update_parametres_notation_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--



--
-- Name: statut_notes_classes update_statut_notes_timestamp_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--



--
-- Name: abandons abandons_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: abandons abandons_filiere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: abandons abandons_niveau_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: abandons abandons_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: actions_audit actions_audit_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: affectations_module_enseignant affectations_module_enseignant_enseignant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: affectations_module_enseignant affectations_module_enseignant_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: attestations attestations_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: attestations attestations_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: bulletins bulletins_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: bulletins bulletins_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: bulletins bulletins_genere_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: bulletins_generes bulletins_generes_chefDepartementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: bulletins_generes bulletins_generes_classeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: bulletins_generes bulletins_generes_depId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: bulletins_generes bulletins_generes_departementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: bulletins bulletins_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: classes classes_filiere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: classes classes_formation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: classes classes_niveau_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: diplomes diplomes_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: diplomes diplomes_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: diplomes diplomes_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: emplois_du_temps emplois_du_temps_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: emplois_du_temps emplois_du_temps_enseignant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: emplois_du_temps emplois_du_temps_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: enseignants enseignants_departement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: filieres filieres_departement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: inscriptions inscriptions_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: inscriptions inscriptions_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: inscriptions inscriptions_filiere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: inscriptions inscriptions_formation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: inscriptions inscriptions_niveau_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: inscriptions inscriptions_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: messages messages_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: messages messages_destinataire_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: messages messages_expediteur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: modules modules_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: modules modules_departement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: modules modules_filiere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: notes notes_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: notes notes_enseignant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: notes notes_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: notes notes_inscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: notes notes_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: notifications notifications_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: parametres_notation parametres_notation_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: parents parents_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: proces_verbaux proces_verbaux_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: proces_verbaux proces_verbaux_filiere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: proces_verbaux proces_verbaux_niveau_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: proces_verbaux proces_verbaux_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: statut_notes_classes statut_notes_classes_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: utilisateurs utilisateurs_departement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: utilisateurs utilisateurs_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--



--
-- Name: utilisateurs Service role a accÃ¨s complet aux utilisateurs; Type: POLICY; Schema: public; Owner: postgres
--



--
-- Name: departements Utilisateurs authentifiÃ©s peuvent lire les dÃ©partements; Type: POLICY; Schema: public; Owner: postgres
--



--
-- Name: roles Utilisateurs authentifiÃ©s peuvent lire les rÃ´les; Type: POLICY; Schema: public; Owner: postgres
--



--
-- Name: actions_audit; Type: ROW SECURITY; Schema: public; Owner: postgres
--


--
-- Name: attestations; Type: ROW SECURITY; Schema: public; Owner: postgres
--


--
-- Name: bulletins; Type: ROW SECURITY; Schema: public; Owner: postgres
--


--
-- Name: departements; Type: ROW SECURITY; Schema: public; Owner: postgres
--


--
-- Name: diplomes; Type: ROW SECURITY; Schema: public; Owner: postgres
--


--
-- Name: etudiants; Type: ROW SECURITY; Schema: public; Owner: postgres
--


--
-- Name: inscriptions; Type: ROW SECURITY; Schema: public; Owner: postgres
--


--
-- Name: notes; Type: ROW SECURITY; Schema: public; Owner: postgres
--


--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--


--
-- Name: utilisateurs; Type: ROW SECURITY; Schema: public; Owner: postgres
--


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--



--
-- Name: FUNCTION get_dates_for_weekday(p_jour text, p_date_debut date, p_date_fin date); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION update_modified_column(); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: FUNCTION update_statut_notes_timestamp(); Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE abandons; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE actions_audit; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE affectations_module_enseignant; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE attestations; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE bulletins; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE bulletins_generes; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE candidats_admis; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE classes; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE departements; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE diplomes; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE emplois_du_temps; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE enseignants; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE etudiants; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE filieres; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE formations; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE inscriptions; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE messages; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE modules; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE niveaux; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE notes; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE parametres_notation; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE parents; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE proces_verbaux; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE promotions; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE roles; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE statut_notes_classes; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE utilisateurs; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: TABLE v_emplois_du_temps_detailles; Type: ACL; Schema: public; Owner: postgres
--



--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--



--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--



--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--



--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--



--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--



--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--



--
-- PostgreSQL database dump complete
--




SET FOREIGN_KEY_CHECKS = 1;


