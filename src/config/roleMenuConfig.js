import {
    faHome,
    faFileAlt,
    faArchive,
    faEnvelope,
    faUser,
    faCog,
    faChartLine,
    faUserPlus,
    faUsers,
    faClipboardList,
    faBook,
    faCalendarAlt,
    faGraduationCap,
    faBell,
    faBuilding,
    faChalkboardTeacher,
    faUserTie,
    faFileContract,
    faHistory,
    faShieldAlt,
    faLock
} from '@fortawesome/free-solid-svg-icons'

/**
 * Configuration des menus par rôle
 * Chaque rôle a son propre ensemble de liens de navigation
 */
export const ROLE_MENUS = {
    // Directeur Général
    DG: [
        { path: '/dg/dashboard', icon: faHome, label: 'Tableau de bord' },
        { path: '/dg/statistiques', icon: faChartLine, label: 'Statistiques' },
        { path: '/dg/rapports', icon: faFileAlt, label: 'Rapports' },
        { path: '/dg/audit', icon: faHistory, label: 'Audit' },
        { path: '/admin/profil', icon: faUser, label: 'Profil' },
        { path: '/admin/parametres', icon: faCog, label: 'Paramètres' },
    ],

    // Directeur des Études et de la Pédagogie
    DEP: [
        { path: '/dep/dashboard', icon: faHome, label: 'Tableau de bord' },
        { path: '/dep/chefs-departement', icon: faUserTie, label: 'Chefs de Département' },
        { path: '/dep/departements', icon: faBuilding, label: 'Départements' },
        // Conseils de Classes : Section cruciale pour le Directeur des Études Pédagogiques
        // Permet de gérer, consulter et valider les conseils de classe de tous les départements.
        // Fonctionnalités : consultation des conseils par classe/département, suivi des statuts (en attente/validé),
        // validation et envoi des résultats des conseils, consultation des décisions prises (admissions, redoublements, exclusions),
        // suivi du nombre d'étudiants concernés par chaque conseil.
        // { path: '/dep/conseils', icon: faUsers, label: 'Conseils de Classes' },
        { path: '/dep/visas', icon: faFileContract, label: 'Visas & Documents' },
        // Procès-Verbaux : Section essentielle pour la traçabilité administrative
        // Permet la génération, la consultation et la gestion de tous les procès-verbaux officiels.
        // Fonctionnalités : création de PV pour conseils de classe, réunions pédagogiques, réunions départementales,
        // génération automatique de documents PDF, archivage et recherche de PV par type/date/classe/département,
        // suivi des statuts (brouillon/généré), téléchargement et consultation des PV validés.
        // { path: '/dep/proces-verbaux', icon: faClipboardList, label: 'Procès-Verbaux' },
        // Rapports : Section dédiée à la génération et consultation de rapports analytiques
        // Permet au Directeur d'accéder à des synthèses périodiques sur l'activité académique.
        // Fonctionnalités : génération de rapports mensuels, annuels et pédagogiques, rapports de performance académique,
        // rapports statistiques par département/classe, rapports de fréquentation, synthèses des résultats étudiants,
        // export en PDF/Excel, historique des rapports générés, filtrage par période et type de rapport.
        // { path: '/dep/rapports', icon: faFileAlt, label: 'Rapports' },
        { path: '/dep/statistiques', icon: faChartLine, label: 'Statistiques' },
        { path: '/dep/etudiants', icon: faGraduationCap, label: 'Étudiants' },
        { path: '/dep/meilleurs-etudiants', icon: faGraduationCap, label: 'Meilleurs Étudiants' },
        // Messagerie : Centre de communication interne de l'application
        // Permet au Directeur de communiquer efficacement avec tous les acteurs de l'institution.
        // Fonctionnalités : envoi de messages individuels (à un étudiant, chef de département, enseignant),
        // envoi de messages de groupe (à une classe, un département, une filière),
        // envoi de messages collectifs (à tous les étudiants d'une formation),
        // filtrage par formation (Initial 1, Initial 2), filière (RT, GI, MTIC, AV), classe et niveau,
        // suivi des messages envoyés, historique des communications, notifications de réception.
        // { path: '/dep/messagerie', icon: faEnvelope, label: 'Messagerie' },
        { path: '/admin/profil', icon: faUser, label: 'Profil' },
        { path: '/admin/parametres', icon: faCog, label: 'Paramètres' },
    ],

    // Chef de Service Scolarité
    CHEF_SERVICE_SCOLARITE: [
        { path: '/chef-scolarite/dashboard', icon: faHome, label: 'Tableau de bord' },
        { path: '/chef-scolarite/gestion-comptes', icon: faUsers, label: 'Gestion des comptes' },
        { path: '/chef-scolarite/statistiques', icon: faChartLine, label: 'Statistiques' },
        { path: '/chef-scolarite/importer-candidats', icon: faUserPlus, label: 'Importer candidats' },
        { path: '/chef-scolarite/inscriptions', icon: faClipboardList, label: 'Gérer inscriptions' },
        { path: '/chef-scolarite/attestations', icon: faFileAlt, label: 'Attestations' },
        { path: '/chef-scolarite/archives-attestations', icon: faArchive, label: 'Archives attestations' },
        { path: '/chef-scolarite/bulletins', icon: faClipboardList, label: 'Bulletins' },
        { path: '/chef-scolarite/diplomes', icon: faGraduationCap, label: 'Diplômes' },
        { path: '/admin/profil', icon: faUser, label: 'Profil' },
        { path: '/admin/parametres', icon: faCog, label: 'Paramètres' },
    ],

    // Agent Scolarité
    AGENT_SCOLARITE: [
        { path: '/scolarite/dashboard', icon: faHome, label: 'Tableau de bord' },
        { path: '/scolarite/inscriptions', icon: faUserPlus, label: 'Gérer les inscriptions' },
        { path: '/scolarite/importer-candidats', icon: faUserPlus, label: 'Importer candidats' },
        // { path: '/scolarite/attestations', icon: faFileAlt, label: 'Attestations' },
        { path: '/scolarite/archives-attestations', icon: faArchive, label: 'Archives attestations' },
        { path: '/scolarite/bulletins', icon: faClipboardList, label: 'Bulletins' },
        // { path: '/scolarite/diplomes', icon: faGraduationCap, label: 'Diplômes' },
        // { path: '/scolarite/proces-verbaux', icon: faFileContract, label: 'Procès-verbaux' },
        // { path: '/scolarite/messagerie', icon: faEnvelope, label: 'Messagerie' },
        { path: '/admin/profil', icon: faUser, label: 'Profil' },
        { path: '/admin/parametres', icon: faCog, label: 'Paramètres' },
    ],

    // SP Scolarité (Secrétaire Particulière)
    SP_SCOLARITE: [
        { path: '/sp-scolarite/dashboard', icon: faHome, label: 'Tableau de bord' },
        { path: '/sp-scolarite/attestations', icon: faFileAlt, label: 'Attestations de scolarité' },
        { path: '/sp-scolarite/archives', icon: faArchive, label: 'Archives des attestations' },
        { path: '/sp-scolarite/messagerie', icon: faEnvelope, label: 'Messagerie interne' },
        { path: '/admin/profil', icon: faUser, label: 'Profil' },
        { path: '/admin/parametres', icon: faCog, label: 'Paramètres' },
    ],

    // Chef de Département
    CHEF_DEPARTEMENT: [
        { path: '/chef/dashboard', icon: faHome, label: 'Tableau de bord' },
        { path: '/chef/enseignants', icon: faChalkboardTeacher, label: 'Enseignants' },
        { path: '/chef/modules', icon: faBook, label: 'Modules' },
        { path: '/chef/emplois-du-temps', icon: faCalendarAlt, label: 'Emplois du temps' },
        { path: '/chef/notes', icon: faGraduationCap, label: 'Notes' },
        { path: '/chef/classes', icon: faBuilding, label: 'Classes' },
        { path: '/chef/repartition', icon: faUsers, label: 'Répartition' },
        { path: '/chef/releves', icon: faFileAlt, label: 'Relevé de notes' },
        { path: '/chef/bulletins', icon: faClipboardList, label: 'Bulletins' },
        { path: '/chef/planches', icon: faUsers, label: 'Planches' },
        { path: '/chef/statistiques', icon: faChartLine, label: 'Statistiques' },
        { path: '/admin/profil', icon: faUser, label: 'Profil' },
        { path: '/admin/parametres', icon: faCog, label: 'Paramètres' },
    ],

    // Administrateur Système
    ADMIN_SYSTEME: [
        { path: '/admin-systeme/dashboard', icon: faHome, label: 'Tableau de bord' },
        { path: '/admin-systeme/etudiants/credentials', icon: faShieldAlt, label: 'Identifiants Étudiants' },
        { path: '/admin-systeme/audit', icon: faHistory, label: 'Audit du Système' },
        { path: '/admin-systeme/maintenance', icon: faCog, label: 'Maintenance' },
        { path: '/admin/profil', icon: faUser, label: 'Profil' },
        { path: '/admin/parametres', icon: faCog, label: 'Paramètres' },
    ],
}

/**
 * Récupère le menu pour un rôle donné
 * @param {string} roleCode - Code du rôle (ex: 'DG', 'DEP', 'SP_SCOLARITE')
 * @returns {Array} - Liste des items de menu pour ce rôle
 */
export const getRoleMenu = (roleCode) => {
    return ROLE_MENUS[roleCode] || []
}

/**
 * Récupère le titre du dashboard pour un rôle donné
 * @param {string} roleCode - Code du rôle
 * @param {string} roleName - Nom complet du rôle
 * @returns {string} - Titre du dashboard
 */
export const getRoleDashboardTitle = (roleCode, roleName) => {
    const titles = {
        DG: 'Direction Générale',
        DEP: 'Direction des Études et de la Pédagogie',
        CHEF_SERVICE_SCOLARITE: 'Chef de Service Scolarité',
        AGENT_SCOLARITE: 'Service Scolarité',
        SP_SCOLARITE: 'Secrétaire Particulière - Direction de la Scolarité',
        CHEF_DEPARTEMENT: 'Chef de Département',
        ADMIN_SYSTEME: 'Administration Système',
    }

    return titles[roleCode] || roleName || 'Dashboard'
}
