import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Formulaires de connexion
import LoginView from './views/LoginView'
import LoginStudentView from './views/student/LoginStudentView'

// Routes Étudiant
import DashboardView from './views/student/DashboardView'
import EmploiDuTempsView from './views/student/EmploiDuTempsView'
import NotesView from './views/student/NotesView'
import DocumentsView from './views/student/DocumentsView'
import ProfileView from './views/student/ProfileView'
import NotificationsView from './views/student/NotificationsView'
import ReclamationsView from './views/student/ReclamationsView'
import AideView from './views/student/AideView'

// Routes Chef de Département
import DashboardChefView from './views/chef/DashboardChefView'
import ClassesChefDepartementView from './views/chef-departement/ClassesView'
import ModulesChefDepartementView from './views/chef-departement/ModulesView'
import EnseignantsChefDepartementView from './views/chef-departement/EnseignantsView'
import EtudiantsInscritsView from './views/chef-departement/EtudiantsInscritsView'
import RepartitionClasseView from './views/chef-departement/RepartitionClasseView'
import MessagerieChefView from './views/chef/MessagerieChefView'
import GererClassesView from './views/chef/GererClassesView'
import GererEnseignantsView from './views/chef/GererEnseignantsView'
import AjouterNotesView from './views/chef/AjouterNotesView'
import GererModulesView from './views/chef/GererModulesView'
import GererEtudiantsView from './views/chef/GererEtudiantsView'
import GererRattrapagesView from './views/chef/GererRattrapagesView'
import PublierUnitesEnseignementView from './views/chef/PublierUnitesEnseignementView'
import PublierBulletinsView from './views/chef/PublierBulletinsView'
import GererEmploisTempsView from './views/chef/GererEmploisTempsView'

// Routes Service Scolarité
import DashboardScolariteView from './views/scolarite/DashboardScolariteView'
import ImporterCandidatsView from './views/scolarite/ImporterCandidatsView'
import GererInscriptionsView from './views/scolarite/GererInscriptionsView'
import GererEtudiantsScolariteView from './views/scolarite/GererEtudiantsScolariteView'
import MessagerieScolareView from './views/scolarite/MessagerieScolareView'
import BulletinsView from './views/scolarite/BulletinsView'
import DiplomesView from './views/scolarite/DiplomesView'
import ProcesVerbauxView from './views/scolarite/ProcesVerbauxView'
import ArchivageView from './views/scolarite/ArchivageView'

// Routes SP-Scolarité (Secrétaire Particulière)
import DashboardSPView from './views/sp-scolarite/DashboardSPView'
import AttestationsView from './views/sp-scolarite/AttestationsView'
import ArchivesAttestationsView from './views/sp-scolarite/ArchivesAttestationsView'
import MessagerieSPView from './views/sp-scolarite/MessagerieSPView'
import AttestationsScolariteView from './views/scolarite/AttestationsScolariteView'
import ArchivesAttestationsScolariteView from './views/scolarite/ArchivesAttestationsScolariteView'

// Routes DG (Directeur Général)
import DashboardDGView from './views/dg/DashboardDGView'

// Routes DEP (Directeur des Études Pédagogiques)
import DashboardDEPView from './views/dep/DashboardDEPView'
import ChefsDepartementView from './views/dep/ChefsDepartementView'
import DepartementsView from './views/dep/DepartementsView'
import ConseilsView from './views/dep/ConseilsView'
import VisasView from './views/dep/VisasView'
import ProcesVerbauxDEPView from './views/dep/ProcesVerbauxView'
import RapportsView from './views/dep/RapportsView'
import StatistiquesDEPView from './views/dep/StatistiquesView'
import EtudiantsView from './views/dep/EtudiantsView'
import MeilleursEtudiantsView from './views/dep/MeilleursEtudiantsView'

// Routes communes Administration
import ProfilAdminView from './views/admin/ProfilAdminView'
import ParametresAdminView from './views/admin/ParametresAdminView'

// Routes Chef de Scolarité
import DashboardChefScolariteView from './views/chef-scolarite/DashboardChefView'
import GestionComptesView from './views/chef-scolarite/GestionComptesView'
import AuditView from './views/chef-scolarite/AuditView'
import StatistiquesView from './views/chef-scolarite/StatistiquesView'
import MessagerieChefScolariteView from './views/chef-scolarite/MessagerieChefView'

function App() {
  return (
    <Router future={{ v7_relativeSplatPath: true }}>
      <Routes>
        {/* Pages de connexion */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/login-etudiant" element={<LoginStudentView />} />
        
        {/* Routes Étudiant */}
        <Route path="/dashboard" element={<DashboardView />} />
        <Route path="/documents" element={<DocumentsView />} />
        <Route path="/emploi-du-temps" element={<EmploiDuTempsView />} />
        <Route path="/notes" element={<NotesView />} />
        <Route path="/profil" element={<ProfileView />} />
        <Route path="/notifications" element={<NotificationsView />} />
        <Route path="/reclamations" element={<ReclamationsView />} />
        <Route path="/aide" element={<AideView />} />
        
        {/* Routes Chef de Département */}
        <Route path="/chef/dashboard" element={<DashboardChefView />} />
        <Route path="/chef/messagerie" element={<MessagerieChefView />} />
        <Route path="/chef/classes" element={<ClassesChefDepartementView />} />
        <Route path="/chef/modules" element={<ModulesChefDepartementView />} />
        <Route path="/chef/enseignants" element={<EnseignantsChefDepartementView />} />
        <Route path="/chef/etudiants" element={<EtudiantsInscritsView />} />
        <Route path="/chef/repartition" element={<RepartitionClasseView />} />
        <Route path="/chef/notes/ajouter" element={<AjouterNotesView />} />
        <Route path="/chef/rattrapages" element={<GererRattrapagesView />} />
        <Route path="/chef/unites-enseignement" element={<PublierUnitesEnseignementView />} />
        <Route path="/chef/bulletins" element={<PublierBulletinsView />} />
        <Route path="/chef/emplois-temps" element={<GererEmploisTempsView />} />
        
        {/* Routes Service Scolarité */}
        <Route path="/scolarite/dashboard" element={<DashboardScolariteView />} />
        <Route path="/scolarite/importer-candidats" element={<ImporterCandidatsView />} />
        <Route path="/scolarite/inscriptions" element={<GererInscriptionsView />} />
        <Route path="/scolarite/etudiants" element={<GererEtudiantsScolariteView />} />
        <Route path="/scolarite/messagerie" element={<MessagerieScolareView />} />
        <Route path="/scolarite/bulletins" element={<BulletinsView />} />
        <Route path="/scolarite/diplomes" element={<DiplomesView />} />
        <Route path="/scolarite/proces-verbaux" element={<ProcesVerbauxView />} />
        <Route path="/scolarite/archivage" element={<ArchivageView />} />
        <Route path="/scolarite/attestations" element={<AttestationsScolariteView />} />
        <Route path="/scolarite/archives-attestations" element={<ArchivesAttestationsScolariteView />} />
        
        {/* Routes SP-Scolarité */}
        <Route path="/sp-scolarite/dashboard" element={<DashboardSPView />} />
        <Route path="/sp-scolarite/attestations" element={<AttestationsView />} />
        <Route path="/sp-scolarite/archives" element={<ArchivesAttestationsView />} />
        <Route path="/sp-scolarite/messagerie" element={<MessagerieSPView />} />
        
        {/* Routes communes Administration - Profil et Paramètres */}
        <Route path="/admin/profil" element={<ProfilAdminView />} />
        <Route path="/admin/parametres" element={<ParametresAdminView />} />
        
        {/* Routes Chef de Scolarité */}
        <Route path="/chef-scolarite/dashboard" element={<DashboardChefScolariteView />} />
        <Route path="/chef-scolarite/gestion-comptes" element={<GestionComptesView />} />
        <Route path="/chef-scolarite/audit" element={<AuditView />} />
        <Route path="/chef-scolarite/statistiques" element={<StatistiquesView />} />
        <Route path="/chef-scolarite/messagerie" element={<MessagerieChefScolariteView />} />
        
        {/* Routes Chef de Scolarité - Actions délé guées (même interface mais avec layout Chef) */}
        <Route path="/chef-scolarite/importer-candidats" element={<ImporterCandidatsView />} />
        <Route path="/chef-scolarite/inscriptions" element={<GererInscriptionsView />} />
        <Route path="/chef-scolarite/attestations" element={<AttestationsScolariteView />} />
        <Route path="/chef-scolarite/archives-attestations" element={<ArchivesAttestationsScolariteView />} />
        <Route path="/chef-scolarite/bulletins" element={<BulletinsView />} />
        <Route path="/chef-scolarite/diplomes" element={<DiplomesView />} />
        <Route path="/chef-scolarite/proces-verbaux" element={<ProcesVerbauxView />} />
        <Route path="/chef-scolarite/archivage" element={<ArchivageView />} />
        
        {/* Route DG - Prévisualisation sans authentification */}
        <Route path="/dg/dashboard" element={<DashboardDGView />} />
        
        {/* Routes DEP (Directeur des Études Pédagogiques) */}
        <Route path="/dep/dashboard" element={<DashboardDEPView />} />
        <Route path="/dep/chefs-departement" element={<ChefsDepartementView />} />
        <Route path="/dep/departements" element={<DepartementsView />} />
        <Route path="/dep/conseils" element={<ConseilsView />} />
        <Route path="/dep/visas" element={<VisasView />} />
        <Route path="/dep/proces-verbaux" element={<ProcesVerbauxDEPView />} />
        <Route path="/dep/rapports" element={<RapportsView />} />
        <Route path="/dep/statistiques" element={<StatistiquesDEPView />} />
        <Route path="/dep/etudiants" element={<EtudiantsView />} />
        <Route path="/dep/meilleurs-etudiants" element={<MeilleursEtudiantsView />} />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login-admin" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App

