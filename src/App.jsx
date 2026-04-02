import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { initNavigation } from './utils/navigation'
import ProtectedRoute from './components/common/ProtectedRoute'
import ErrorBoundary from './components/common/ErrorBoundary'
import LoadingSpinner from './components/common/LoadingSpinner'

// Composant pour initialiser la navigation
const NavigationInit = () => {
  const navigate = useNavigate()

  useEffect(() => {
    initNavigation(navigate)
  }, [navigate])

  return null
}

// Lazy loading des composants pour améliorer les performances
// Formulaires de connexion
const LoginView = lazy(() => import('./views/LoginView'))
const LoginStudentView = lazy(() => import('./views/student/LoginStudentView'))

// Routes Étudiant
const DashboardView = lazy(() => import('./views/student/DashboardView'))
const EmploiDuTempsView = lazy(() => import('./views/student/EmploiDuTempsView'))
const NotesView = lazy(() => import('./views/student/NotesView'))
const DocumentsView = lazy(() => import('./views/student/DocumentsView'))
const ProfileView = lazy(() => import('./views/student/ProfileView'))
const NotificationsView = lazy(() => import('./views/student/NotificationsView'))
const ReclamationsView = lazy(() => import('./views/student/ReclamationsView'))
const AideView = lazy(() => import('./views/student/AideView'))
const MonDossierView = lazy(() => import('./views/student/MonDossierView'))

// Routes Chef de Département
const DashboardChefView = lazy(() => import('./views/chef/DashboardChefView'))
const ClassesChefDepartementView = lazy(() => import('./views/chef-departement/ClassesView'))
const ModulesChefDepartementView = lazy(() => import('./views/chef-departement/ModulesView'))
const EnseignantsChefDepartementView = lazy(() => import('./views/chef-departement/EnseignantsView'))
const EtudiantsInscritsView = lazy(() => import('./views/chef-departement/EtudiantsInscritsView'))
const RepartitionClasseView = lazy(() => import('./views/chef/RepartitionClassesView'))
const EmploiDuTempsChefDepartementView = lazy(() => import('./views/chef-departement/EmploiDuTempsView'))
const NotesChefDepartementView = lazy(() => import('./views/chef-departement/NotesView'))
const RelevesNotesView = lazy(() => import('./views/chef-departement/RelevesNotesView'))
const PlanchesView = lazy(() => import('./views/chef-departement/PlanchesView'))
const BulletinsChefDepartementView = lazy(() => import('./views/chef-departement/BulletinsView'))
const StatistiquesChefDepartementView = lazy(() => import('./views/chef-departement/StatistiquesView'))
const CoordinateursPedagogiquesView = lazy(() => import('./views/chef-departement/CoordinateursPedagogiquesView'))
const MessagerieChefView = lazy(() => import('./views/chef/MessagerieChefView'))
const GererClassesView = lazy(() => import('./views/chef/GererClassesView'))
const GererEnseignantsView = lazy(() => import('./views/chef/GererEnseignantsView'))
const AjouterNotesView = lazy(() => import('./views/chef/AjouterNotesView'))
const GererModulesView = lazy(() => import('./views/chef/GererModulesView'))
const GererEtudiantsView = lazy(() => import('./views/chef/GererEtudiantsView'))
const GererRattrapagesView = lazy(() => import('./views/chef/GererRattrapagesView'))
const PublierUnitesEnseignementView = lazy(() => import('./views/chef/PublierUnitesEnseignementView'))
const PublierBulletinsView = lazy(() => import('./views/chef/PublierBulletinsView'))
const GererEmploisTempsView = lazy(() => import('./views/chef/GererEmploisTempsView'))

// Routes Service Scolarité
const DashboardScolariteView = lazy(() => import('./views/scolarite/DashboardScolariteView'))
const ImporterCandidatsView = lazy(() => import('./views/scolarite/ImporterCandidatsView'))
const GererInscriptionsView = lazy(() => import('./views/scolarite/GererInscriptionsView'))
const GererEtudiantsScolariteView = lazy(() => import('./views/scolarite/GererEtudiantsScolariteView'))
const MessagerieScolareView = lazy(() => import('./views/scolarite/MessagerieScolareView'))
const BulletinsView = lazy(() => import('./views/scolarite/BulletinsView'))
const DiplomesView = lazy(() => import('./views/scolarite/DiplomesView'))
const ProcesVerbauxView = lazy(() => import('./views/scolarite/ProcesVerbauxView'))
const ArchivageView = lazy(() => import('./views/scolarite/ArchivageView'))
const AttestationsScolariteView = lazy(() => import('./views/scolarite/AttestationsScolariteView'))
const ArchivesAttestationsScolariteView = lazy(() => import('./views/scolarite/ArchivesAttestationsScolariteView'))
const ValiderDocumentsView = lazy(() => import('./views/scolarite/ValiderDocumentsView'))

// Routes SP-Scolarité
const DashboardSPView = lazy(() => import('./views/sp-scolarite/DashboardSPView'))
const AttestationsView = lazy(() => import('./views/sp-scolarite/AttestationsView'))
const ArchivesAttestationsView = lazy(() => import('./views/sp-scolarite/ArchivesAttestationsView'))
const MessagerieSPView = lazy(() => import('./views/sp-scolarite/MessagerieSPView'))

// Routes DG
const DashboardDGView = lazy(() => import('./views/dg/DashboardDGView'))

// Routes DEP
const DashboardDEPView = lazy(() => import('./views/dep/DashboardDEPView'))
const ChefsDepartementView = lazy(() => import('./views/dep/ChefsDepartementView'))
const DepartementsView = lazy(() => import('./views/dep/DepartementsView'))
const ConseilsView = lazy(() => import('./views/dep/ConseilsView'))
const VisasView = lazy(() => import('./views/dep/VisasView'))
const ProcesVerbauxDEPView = lazy(() => import('./views/dep/ProcesVerbauxView'))
const RapportsView = lazy(() => import('./views/dep/RapportsView'))
const StatistiquesDEPView = lazy(() => import('./views/dep/StatistiquesView'))
const EtudiantsView = lazy(() => import('./views/dep/EtudiantsView'))
const MeilleursEtudiantsView = lazy(() => import('./views/dep/MeilleursEtudiantsView'))
const MessagerieDEPView = lazy(() => import('./views/dep/MessagerieDEPView'))

// Routes Administration
const ProfilAdminView = lazy(() => import('./views/admin/ProfilAdminView'))
const ParametresAdminView = lazy(() => import('./views/admin/ParametresAdminView'))

// Routes Chef de Scolarité
const DashboardChefScolariteView = lazy(() => import('./views/chef-scolarite/DashboardChefView'))
const GestionComptesView = lazy(() => import('./views/chef-scolarite/GestionComptesView'))
const AuditView = lazy(() => import('./views/chef-scolarite/AuditView'))
const StatistiquesView = lazy(() => import('./views/chef-scolarite/StatistiquesView'))
const MessagerieChefScolariteView = lazy(() => import('./views/chef-scolarite/MessagerieChefView'))

// Routes Administrateur Système
const DashboardAdminSystemeView = lazy(() => import('./views/admin-systeme/DashboardView'))
const StudentCredentialsView = lazy(() => import('./views/admin-systeme/StudentCredentialsView'))
const AuditAdminSystemeView = lazy(() => import('./views/admin-systeme/AuditView'))
const MaintenanceView = lazy(() => import('./views/admin-systeme/MaintenanceView'))

// Composant de chargement pour Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner text="Chargement de la page..." />
  </div>
)

function App() {
  return (
    <Router future={{ v7_relativeSplatPath: true }}>
      <ErrorBoundary>
        <NavigationInit />
        <Toaster position="top-right" />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Pages de connexion - Accessibles sans authentification */}
            <Route
              path="/login"
              element={
                <ProtectedRoute requireAuth={false}>
                  <LoginView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/login-etudiant"
              element={
                <ProtectedRoute requireAuth={false}>
                  <LoginStudentView />
                </ProtectedRoute>
              }
            />

            {/* Routes Étudiant - Protégées pour le rôle ETUDIANT */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="ETUDIANT">
                  <DashboardView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="ETUDIANT">
                  <DocumentsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/emploi-du-temps"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="ETUDIANT">
                  <EmploiDuTempsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notes"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="ETUDIANT">
                  <NotesView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profil"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="ETUDIANT">
                  <ProfileView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="ETUDIANT">
                  <NotificationsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reclamations"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="ETUDIANT">
                  <ReclamationsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/aide"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="ETUDIANT">
                  <AideView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mon-dossier"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="ETUDIANT">
                  <MonDossierView />
                </ProtectedRoute>
              }
            />

            {/* Routes Chef / Coordinateur pédagogique — même espace (sauf /chef/coordinateurs : chef seul) */}
            <Route
              path="/chef/departement/dashboard"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={['CHEF_DEPARTEMENT', 'COORD_PEDAGOGIQUE']}>
                  <DashboardChefView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef/dashboard"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={['CHEF_DEPARTEMENT', 'COORD_PEDAGOGIQUE']}>
                  <DashboardChefView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef/messagerie"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={['CHEF_DEPARTEMENT', 'COORD_PEDAGOGIQUE']}>
                  <MessagerieChefView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef/classes"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={['CHEF_DEPARTEMENT', 'COORD_PEDAGOGIQUE']}>
                  <ClassesChefDepartementView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef/modules"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={['CHEF_DEPARTEMENT', 'COORD_PEDAGOGIQUE']}>
                  <ModulesChefDepartementView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef/enseignants"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={['CHEF_DEPARTEMENT', 'COORD_PEDAGOGIQUE']}>
                  <EnseignantsChefDepartementView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef/etudiants"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={['CHEF_DEPARTEMENT', 'COORD_PEDAGOGIQUE']}>
                  <EtudiantsInscritsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef/repartition"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={['CHEF_DEPARTEMENT', 'COORD_PEDAGOGIQUE']}>
                  <RepartitionClasseView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef/notes"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={['CHEF_DEPARTEMENT', 'COORD_PEDAGOGIQUE']}>
                  <NotesChefDepartementView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef/notes/ajouter"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={['CHEF_DEPARTEMENT', 'COORD_PEDAGOGIQUE']}>
                  <AjouterNotesView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef/emplois-du-temps"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={['CHEF_DEPARTEMENT', 'COORD_PEDAGOGIQUE']}>
                  <EmploiDuTempsChefDepartementView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef/rattrapages"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={['CHEF_DEPARTEMENT', 'COORD_PEDAGOGIQUE']}>
                  <GererRattrapagesView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef/unites-enseignement"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={['CHEF_DEPARTEMENT', 'COORD_PEDAGOGIQUE']}>
                  <PublierUnitesEnseignementView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef/releves"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={['CHEF_DEPARTEMENT', 'COORD_PEDAGOGIQUE']}>
                  <RelevesNotesView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef/planches"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={['CHEF_DEPARTEMENT', 'COORD_PEDAGOGIQUE']}>
                  <PlanchesView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef/bulletins"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={['CHEF_DEPARTEMENT', 'COORD_PEDAGOGIQUE']}>
                  <BulletinsChefDepartementView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef/statistiques"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles={['CHEF_DEPARTEMENT', 'COORD_PEDAGOGIQUE']}>
                  <StatistiquesChefDepartementView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef/coordinateurs"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="CHEF_DEPARTEMENT">
                  <CoordinateursPedagogiquesView />
                </ProtectedRoute>
              }
            />

            {/* Routes Service Scolarité - Protégées pour le rôle AGENT_SCOLARITE */}
            <Route
              path="/scolarite/dashboard"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="AGENT_SCOLARITE">
                  <DashboardScolariteView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scolarite/importer-candidats"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="AGENT_SCOLARITE">
                  <ImporterCandidatsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scolarite/inscriptions"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="AGENT_SCOLARITE">
                  <GererInscriptionsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scolarite/etudiants"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="AGENT_SCOLARITE">
                  <GererEtudiantsScolariteView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scolarite/messagerie"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="AGENT_SCOLARITE">
                  <MessagerieScolareView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scolarite/bulletins"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="AGENT_SCOLARITE">
                  <BulletinsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scolarite/diplomes"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="AGENT_SCOLARITE">
                  <DiplomesView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scolarite/proces-verbaux"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="AGENT_SCOLARITE">
                  <ProcesVerbauxView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scolarite/archivage"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="AGENT_SCOLARITE">
                  <ArchivageView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scolarite/attestations"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="AGENT_SCOLARITE">
                  <AttestationsScolariteView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scolarite/archives-attestations"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="AGENT_SCOLARITE">
                  <ArchivesAttestationsScolariteView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scolarite/valider-documents"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="AGENT_SCOLARITE">
                  <ValiderDocumentsView />
                </ProtectedRoute>
              }
            />

            {/* Routes SP-Scolarité - Protégées pour le rôle SP_SCOLARITE */}
            <Route
              path="/sp-scolarite/dashboard"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="SP_SCOLARITE">
                  <DashboardSPView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sp-scolarite/attestations"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="SP_SCOLARITE">
                  <AttestationsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sp-scolarite/archives"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="SP_SCOLARITE">
                  <ArchivesAttestationsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sp-scolarite/messagerie"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="SP_SCOLARITE">
                  <MessagerieSPView />
                </ProtectedRoute>
              }
            />

            {/* Routes communes Administration - Protégées pour tous les rôles authentifiés */}
            <Route
              path="/admin/profil"
              element={
                <ProtectedRoute requireAuth={true}>
                  <ProfilAdminView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/parametres"
              element={
                <ProtectedRoute requireAuth={true}>
                  <ParametresAdminView />
                </ProtectedRoute>
              }
            />

            {/* Routes Chef de Scolarité - Protégées pour le rôle CHEF_SERVICE_SCOLARITE */}
            <Route
              path="/chef-scolarite/dashboard"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="CHEF_SERVICE_SCOLARITE">
                  <DashboardChefScolariteView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef-scolarite/gestion-comptes"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="CHEF_SERVICE_SCOLARITE">
                  <GestionComptesView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef-scolarite/audit"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="CHEF_SERVICE_SCOLARITE">
                  <AuditView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef-scolarite/statistiques"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="CHEF_SERVICE_SCOLARITE">
                  <StatistiquesView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef-scolarite/messagerie"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="CHEF_SERVICE_SCOLARITE">
                  <MessagerieChefScolariteView />
                </ProtectedRoute>
              }
            />

            {/* Routes Chef de Scolarité - Actions déléguées */}
            <Route
              path="/chef-scolarite/importer-candidats"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="CHEF_SERVICE_SCOLARITE">
                  <ImporterCandidatsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef-scolarite/inscriptions"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="CHEF_SERVICE_SCOLARITE">
                  <GererInscriptionsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef-scolarite/attestations"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="CHEF_SERVICE_SCOLARITE">
                  <AttestationsScolariteView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef-scolarite/archives-attestations"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="CHEF_SERVICE_SCOLARITE">
                  <ArchivesAttestationsScolariteView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef-scolarite/bulletins"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="CHEF_SERVICE_SCOLARITE">
                  <BulletinsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef-scolarite/diplomes"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="CHEF_SERVICE_SCOLARITE">
                  <DiplomesView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef-scolarite/proces-verbaux"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="CHEF_SERVICE_SCOLARITE">
                  <ProcesVerbauxView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chef-scolarite/archivage"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="CHEF_SERVICE_SCOLARITE">
                  <ArchivageView />
                </ProtectedRoute>
              }
            />

            {/* Routes Administrateur Système - Protégées pour le rôle ADMIN_SYSTEME */}
            <Route
              path="/admin-systeme/dashboard"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="ADMIN_SYSTEME">
                  <DashboardAdminSystemeView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-systeme/etudiants/credentials"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="ADMIN_SYSTEME">
                  <StudentCredentialsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-systeme/audit"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="ADMIN_SYSTEME">
                  <AuditAdminSystemeView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-systeme/maintenance"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="ADMIN_SYSTEME">
                  <MaintenanceView />
                </ProtectedRoute>
              }
            />

            {/* Route DG - Protégée pour le rôle DG */}
            <Route
              path="/dg/dashboard"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="DG">
                  <DashboardDGView />
                </ProtectedRoute>
              }
            />

            {/* Routes DEP - Protégées pour le rôle DEP */}
            <Route
              path="/dep/dashboard"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="DEP">
                  <DashboardDEPView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dep/chefs-departement"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="DEP">
                  <ChefsDepartementView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dep/departements"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="DEP">
                  <DepartementsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dep/conseils"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="DEP">
                  <ConseilsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dep/visas"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="DEP">
                  <VisasView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dep/proces-verbaux"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="DEP">
                  <ProcesVerbauxDEPView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dep/rapports"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="DEP">
                  <RapportsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dep/statistiques"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="DEP">
                  <StatistiquesDEPView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dep/etudiants"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="DEP">
                  <EtudiantsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dep/meilleurs-etudiants"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="DEP">
                  <MeilleursEtudiantsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dep/messagerie"
              element={
                <ProtectedRoute requireAuth={true} allowedRoles="DEP">
                  <MessagerieDEPView />
                </ProtectedRoute>
              }
            />

            {/* Routes par défaut */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login-admin" element={<Navigate to="/login" replace />} />

            {/* Route 404 - Page non trouvée */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-slate-800 mb-4">404</h1>
                    <p className="text-slate-600 mb-6">Page non trouvée : {window.location.pathname}</p>
                    {/* Temporairement désactivé pour debugger */}
                    {/* <Navigate to="/login" replace /> */}
                    <button
                      onClick={() => window.location.href = '/login'}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Retour à la connexion
                    </button>
                  </div>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  )
}

export default App
