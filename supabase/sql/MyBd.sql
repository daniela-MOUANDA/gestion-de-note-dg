--
-- PostgreSQL database dump
--

\restrict qFAiIVoVF7Qyae3jV5GVTAQ7fnT0GjVBxiciwzgLTJgj968k7IgeOxLvLe5Ip8P

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: PeriodePV; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PeriodePV" AS ENUM (
    'S1',
    'S2',
    'ANNUEL'
);


ALTER TYPE public."PeriodePV" OWNER TO postgres;

--
-- Name: Semestre; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Semestre" AS ENUM (
    'S1',
    'S2'
);


ALTER TYPE public."Semestre" OWNER TO postgres;

--
-- Name: Sexe; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Sexe" AS ENUM (
    'M',
    'F'
);


ALTER TYPE public."Sexe" OWNER TO postgres;

--
-- Name: StatutInscription; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatutInscription" AS ENUM (
    'EN_ATTENTE',
    'VALIDEE',
    'REJETEE',
    'INSCRIT'
);


ALTER TYPE public."StatutInscription" OWNER TO postgres;

--
-- Name: StatutPV; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatutPV" AS ENUM (
    'NOUVEAU',
    'VU',
    'ARCHIVE'
);


ALTER TYPE public."StatutPV" OWNER TO postgres;

--
-- Name: StatutPromotion; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatutPromotion" AS ENUM (
    'EN_COURS',
    'ARCHIVE'
);


ALTER TYPE public."StatutPromotion" OWNER TO postgres;

--
-- Name: StatutRecuperation; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatutRecuperation" AS ENUM (
    'NON_RECUPERE',
    'RECUPERE'
);


ALTER TYPE public."StatutRecuperation" OWNER TO postgres;

--
-- Name: StatutVisa; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StatutVisa" AS ENUM (
    'EN_ATTENTE',
    'VISE'
);


ALTER TYPE public."StatutVisa" OWNER TO postgres;

--
-- Name: TypeAction; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TypeAction" AS ENUM (
    'CONNEXION',
    'DECONNEXION',
    'INSCRIPTION',
    'ATTESTATION',
    'BULLETIN',
    'DIPLOME',
    'MESSAGE',
    'PV',
    'ARCHIVAGE',
    'ERROR'
);


ALTER TYPE public."TypeAction" OWNER TO postgres;

--
-- Name: TypeActivite; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TypeActivite" AS ENUM (
    'COURS',
    'TP',
    'TD',
    'DEVOIR'
);


ALTER TYPE public."TypeActivite" OWNER TO postgres;

--
-- Name: TypeDestinataire; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TypeDestinataire" AS ENUM (
    'INDIVIDUEL',
    'CLASSE',
    'COLLECTIF'
);


ALTER TYPE public."TypeDestinataire" OWNER TO postgres;

--
-- Name: TypeDiplome; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TypeDiplome" AS ENUM (
    'DTS',
    'LICENCE'
);


ALTER TYPE public."TypeDiplome" OWNER TO postgres;

--
-- Name: TypeInscription; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TypeInscription" AS ENUM (
    'INSCRIPTION',
    'REINSCRIPTION'
);


ALTER TYPE public."TypeInscription" OWNER TO postgres;

--
-- Name: TypeNote; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TypeNote" AS ENUM (
    'CONTINU',
    'EXAMEN',
    'RATTRAPAGE',
    'ORAL',
    'PRATIQUE'
);


ALTER TYPE public."TypeNote" OWNER TO postgres;

--
-- Name: TypeParent; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TypeParent" AS ENUM (
    'PERE',
    'MERE',
    'TUTEUR'
);


ALTER TYPE public."TypeParent" OWNER TO postgres;

--
-- Name: TypeProcesVerbal; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TypeProcesVerbal" AS ENUM (
    'AVANT_RATTRAPAGES',
    'APRES_RATTRAPAGES',
    'ANNUEL'
);


ALTER TYPE public."TypeProcesVerbal" OWNER TO postgres;

--
-- Name: periode_pv; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.periode_pv AS ENUM (
    'S1',
    'S2',
    'ANNUEL'
);


ALTER TYPE public.periode_pv OWNER TO postgres;

--
-- Name: semestre; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.semestre AS ENUM (
    'S1',
    'S2'
);


ALTER TYPE public.semestre OWNER TO postgres;

--
-- Name: statut_inscription; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.statut_inscription AS ENUM (
    'EN_ATTENTE',
    'VALIDEE',
    'REJETEE',
    'INSCRIT'
);


ALTER TYPE public.statut_inscription OWNER TO postgres;

--
-- Name: statut_promotion; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.statut_promotion AS ENUM (
    'EN_COURS',
    'ARCHIVE'
);


ALTER TYPE public.statut_promotion OWNER TO postgres;

--
-- Name: statut_pv; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.statut_pv AS ENUM (
    'NOUVEAU',
    'VU',
    'ARCHIVE'
);


ALTER TYPE public.statut_pv OWNER TO postgres;

--
-- Name: statut_recuperation; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.statut_recuperation AS ENUM (
    'NON_RECUPERE',
    'RECUPERE'
);


ALTER TYPE public.statut_recuperation OWNER TO postgres;

--
-- Name: type_action; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_action AS ENUM (
    'CONNEXION',
    'DECONNEXION',
    'INSCRIPTION',
    'ATTESTATION',
    'BULLETIN',
    'DIPLOME',
    'MESSAGE',
    'PV',
    'ARCHIVAGE',
    'ERROR'
);


ALTER TYPE public.type_action OWNER TO postgres;

--
-- Name: type_destinataire; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_destinataire AS ENUM (
    'INDIVIDUEL',
    'CLASSE',
    'COLLECTIF'
);


ALTER TYPE public.type_destinataire OWNER TO postgres;

--
-- Name: type_diplome; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_diplome AS ENUM (
    'DTS',
    'LICENCE'
);


ALTER TYPE public.type_diplome OWNER TO postgres;

--
-- Name: type_inscription; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_inscription AS ENUM (
    'INSCRIPTION',
    'REINSCRIPTION'
);


ALTER TYPE public.type_inscription OWNER TO postgres;

--
-- Name: type_note; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_note AS ENUM (
    'CONTINU',
    'EXAMEN',
    'RATTRAPAGE',
    'ORAL',
    'PRATIQUE'
);


ALTER TYPE public.type_note OWNER TO postgres;

--
-- Name: type_parent; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_parent AS ENUM (
    'PERE',
    'MERE',
    'TUTEUR'
);


ALTER TYPE public.type_parent OWNER TO postgres;

--
-- Name: type_proces_verbal; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_proces_verbal AS ENUM (
    'AVANT_RATTRAPAGES',
    'APRES_RATTRAPAGES',
    'ANNUEL'
);


ALTER TYPE public.type_proces_verbal OWNER TO postgres;

--
-- Name: get_dates_for_weekday(text, date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_dates_for_weekday(p_jour text, p_date_debut date, p_date_fin date) RETURNS TABLE(date_occurrence date)
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
  v_jour_numero INT;
  v_current_date DATE;
BEGIN
  -- Convertir le jour en numéro (1=Lundi, 7=Dimanche)
  v_jour_numero := CASE p_jour
    WHEN 'LUNDI' THEN 1
    WHEN 'MARDI' THEN 2
    WHEN 'MERCREDI' THEN 3
    WHEN 'JEUDI' THEN 4
    WHEN 'VENDREDI' THEN 5
    WHEN 'SAMEDI' THEN 6
    WHEN 'DIMANCHE' THEN 7
  END;
  
  -- Trouver le premier jour correspondant
  v_current_date := p_date_debut;
  WHILE EXTRACT(ISODOW FROM v_current_date) != v_jour_numero LOOP
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;
  
  -- Générer toutes les dates
  WHILE v_current_date <= p_date_fin LOOP
    date_occurrence := v_current_date;
    RETURN NEXT;
    v_current_date := v_current_date + INTERVAL '7 days';
  END LOOP;
  
  RETURN;
END;
$$;


ALTER FUNCTION public.get_dates_for_weekday(p_jour text, p_date_debut date, p_date_fin date) OWNER TO postgres;

--
-- Name: update_modified_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.date_modification = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_modified_column() OWNER TO postgres;

--
-- Name: update_statut_notes_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_statut_notes_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.date_mise_a_jour = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_statut_notes_timestamp() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: abandons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.abandons (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    etudiant_id uuid NOT NULL,
    promotion_id uuid NOT NULL,
    niveau_id uuid NOT NULL,
    filiere_id uuid NOT NULL,
    date_abandon timestamp with time zone DEFAULT now(),
    raison text
);


ALTER TABLE public.abandons OWNER TO postgres;

--
-- Name: actions_audit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actions_audit (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    utilisateur_id uuid NOT NULL,
    action character varying(100) NOT NULL,
    details text,
    type_action public.type_action NOT NULL,
    date_action timestamp with time zone DEFAULT now(),
    ip_address character varying(50),
    user_agent text
);


ALTER TABLE public.actions_audit OWNER TO postgres;

--
-- Name: affectations_module_enseignant; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.affectations_module_enseignant (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    module_id uuid NOT NULL,
    enseignant_id uuid NOT NULL,
    date_affectation timestamp with time zone DEFAULT now()
);


ALTER TABLE public.affectations_module_enseignant OWNER TO postgres;

--
-- Name: attestations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attestations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    numero character varying(100) NOT NULL,
    etudiant_id uuid NOT NULL,
    promotion_id uuid NOT NULL,
    date_generation timestamp with time zone DEFAULT now(),
    annee_academique character varying(20) NOT NULL,
    lieu character varying(100) DEFAULT 'Libreville'::character varying,
    archivee boolean DEFAULT false,
    date_archivage timestamp with time zone
);


ALTER TABLE public.attestations OWNER TO postgres;

--
-- Name: bulletins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bulletins (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    etudiant_id uuid NOT NULL,
    promotion_id uuid NOT NULL,
    classe_id uuid NOT NULL,
    semestre public.semestre NOT NULL,
    annee_academique character varying(20) NOT NULL,
    statut public.statut_recuperation DEFAULT 'NON_RECUPERE'::public.statut_recuperation,
    date_recuperation timestamp with time zone,
    agent_recuperation uuid,
    statut_visa character varying(20) DEFAULT 'EN_ATTENTE'::character varying,
    date_generation timestamp with time zone,
    genere_par uuid,
    date_visa timestamp(3) without time zone,
    dep_id uuid
);


ALTER TABLE public.bulletins OWNER TO postgres;

--
-- Name: bulletins_generes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bulletins_generes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    "classeId" uuid NOT NULL,
    semestre text NOT NULL,
    "departementId" uuid NOT NULL,
    "chefDepartementId" uuid NOT NULL,
    "dateGeneration" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    statut public."StatutVisa" DEFAULT 'EN_ATTENTE'::public."StatutVisa" NOT NULL,
    "dateVisa" timestamp(3) without time zone,
    "depId" uuid,
    "pdfPath" text,
    "pdfPathVise" text,
    "nombreEtudiants" integer NOT NULL,
    "anneeAcademique" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.bulletins_generes OWNER TO postgres;

--
-- Name: candidats_admis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.candidats_admis (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    email character varying(255),
    telephone character varying(20),
    filiere character varying(20) NOT NULL,
    annee_academique character varying(20) NOT NULL,
    date_import timestamp with time zone DEFAULT now(),
    importe_par uuid,
    inscrit boolean DEFAULT false
);


ALTER TABLE public.candidats_admis OWNER TO postgres;

--
-- Name: classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    code character varying(20) NOT NULL,
    nom character varying(100) NOT NULL,
    filiere_id uuid NOT NULL,
    niveau_id uuid NOT NULL,
    effectif integer DEFAULT 0,
    nombre_modules integer DEFAULT 0,
    formation_id uuid
);


ALTER TABLE public.classes OWNER TO postgres;

--
-- Name: COLUMN classes.formation_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.classes.formation_id IS 'Formation à laquelle appartient la classe (Initiale 1 ou Initiale 2)';


--
-- Name: departements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departements (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    code character varying(20) NOT NULL,
    description text,
    actif boolean DEFAULT true,
    date_creation timestamp with time zone DEFAULT now()
);


ALTER TABLE public.departements OWNER TO postgres;

--
-- Name: diplomes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.diplomes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    etudiant_id uuid NOT NULL,
    promotion_id uuid NOT NULL,
    classe_id uuid NOT NULL,
    type_diplome public.type_diplome NOT NULL,
    annee_academique character varying(20) NOT NULL,
    statut public.statut_recuperation DEFAULT 'NON_RECUPERE'::public.statut_recuperation,
    date_recuperation timestamp with time zone,
    agent_recuperation uuid
);


ALTER TABLE public.diplomes OWNER TO postgres;

--
-- Name: emplois_du_temps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.emplois_du_temps (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    classe_id uuid NOT NULL,
    module_id uuid NOT NULL,
    enseignant_id uuid NOT NULL,
    jour character varying(20) NOT NULL,
    heure_debut character varying(10) NOT NULL,
    heure_fin character varying(10) NOT NULL,
    salle character varying(50),
    semestre character varying(10) NOT NULL,
    annee_academique character varying(20) NOT NULL,
    date_creation timestamp with time zone DEFAULT now(),
    date_debut date NOT NULL,
    date_fin date NOT NULL,
    type_activite public."TypeActivite" DEFAULT 'COURS'::public."TypeActivite" NOT NULL,
    est_recurrent boolean DEFAULT true NOT NULL,
    date_specifique date,
    groupe_recurrence uuid,
    CONSTRAINT check_dates_coherentes CHECK ((date_fin >= date_debut)),
    CONSTRAINT check_devoir_date_specifique CHECK ((((est_recurrent = true) AND (date_specifique IS NULL)) OR ((est_recurrent = false) AND (date_specifique IS NOT NULL))))
);


ALTER TABLE public.emplois_du_temps OWNER TO postgres;

--
-- Name: COLUMN emplois_du_temps.date_debut; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.emplois_du_temps.date_debut IS 'Date de début de la période de validité de l''emploi du temps';


--
-- Name: COLUMN emplois_du_temps.date_fin; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.emplois_du_temps.date_fin IS 'Date de fin de la période de validité de l''emploi du temps';


--
-- Name: COLUMN emplois_du_temps.type_activite; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.emplois_du_temps.type_activite IS 'Type d''activité: COURS, TP, TD ou DEVOIR';


--
-- Name: COLUMN emplois_du_temps.est_recurrent; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.emplois_du_temps.est_recurrent IS 'Indique si l''activité se répète chaque semaine (true) ou est ponctuelle (false)';


--
-- Name: COLUMN emplois_du_temps.date_specifique; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.emplois_du_temps.date_specifique IS 'Date spécifique pour les activités ponctuelles (devoirs)';


--
-- Name: COLUMN emplois_du_temps.groupe_recurrence; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.emplois_du_temps.groupe_recurrence IS 'UUID pour regrouper les occurrences d''un même cours récurrent';


--
-- Name: enseignants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enseignants (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    telephone character varying(20),
    departement_id uuid NOT NULL,
    actif boolean DEFAULT true,
    date_creation timestamp with time zone DEFAULT now(),
    statut character varying(20) DEFAULT 'PERMANENT'::character varying,
    grade character varying(20) DEFAULT NULL::character varying,
    CONSTRAINT enseignants_statut_check CHECK (((statut)::text = ANY ((ARRAY['PERMANENT'::character varying, 'VACATAIRE'::character varying])::text[])))
);


ALTER TABLE public.enseignants OWNER TO postgres;

--
-- Name: etudiants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.etudiants (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    matricule character varying(50) NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    date_naissance date,
    lieu_naissance character varying(100),
    nationalite character varying(50),
    email character varying(255),
    telephone character varying(20),
    adresse text,
    photo text,
    sexe public."Sexe"
);


ALTER TABLE public.etudiants OWNER TO postgres;

--
-- Name: COLUMN etudiants.sexe; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.etudiants.sexe IS 'Sexe de l''étudiant: M (Masculin) ou F (Féminin)';


--
-- Name: filieres; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.filieres (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    code character varying(20) NOT NULL,
    nom character varying(100) NOT NULL,
    departement_id uuid
);


ALTER TABLE public.filieres OWNER TO postgres;

--
-- Name: formations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.formations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    code character varying(20) NOT NULL,
    nom character varying(100) NOT NULL
);


ALTER TABLE public.formations OWNER TO postgres;

--
-- Name: inscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inscriptions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    etudiant_id uuid NOT NULL,
    promotion_id uuid NOT NULL,
    formation_id uuid NOT NULL,
    filiere_id uuid NOT NULL,
    niveau_id uuid NOT NULL,
    classe_id uuid,
    type_inscription public.type_inscription NOT NULL,
    statut public.statut_inscription DEFAULT 'EN_ATTENTE'::public.statut_inscription,
    date_inscription timestamp with time zone DEFAULT now(),
    date_validation timestamp with time zone,
    agent_valideur_id uuid,
    copie_releve text,
    copie_diplome text,
    copie_acte_naissance text,
    photo_identite text,
    quittance text,
    piece_identite text
);


ALTER TABLE public.inscriptions OWNER TO postgres;

--
-- Name: COLUMN inscriptions.classe_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.inscriptions.classe_id IS 'Optionnel - assigné par le chef de département après inscription';


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    expediteur_id uuid NOT NULL,
    destinataire_id uuid,
    classe_id uuid,
    type_destinataire public.type_destinataire NOT NULL,
    sujet character varying(255) NOT NULL,
    contenu text NOT NULL,
    lu boolean DEFAULT false,
    date_envoi timestamp with time zone DEFAULT now()
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: modules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.modules (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    code character varying(20) NOT NULL,
    nom character varying(100) NOT NULL,
    credit integer NOT NULL,
    semestre character varying(10) NOT NULL,
    classe_id uuid,
    departement_id uuid NOT NULL,
    actif boolean DEFAULT true,
    date_creation timestamp with time zone DEFAULT now(),
    filiere_id uuid,
    ue character varying(50) DEFAULT 'UE1'::character varying NOT NULL,
    nom_ue character varying(255)
);


ALTER TABLE public.modules OWNER TO postgres;

--
-- Name: COLUMN modules.ue; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.modules.ue IS 'Code de l''Unité d''Enseignement (ex: UE 1-1)';


--
-- Name: COLUMN modules.nom_ue; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.modules.nom_ue IS 'Nom complet de l''Unité d''Enseignement (ex: Bases de l''Informatique)';


--
-- Name: niveaux; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.niveaux (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    code character varying(10) NOT NULL,
    nom character varying(50) NOT NULL,
    ordinal character varying(10) NOT NULL
);


ALTER TABLE public.niveaux OWNER TO postgres;

--
-- Name: notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    etudiant_id uuid NOT NULL,
    inscription_id uuid,
    module_id uuid NOT NULL,
    enseignant_id uuid,
    classe_id uuid NOT NULL,
    valeur numeric(4,2) NOT NULL,
    semestre character varying(10) NOT NULL,
    annee_academique character varying(20) NOT NULL,
    date_evaluation timestamp with time zone DEFAULT now(),
    evaluation_id character varying(50)
);


ALTER TABLE public.notes OWNER TO postgres;

--
-- Name: COLUMN notes.inscription_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notes.inscription_id IS 'ID de l''inscription (optionnel, peut être déduit de etudiant_id + classe_id)';


--
-- Name: COLUMN notes.enseignant_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notes.enseignant_id IS 'ID de l''enseignant (optionnel, peut être déduit du module)';


--
-- Name: COLUMN notes.evaluation_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notes.evaluation_id IS 'Identifiant de l''évaluation au format: {id_param}_{numero}';


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    etudiant_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    titre text NOT NULL,
    message text NOT NULL,
    lien text,
    lu boolean DEFAULT false,
    date_creation timestamp with time zone DEFAULT now(),
    metadata jsonb,
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['ACADEMIQUE'::character varying, 'INSCRIPTION'::character varying, 'SYSTEME'::character varying, 'PERSONNEL'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: TABLE notifications; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.notifications IS 'Table des notifications pour les étudiants';


--
-- Name: COLUMN notifications.type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notifications.type IS 'Type de notification: ACADEMIQUE, INSCRIPTION, SYSTEME, PERSONNEL';


--
-- Name: COLUMN notifications.metadata; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notifications.metadata IS 'Données JSON additionnelles (document_type, note_id, etc.)';


--
-- Name: parametres_notation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parametres_notation (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    module_id uuid NOT NULL,
    semestre character varying(10) NOT NULL,
    evaluations jsonb NOT NULL,
    date_creation timestamp with time zone DEFAULT now(),
    date_modification timestamp with time zone DEFAULT now()
);


ALTER TABLE public.parametres_notation OWNER TO postgres;

--
-- Name: TABLE parametres_notation; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.parametres_notation IS 'Paramètres de notation pour chaque module (types d''évaluations, pondérations)';


--
-- Name: COLUMN parametres_notation.evaluations; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.parametres_notation.evaluations IS 'Configuration JSON des évaluations: [{ id, type, ponderation, nombreEvaluations }]';


--
-- Name: parents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parents (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    etudiant_id uuid NOT NULL,
    type public.type_parent NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    telephone character varying(20),
    email character varying(255),
    profession character varying(100),
    adresse text,
    date_creation timestamp with time zone DEFAULT now()
);


ALTER TABLE public.parents OWNER TO postgres;

--
-- Name: proces_verbaux; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proces_verbaux (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    promotion_id uuid NOT NULL,
    filiere_id uuid NOT NULL,
    niveau_id uuid NOT NULL,
    classe_id uuid NOT NULL,
    type_pv public.type_proces_verbal NOT NULL,
    periode public.periode_pv NOT NULL,
    annee_academique character varying(20) NOT NULL,
    statut public.statut_pv DEFAULT 'NOUVEAU'::public.statut_pv,
    date_reception timestamp with time zone,
    date_archivage timestamp with time zone,
    fichier_pv text
);


ALTER TABLE public.proces_verbaux OWNER TO postgres;

--
-- Name: promotions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promotions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    annee character varying(20) NOT NULL,
    statut public.statut_promotion DEFAULT 'EN_COURS'::public.statut_promotion,
    date_debut timestamp with time zone NOT NULL,
    date_fin timestamp with time zone
);


ALTER TABLE public.promotions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    nom character varying(100) NOT NULL,
    description text,
    route_dashboard character varying(100),
    actif boolean DEFAULT true,
    date_creation timestamp with time zone DEFAULT now()
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: statut_notes_classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.statut_notes_classes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    classe_id uuid NOT NULL,
    semestre character varying(10) NOT NULL,
    nombre_modules_avec_notes integer DEFAULT 0,
    nombre_modules_complets integer DEFAULT 0,
    nombre_etudiants_avec_notes integer DEFAULT 0,
    nombre_etudiants_complets integer DEFAULT 0,
    date_mise_a_jour timestamp with time zone DEFAULT now()
);


ALTER TABLE public.statut_notes_classes OWNER TO postgres;

--
-- Name: utilisateurs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utilisateurs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    nom character varying(100) NOT NULL,
    prenom character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    token text,
    photo text,
    telephone character varying(20),
    adresse text,
    role_id uuid NOT NULL,
    actif boolean DEFAULT true,
    date_creation timestamp with time zone DEFAULT now(),
    derniere_connexion timestamp with time zone,
    departement_id uuid,
    sexe public."Sexe"
);


ALTER TABLE public.utilisateurs OWNER TO postgres;

--
-- Name: COLUMN utilisateurs.sexe; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.utilisateurs.sexe IS 'Sexe de l''utilisateur: M (Masculin) ou F (Féminin)';


--
-- Name: v_emplois_du_temps_detailles; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_emplois_du_temps_detailles AS
 SELECT edt.id,
    edt.classe_id,
    edt.module_id,
    edt.enseignant_id,
    edt.jour,
    edt.heure_debut,
    edt.heure_fin,
    edt.salle,
    edt.semestre,
    edt.annee_academique,
    edt.date_debut,
    edt.date_fin,
    edt.type_activite,
    edt.est_recurrent,
    edt.date_specifique,
    edt.groupe_recurrence,
    c.code AS classe_code,
    c.nom AS classe_nom,
    m.code AS module_code,
    m.nom AS module_nom,
    m.credit AS module_credit,
    e.nom AS enseignant_nom,
    e.prenom AS enseignant_prenom,
    e.email AS enseignant_email
   FROM (((public.emplois_du_temps edt
     JOIN public.classes c ON ((edt.classe_id = c.id)))
     JOIN public.modules m ON ((edt.module_id = m.id)))
     JOIN public.enseignants e ON ((edt.enseignant_id = e.id)));


ALTER VIEW public.v_emplois_du_temps_detailles OWNER TO postgres;

--
-- Name: abandons abandons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abandons
    ADD CONSTRAINT abandons_pkey PRIMARY KEY (id);


--
-- Name: actions_audit actions_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actions_audit
    ADD CONSTRAINT actions_audit_pkey PRIMARY KEY (id);


--
-- Name: affectations_module_enseignant affectations_module_enseignant_module_id_enseignant_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affectations_module_enseignant
    ADD CONSTRAINT affectations_module_enseignant_module_id_enseignant_id_key UNIQUE (module_id, enseignant_id);


--
-- Name: affectations_module_enseignant affectations_module_enseignant_module_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affectations_module_enseignant
    ADD CONSTRAINT affectations_module_enseignant_module_id_unique UNIQUE (module_id);


--
-- Name: affectations_module_enseignant affectations_module_enseignant_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affectations_module_enseignant
    ADD CONSTRAINT affectations_module_enseignant_pkey PRIMARY KEY (id);


--
-- Name: attestations attestations_numero_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attestations
    ADD CONSTRAINT attestations_numero_key UNIQUE (numero);


--
-- Name: attestations attestations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attestations
    ADD CONSTRAINT attestations_pkey PRIMARY KEY (id);


--
-- Name: bulletins_generes bulletins_generes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulletins_generes
    ADD CONSTRAINT bulletins_generes_pkey PRIMARY KEY (id);


--
-- Name: bulletins bulletins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulletins
    ADD CONSTRAINT bulletins_pkey PRIMARY KEY (id);


--
-- Name: candidats_admis candidats_admis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidats_admis
    ADD CONSTRAINT candidats_admis_pkey PRIMARY KEY (id);


--
-- Name: classes classes_code_filiere_id_niveau_id_formation_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_code_filiere_id_niveau_id_formation_id_key UNIQUE (code, filiere_id, niveau_id, formation_id);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: departements departements_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departements
    ADD CONSTRAINT departements_code_key UNIQUE (code);


--
-- Name: departements departements_nom_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departements
    ADD CONSTRAINT departements_nom_key UNIQUE (nom);


--
-- Name: departements departements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departements
    ADD CONSTRAINT departements_pkey PRIMARY KEY (id);


--
-- Name: diplomes diplomes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diplomes
    ADD CONSTRAINT diplomes_pkey PRIMARY KEY (id);


--
-- Name: emplois_du_temps emplois_du_temps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emplois_du_temps
    ADD CONSTRAINT emplois_du_temps_pkey PRIMARY KEY (id);


--
-- Name: enseignants enseignants_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enseignants
    ADD CONSTRAINT enseignants_email_key UNIQUE (email);


--
-- Name: enseignants enseignants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enseignants
    ADD CONSTRAINT enseignants_pkey PRIMARY KEY (id);


--
-- Name: etudiants etudiants_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etudiants
    ADD CONSTRAINT etudiants_email_key UNIQUE (email);


--
-- Name: etudiants etudiants_matricule_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etudiants
    ADD CONSTRAINT etudiants_matricule_key UNIQUE (matricule);


--
-- Name: etudiants etudiants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.etudiants
    ADD CONSTRAINT etudiants_pkey PRIMARY KEY (id);


--
-- Name: filieres filieres_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.filieres
    ADD CONSTRAINT filieres_code_key UNIQUE (code);


--
-- Name: filieres filieres_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.filieres
    ADD CONSTRAINT filieres_pkey PRIMARY KEY (id);


--
-- Name: formations formations_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formations
    ADD CONSTRAINT formations_code_key UNIQUE (code);


--
-- Name: formations formations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formations
    ADD CONSTRAINT formations_pkey PRIMARY KEY (id);


--
-- Name: inscriptions inscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: modules modules_code_filiere_semestre_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_code_filiere_semestre_unique UNIQUE (code, filiere_id, semestre);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: niveaux niveaux_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.niveaux
    ADD CONSTRAINT niveaux_code_key UNIQUE (code);


--
-- Name: niveaux niveaux_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.niveaux
    ADD CONSTRAINT niveaux_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: parametres_notation parametres_notation_module_id_semestre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parametres_notation
    ADD CONSTRAINT parametres_notation_module_id_semestre_key UNIQUE (module_id, semestre);


--
-- Name: parametres_notation parametres_notation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parametres_notation
    ADD CONSTRAINT parametres_notation_pkey PRIMARY KEY (id);


--
-- Name: parents parents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parents
    ADD CONSTRAINT parents_pkey PRIMARY KEY (id);


--
-- Name: proces_verbaux proces_verbaux_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proces_verbaux
    ADD CONSTRAINT proces_verbaux_pkey PRIMARY KEY (id);


--
-- Name: promotions promotions_annee_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_annee_key UNIQUE (annee);


--
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_code_key UNIQUE (code);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: statut_notes_classes statut_notes_classes_classe_id_semestre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statut_notes_classes
    ADD CONSTRAINT statut_notes_classes_classe_id_semestre_key UNIQUE (classe_id, semestre);


--
-- Name: statut_notes_classes statut_notes_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statut_notes_classes
    ADD CONSTRAINT statut_notes_classes_pkey PRIMARY KEY (id);


--
-- Name: utilisateurs utilisateurs_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT utilisateurs_email_key UNIQUE (email);


--
-- Name: utilisateurs utilisateurs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT utilisateurs_pkey PRIMARY KEY (id);


--
-- Name: utilisateurs utilisateurs_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT utilisateurs_username_key UNIQUE (username);


--
-- Name: bulletins_generes_departementId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bulletins_generes_departementId_idx" ON public.bulletins_generes USING btree ("departementId");


--
-- Name: bulletins_generes_statut_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bulletins_generes_statut_idx ON public.bulletins_generes USING btree (statut);


--
-- Name: idx_abandons_etudiant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_abandons_etudiant ON public.abandons USING btree (etudiant_id);


--
-- Name: idx_attestations_etudiant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attestations_etudiant ON public.attestations USING btree (etudiant_id);


--
-- Name: idx_attestations_promotion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attestations_promotion ON public.attestations USING btree (promotion_id);


--
-- Name: idx_audit_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_date ON public.actions_audit USING btree (date_action);


--
-- Name: idx_audit_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_type ON public.actions_audit USING btree (type_action);


--
-- Name: idx_audit_utilisateur; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_utilisateur ON public.actions_audit USING btree (utilisateur_id);


--
-- Name: idx_bulletins_classe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bulletins_classe ON public.bulletins USING btree (classe_id);


--
-- Name: idx_bulletins_date_generation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bulletins_date_generation ON public.bulletins USING btree (date_generation);


--
-- Name: idx_bulletins_etudiant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bulletins_etudiant ON public.bulletins USING btree (etudiant_id);


--
-- Name: idx_bulletins_statut_visa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bulletins_statut_visa ON public.bulletins USING btree (statut_visa);


--
-- Name: idx_classes_filiere; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_classes_filiere ON public.classes USING btree (filiere_id);


--
-- Name: idx_classes_niveau; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_classes_niveau ON public.classes USING btree (niveau_id);


--
-- Name: idx_diplomes_classe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_diplomes_classe ON public.diplomes USING btree (classe_id);


--
-- Name: idx_diplomes_etudiant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_diplomes_etudiant ON public.diplomes USING btree (etudiant_id);


--
-- Name: idx_emplois_classe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emplois_classe ON public.emplois_du_temps USING btree (classe_id);


--
-- Name: idx_emplois_du_temps_date_specifique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emplois_du_temps_date_specifique ON public.emplois_du_temps USING btree (date_specifique) WHERE (date_specifique IS NOT NULL);


--
-- Name: idx_emplois_du_temps_groupe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emplois_du_temps_groupe ON public.emplois_du_temps USING btree (groupe_recurrence);


--
-- Name: idx_emplois_du_temps_periode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emplois_du_temps_periode ON public.emplois_du_temps USING btree (classe_id, date_debut, date_fin);


--
-- Name: idx_enseignants_departement; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enseignants_departement ON public.enseignants USING btree (departement_id);


--
-- Name: idx_enseignants_grade; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enseignants_grade ON public.enseignants USING btree (grade);


--
-- Name: idx_enseignants_statut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enseignants_statut ON public.enseignants USING btree (statut);


--
-- Name: idx_etudiants_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_etudiants_email ON public.etudiants USING btree (email);


--
-- Name: idx_etudiants_matricule; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_etudiants_matricule ON public.etudiants USING btree (matricule);


--
-- Name: idx_inscriptions_classe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inscriptions_classe ON public.inscriptions USING btree (classe_id);


--
-- Name: idx_inscriptions_etudiant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inscriptions_etudiant ON public.inscriptions USING btree (etudiant_id);


--
-- Name: idx_inscriptions_promotion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inscriptions_promotion ON public.inscriptions USING btree (promotion_id);


--
-- Name: idx_inscriptions_statut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inscriptions_statut ON public.inscriptions USING btree (statut);


--
-- Name: idx_messages_destinataire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_destinataire ON public.messages USING btree (destinataire_id);


--
-- Name: idx_messages_expediteur; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_expediteur ON public.messages USING btree (expediteur_id);


--
-- Name: idx_modules_classe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_modules_classe ON public.modules USING btree (classe_id);


--
-- Name: idx_modules_departement; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_modules_departement ON public.modules USING btree (departement_id);


--
-- Name: idx_modules_filiere; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_modules_filiere ON public.modules USING btree (filiere_id);


--
-- Name: idx_modules_ue; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_modules_ue ON public.modules USING btree (ue);


--
-- Name: idx_notes_annee_academique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notes_annee_academique ON public.notes USING btree (annee_academique);


--
-- Name: idx_notes_classe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notes_classe ON public.notes USING btree (classe_id);


--
-- Name: idx_notes_etudiant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notes_etudiant ON public.notes USING btree (etudiant_id);


--
-- Name: idx_notes_evaluation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notes_evaluation ON public.notes USING btree (evaluation_id);


--
-- Name: idx_notes_module; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notes_module ON public.notes USING btree (module_id);


--
-- Name: idx_notes_module_classe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notes_module_classe ON public.notes USING btree (module_id, classe_id);


--
-- Name: idx_notes_semestre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notes_semestre ON public.notes USING btree (semestre);


--
-- Name: idx_notifications_date_creation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_date_creation ON public.notifications USING btree (date_creation DESC);


--
-- Name: idx_notifications_etudiant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_etudiant_id ON public.notifications USING btree (etudiant_id);


--
-- Name: idx_notifications_etudiant_lu; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_etudiant_lu ON public.notifications USING btree (etudiant_id, lu);


--
-- Name: idx_notifications_lu; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_lu ON public.notifications USING btree (lu);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_parametres_notation_module; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_parametres_notation_module ON public.parametres_notation USING btree (module_id);


--
-- Name: idx_parametres_notation_semestre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_parametres_notation_semestre ON public.parametres_notation USING btree (semestre);


--
-- Name: idx_parents_etudiant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_parents_etudiant ON public.parents USING btree (etudiant_id);


--
-- Name: idx_pv_classe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pv_classe ON public.proces_verbaux USING btree (classe_id);


--
-- Name: idx_pv_promotion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pv_promotion ON public.proces_verbaux USING btree (promotion_id);


--
-- Name: idx_statut_notes_classe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_statut_notes_classe ON public.statut_notes_classes USING btree (classe_id);


--
-- Name: idx_statut_notes_classe_semestre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_statut_notes_classe_semestre ON public.statut_notes_classes USING btree (classe_id, semestre);


--
-- Name: idx_statut_notes_semestre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_statut_notes_semestre ON public.statut_notes_classes USING btree (semestre);


--
-- Name: idx_utilisateurs_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utilisateurs_email ON public.utilisateurs USING btree (email);


--
-- Name: idx_utilisateurs_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utilisateurs_role_id ON public.utilisateurs USING btree (role_id);


--
-- Name: idx_utilisateurs_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_utilisateurs_username ON public.utilisateurs USING btree (username);


--
-- Name: parametres_notation update_parametres_notation_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_parametres_notation_modtime BEFORE UPDATE ON public.parametres_notation FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: statut_notes_classes update_statut_notes_timestamp_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_statut_notes_timestamp_trigger BEFORE UPDATE ON public.statut_notes_classes FOR EACH ROW EXECUTE FUNCTION public.update_statut_notes_timestamp();


--
-- Name: abandons abandons_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abandons
    ADD CONSTRAINT abandons_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON DELETE CASCADE;


--
-- Name: abandons abandons_filiere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abandons
    ADD CONSTRAINT abandons_filiere_id_fkey FOREIGN KEY (filiere_id) REFERENCES public.filieres(id) ON DELETE CASCADE;


--
-- Name: abandons abandons_niveau_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abandons
    ADD CONSTRAINT abandons_niveau_id_fkey FOREIGN KEY (niveau_id) REFERENCES public.niveaux(id) ON DELETE CASCADE;


--
-- Name: abandons abandons_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.abandons
    ADD CONSTRAINT abandons_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE CASCADE;


--
-- Name: actions_audit actions_audit_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actions_audit
    ADD CONSTRAINT actions_audit_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: affectations_module_enseignant affectations_module_enseignant_enseignant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affectations_module_enseignant
    ADD CONSTRAINT affectations_module_enseignant_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES public.enseignants(id) ON DELETE CASCADE;


--
-- Name: affectations_module_enseignant affectations_module_enseignant_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.affectations_module_enseignant
    ADD CONSTRAINT affectations_module_enseignant_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: attestations attestations_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attestations
    ADD CONSTRAINT attestations_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON DELETE CASCADE;


--
-- Name: attestations attestations_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attestations
    ADD CONSTRAINT attestations_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE CASCADE;


--
-- Name: bulletins bulletins_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulletins
    ADD CONSTRAINT bulletins_classe_id_fkey FOREIGN KEY (classe_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: bulletins bulletins_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulletins
    ADD CONSTRAINT bulletins_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON DELETE CASCADE;


--
-- Name: bulletins bulletins_genere_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulletins
    ADD CONSTRAINT bulletins_genere_par_fkey FOREIGN KEY (genere_par) REFERENCES public.utilisateurs(id);


--
-- Name: bulletins_generes bulletins_generes_chefDepartementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulletins_generes
    ADD CONSTRAINT "bulletins_generes_chefDepartementId_fkey" FOREIGN KEY ("chefDepartementId") REFERENCES public.utilisateurs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bulletins_generes bulletins_generes_classeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulletins_generes
    ADD CONSTRAINT "bulletins_generes_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES public.classes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bulletins_generes bulletins_generes_depId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulletins_generes
    ADD CONSTRAINT "bulletins_generes_depId_fkey" FOREIGN KEY ("depId") REFERENCES public.utilisateurs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bulletins_generes bulletins_generes_departementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulletins_generes
    ADD CONSTRAINT "bulletins_generes_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES public.departements(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bulletins bulletins_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bulletins
    ADD CONSTRAINT bulletins_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE CASCADE;


--
-- Name: classes classes_filiere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_filiere_id_fkey FOREIGN KEY (filiere_id) REFERENCES public.filieres(id) ON DELETE CASCADE;


--
-- Name: classes classes_formation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_formation_id_fkey FOREIGN KEY (formation_id) REFERENCES public.formations(id) ON DELETE CASCADE;


--
-- Name: classes classes_niveau_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_niveau_id_fkey FOREIGN KEY (niveau_id) REFERENCES public.niveaux(id) ON DELETE CASCADE;


--
-- Name: diplomes diplomes_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diplomes
    ADD CONSTRAINT diplomes_classe_id_fkey FOREIGN KEY (classe_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: diplomes diplomes_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diplomes
    ADD CONSTRAINT diplomes_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON DELETE CASCADE;


--
-- Name: diplomes diplomes_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.diplomes
    ADD CONSTRAINT diplomes_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE CASCADE;


--
-- Name: emplois_du_temps emplois_du_temps_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emplois_du_temps
    ADD CONSTRAINT emplois_du_temps_classe_id_fkey FOREIGN KEY (classe_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: emplois_du_temps emplois_du_temps_enseignant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emplois_du_temps
    ADD CONSTRAINT emplois_du_temps_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES public.enseignants(id) ON DELETE CASCADE;


--
-- Name: emplois_du_temps emplois_du_temps_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emplois_du_temps
    ADD CONSTRAINT emplois_du_temps_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: enseignants enseignants_departement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enseignants
    ADD CONSTRAINT enseignants_departement_id_fkey FOREIGN KEY (departement_id) REFERENCES public.departements(id) ON DELETE CASCADE;


--
-- Name: filieres filieres_departement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.filieres
    ADD CONSTRAINT filieres_departement_id_fkey FOREIGN KEY (departement_id) REFERENCES public.departements(id) ON DELETE SET NULL;


--
-- Name: inscriptions inscriptions_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_classe_id_fkey FOREIGN KEY (classe_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: inscriptions inscriptions_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON DELETE CASCADE;


--
-- Name: inscriptions inscriptions_filiere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_filiere_id_fkey FOREIGN KEY (filiere_id) REFERENCES public.filieres(id) ON DELETE CASCADE;


--
-- Name: inscriptions inscriptions_formation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_formation_id_fkey FOREIGN KEY (formation_id) REFERENCES public.formations(id) ON DELETE CASCADE;


--
-- Name: inscriptions inscriptions_niveau_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_niveau_id_fkey FOREIGN KEY (niveau_id) REFERENCES public.niveaux(id) ON DELETE CASCADE;


--
-- Name: inscriptions inscriptions_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE CASCADE;


--
-- Name: messages messages_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_classe_id_fkey FOREIGN KEY (classe_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: messages messages_destinataire_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_destinataire_id_fkey FOREIGN KEY (destinataire_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: messages messages_expediteur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_expediteur_id_fkey FOREIGN KEY (expediteur_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: modules modules_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_classe_id_fkey FOREIGN KEY (classe_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: modules modules_departement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_departement_id_fkey FOREIGN KEY (departement_id) REFERENCES public.departements(id) ON DELETE CASCADE;


--
-- Name: modules modules_filiere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_filiere_id_fkey FOREIGN KEY (filiere_id) REFERENCES public.filieres(id) ON DELETE CASCADE;


--
-- Name: notes notes_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_classe_id_fkey FOREIGN KEY (classe_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: notes notes_enseignant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES public.enseignants(id) ON DELETE CASCADE;


--
-- Name: notes notes_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON DELETE CASCADE;


--
-- Name: notes notes_inscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_inscription_id_fkey FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id) ON DELETE CASCADE;


--
-- Name: notes notes_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON DELETE CASCADE;


--
-- Name: parametres_notation parametres_notation_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parametres_notation
    ADD CONSTRAINT parametres_notation_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: parents parents_etudiant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parents
    ADD CONSTRAINT parents_etudiant_id_fkey FOREIGN KEY (etudiant_id) REFERENCES public.etudiants(id) ON DELETE CASCADE;


--
-- Name: proces_verbaux proces_verbaux_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proces_verbaux
    ADD CONSTRAINT proces_verbaux_classe_id_fkey FOREIGN KEY (classe_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: proces_verbaux proces_verbaux_filiere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proces_verbaux
    ADD CONSTRAINT proces_verbaux_filiere_id_fkey FOREIGN KEY (filiere_id) REFERENCES public.filieres(id) ON DELETE CASCADE;


--
-- Name: proces_verbaux proces_verbaux_niveau_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proces_verbaux
    ADD CONSTRAINT proces_verbaux_niveau_id_fkey FOREIGN KEY (niveau_id) REFERENCES public.niveaux(id) ON DELETE CASCADE;


--
-- Name: proces_verbaux proces_verbaux_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proces_verbaux
    ADD CONSTRAINT proces_verbaux_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE CASCADE;


--
-- Name: statut_notes_classes statut_notes_classes_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statut_notes_classes
    ADD CONSTRAINT statut_notes_classes_classe_id_fkey FOREIGN KEY (classe_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: utilisateurs utilisateurs_departement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT utilisateurs_departement_id_fkey FOREIGN KEY (departement_id) REFERENCES public.departements(id) ON DELETE SET NULL;


--
-- Name: utilisateurs utilisateurs_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT utilisateurs_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: utilisateurs Service role a accès complet aux utilisateurs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service role a accès complet aux utilisateurs" ON public.utilisateurs USING (true);


--
-- Name: departements Utilisateurs authentifiés peuvent lire les départements; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Utilisateurs authentifiés peuvent lire les départements" ON public.departements FOR SELECT USING (true);


--
-- Name: roles Utilisateurs authentifiés peuvent lire les rôles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Utilisateurs authentifiés peuvent lire les rôles" ON public.roles FOR SELECT USING (true);


--
-- Name: actions_audit; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.actions_audit ENABLE ROW LEVEL SECURITY;

--
-- Name: attestations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.attestations ENABLE ROW LEVEL SECURITY;

--
-- Name: bulletins; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.bulletins ENABLE ROW LEVEL SECURITY;

--
-- Name: departements; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.departements ENABLE ROW LEVEL SECURITY;

--
-- Name: diplomes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.diplomes ENABLE ROW LEVEL SECURITY;

--
-- Name: etudiants; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.etudiants ENABLE ROW LEVEL SECURITY;

--
-- Name: inscriptions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: notes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: utilisateurs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.utilisateurs ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION get_dates_for_weekday(p_jour text, p_date_debut date, p_date_fin date); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_dates_for_weekday(p_jour text, p_date_debut date, p_date_fin date) TO anon;
GRANT ALL ON FUNCTION public.get_dates_for_weekday(p_jour text, p_date_debut date, p_date_fin date) TO authenticated;
GRANT ALL ON FUNCTION public.get_dates_for_weekday(p_jour text, p_date_debut date, p_date_fin date) TO service_role;


--
-- Name: FUNCTION update_modified_column(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_modified_column() TO anon;
GRANT ALL ON FUNCTION public.update_modified_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_modified_column() TO service_role;


--
-- Name: FUNCTION update_statut_notes_timestamp(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_statut_notes_timestamp() TO anon;
GRANT ALL ON FUNCTION public.update_statut_notes_timestamp() TO authenticated;
GRANT ALL ON FUNCTION public.update_statut_notes_timestamp() TO service_role;


--
-- Name: TABLE abandons; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.abandons TO anon;
GRANT ALL ON TABLE public.abandons TO authenticated;
GRANT ALL ON TABLE public.abandons TO service_role;


--
-- Name: TABLE actions_audit; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.actions_audit TO anon;
GRANT ALL ON TABLE public.actions_audit TO authenticated;
GRANT ALL ON TABLE public.actions_audit TO service_role;


--
-- Name: TABLE affectations_module_enseignant; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.affectations_module_enseignant TO anon;
GRANT ALL ON TABLE public.affectations_module_enseignant TO authenticated;
GRANT ALL ON TABLE public.affectations_module_enseignant TO service_role;


--
-- Name: TABLE attestations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.attestations TO anon;
GRANT ALL ON TABLE public.attestations TO authenticated;
GRANT ALL ON TABLE public.attestations TO service_role;


--
-- Name: TABLE bulletins; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.bulletins TO anon;
GRANT ALL ON TABLE public.bulletins TO authenticated;
GRANT ALL ON TABLE public.bulletins TO service_role;


--
-- Name: TABLE bulletins_generes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.bulletins_generes TO anon;
GRANT ALL ON TABLE public.bulletins_generes TO authenticated;
GRANT ALL ON TABLE public.bulletins_generes TO service_role;


--
-- Name: TABLE candidats_admis; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.candidats_admis TO anon;
GRANT ALL ON TABLE public.candidats_admis TO authenticated;
GRANT ALL ON TABLE public.candidats_admis TO service_role;


--
-- Name: TABLE classes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.classes TO anon;
GRANT ALL ON TABLE public.classes TO authenticated;
GRANT ALL ON TABLE public.classes TO service_role;


--
-- Name: TABLE departements; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.departements TO anon;
GRANT ALL ON TABLE public.departements TO authenticated;
GRANT ALL ON TABLE public.departements TO service_role;


--
-- Name: TABLE diplomes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.diplomes TO anon;
GRANT ALL ON TABLE public.diplomes TO authenticated;
GRANT ALL ON TABLE public.diplomes TO service_role;


--
-- Name: TABLE emplois_du_temps; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.emplois_du_temps TO anon;
GRANT ALL ON TABLE public.emplois_du_temps TO authenticated;
GRANT ALL ON TABLE public.emplois_du_temps TO service_role;


--
-- Name: TABLE enseignants; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.enseignants TO anon;
GRANT ALL ON TABLE public.enseignants TO authenticated;
GRANT ALL ON TABLE public.enseignants TO service_role;


--
-- Name: TABLE etudiants; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.etudiants TO anon;
GRANT ALL ON TABLE public.etudiants TO authenticated;
GRANT ALL ON TABLE public.etudiants TO service_role;


--
-- Name: TABLE filieres; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.filieres TO anon;
GRANT ALL ON TABLE public.filieres TO authenticated;
GRANT ALL ON TABLE public.filieres TO service_role;


--
-- Name: TABLE formations; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.formations TO anon;
GRANT ALL ON TABLE public.formations TO authenticated;
GRANT ALL ON TABLE public.formations TO service_role;


--
-- Name: TABLE inscriptions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.inscriptions TO anon;
GRANT ALL ON TABLE public.inscriptions TO authenticated;
GRANT ALL ON TABLE public.inscriptions TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.messages TO anon;
GRANT ALL ON TABLE public.messages TO authenticated;
GRANT ALL ON TABLE public.messages TO service_role;


--
-- Name: TABLE modules; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.modules TO anon;
GRANT ALL ON TABLE public.modules TO authenticated;
GRANT ALL ON TABLE public.modules TO service_role;


--
-- Name: TABLE niveaux; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.niveaux TO anon;
GRANT ALL ON TABLE public.niveaux TO authenticated;
GRANT ALL ON TABLE public.niveaux TO service_role;


--
-- Name: TABLE notes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notes TO anon;
GRANT ALL ON TABLE public.notes TO authenticated;
GRANT ALL ON TABLE public.notes TO service_role;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;


--
-- Name: TABLE parametres_notation; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.parametres_notation TO anon;
GRANT ALL ON TABLE public.parametres_notation TO authenticated;
GRANT ALL ON TABLE public.parametres_notation TO service_role;


--
-- Name: TABLE parents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.parents TO anon;
GRANT ALL ON TABLE public.parents TO authenticated;
GRANT ALL ON TABLE public.parents TO service_role;


--
-- Name: TABLE proces_verbaux; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.proces_verbaux TO anon;
GRANT ALL ON TABLE public.proces_verbaux TO authenticated;
GRANT ALL ON TABLE public.proces_verbaux TO service_role;


--
-- Name: TABLE promotions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.promotions TO anon;
GRANT ALL ON TABLE public.promotions TO authenticated;
GRANT ALL ON TABLE public.promotions TO service_role;


--
-- Name: TABLE roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.roles TO anon;
GRANT ALL ON TABLE public.roles TO authenticated;
GRANT ALL ON TABLE public.roles TO service_role;


--
-- Name: TABLE statut_notes_classes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.statut_notes_classes TO anon;
GRANT ALL ON TABLE public.statut_notes_classes TO authenticated;
GRANT ALL ON TABLE public.statut_notes_classes TO service_role;


--
-- Name: TABLE utilisateurs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.utilisateurs TO anon;
GRANT ALL ON TABLE public.utilisateurs TO authenticated;
GRANT ALL ON TABLE public.utilisateurs TO service_role;


--
-- Name: TABLE v_emplois_du_temps_detailles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.v_emplois_du_temps_detailles TO anon;
GRANT ALL ON TABLE public.v_emplois_du_temps_detailles TO authenticated;
GRANT ALL ON TABLE public.v_emplois_du_temps_detailles TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict qFAiIVoVF7Qyae3jV5GVTAQ7fnT0GjVBxiciwzgLTJgj968k7IgeOxLvLe5Ip8P

