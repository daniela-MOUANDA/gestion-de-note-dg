import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Routes Étudiant
import LoginView from './views/student/LoginView'
import DashboardView from './views/student/DashboardView'
import EmploiDuTempsView from './views/student/EmploiDuTempsView'
import NotesView from './views/student/NotesView'
import DocumentsView from './views/student/DocumentsView'
import ProfileView from './views/student/ProfileView'
import NotificationsView from './views/student/NotificationsView'
import ReclamationsView from './views/student/ReclamationsView'
import AideView from './views/student/AideView'

// Routes Chef de Département
import LoginChefView from './views/chef/LoginChefView'
import DashboardChefView from './views/chef/DashboardChefView'
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
import LoginScolariteView from './views/scolarite/LoginScolariteView'
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
import LoginSPView from './views/sp-scolarite/LoginSPView'
import DashboardSPView from './views/sp-scolarite/DashboardSPView'
import AttestationsView from './views/sp-scolarite/AttestationsView'
import MatriculesView from './views/sp-scolarite/MatriculesView'

function App() {
  return (
    <Router>
      <Routes>
        {/* Pages de connexion */}
        <Route path="/login-etudiant" element={<LoginView />} />
        <Route path="/login-chef" element={<LoginChefView />} />
        <Route path="/login-scolarite" element={<LoginScolariteView />} />
        <Route path="/login-sp" element={<LoginSPView />} />
        
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
        <Route path="/chef/classes" element={<GererClassesView />} />
        <Route path="/chef/enseignants" element={<GererEnseignantsView />} />
        <Route path="/chef/notes/ajouter" element={<AjouterNotesView />} />
        <Route path="/chef/modules" element={<GererModulesView />} />
        <Route path="/chef/etudiants" element={<GererEtudiantsView />} />
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
        
        {/* Routes SP-Scolarité */}
        <Route path="/sp-scolarite/dashboard" element={<DashboardSPView />} />
        <Route path="/sp-scolarite/attestations" element={<AttestationsView />} />
        <Route path="/sp-scolarite/matricules" element={<MatriculesView />} />
        
        <Route path="/" element={<Navigate to="/login-etudiant" replace />} />
        <Route path="/login" element={<Navigate to="/login-etudiant" replace />} />
      </Routes>
    </Router>
  )
}

export default App

