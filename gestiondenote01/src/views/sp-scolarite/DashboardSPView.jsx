import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faFileAlt, faIdCard, faChartLine, faClock
} from '@fortawesome/free-solid-svg-icons'
import SidebarSP from '../../components/common/SidebarSP'
import HeaderSP from '../../components/common/HeaderSP'

const DashboardSPView = () => {
  const [stats] = useState({
    attestationsGenerees: 145,
    attestationsCeMois: 23,
    matriculesActifs: 485,
    dernierMatricule: 'GI2024-L3-125'
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarSP />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              Tableau de bord
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Gestion des attestations de scolarité et des matricules
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faFileAlt} className="text-blue-600 text-xl" />
                </div>
                <FontAwesomeIcon icon={faChartLine} className="text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">{stats.attestationsGenerees}</h3>
              <p className="text-sm text-slate-600">Attestations générées</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faClock} className="text-emerald-600 text-xl" />
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">Ce mois</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">{stats.attestationsCeMois}</h3>
              <p className="text-sm text-slate-600">Attestations ce mois</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faIdCard} className="text-indigo-600 text-xl" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">{stats.matriculesActifs}</h3>
              <p className="text-sm text-slate-600">Matricules actifs</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faIdCard} className="text-amber-600 text-xl" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">{stats.dernierMatricule}</h3>
              <p className="text-sm text-slate-600">Dernier matricule généré</p>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Actions rapides</h2>
              <div className="space-y-3">
                <a
                  href="/sp-scolarite/attestations"
                  className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faFileAlt} className="text-blue-600 mr-3 text-xl" />
                  <div>
                    <p className="font-medium text-slate-800">Générer une attestation</p>
                    <p className="text-xs text-slate-600">Créez une nouvelle attestation de scolarité</p>
                  </div>
                </a>
                <a
                  href="/sp-scolarite/matricules"
                  className="flex items-center p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faIdCard} className="text-emerald-600 mr-3 text-xl" />
                  <div>
                    <p className="font-medium text-slate-800">Configurer les matricules</p>
                    <p className="text-xs text-slate-600">Définissez le format des matricules étudiants</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Informations</h2>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Année académique:</span>
                  <span className="font-semibold text-slate-800">2024-2025</span>
                </div>
                <div className="flex justify-between">
                  <span>Format matricule actuel:</span>
                  <span className="font-semibold text-slate-800">[FILIERE][ANNEE]-[NIVEAU]-[NUM]</span>
                </div>
                <div className="flex justify-between">
                  <span>Dernier numéro attestation:</span>
                  <span className="font-semibold text-slate-800">N°0459/INPTIC/DG/DSE/2024</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardSPView

