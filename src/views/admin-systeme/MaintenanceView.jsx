import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faCog, faTools, faDatabase, faMicrochip,
    faExclamationTriangle, faExclamationCircle, faCheckCircle
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'

const MaintenanceView = () => (
    <div className="min-h-screen bg-slate-50">
        <AdminSidebar />
        <div className="lg:ml-64 min-h-screen flex flex-col">
            <AdminHeader />

            <main className="p-4 sm:p-6 lg:p-8 pt-36 lg:pt-40 flex-1">
                <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                            <FontAwesomeIcon icon={faTools} />
                        </div>
                        Maintenance du Système
                    </h1>
                    <p className="text-slate-500 mt-1">Outils de diagnostic, sauvegardes et configuration critique.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Health Check Card */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mb-6">
                            <FontAwesomeIcon icon={faCheckCircle} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Santé du Système</h2>
                        <p className="text-slate-500 mb-6 text-sm">Tous les services critiques sont opérationnels et répondent normalement.</p>
                        <div className="w-full space-y-3 text-left">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faDatabase} className="text-indigo-500" /> Database
                                </span>
                                <span className="text-xs font-bold text-green-600 px-2 py-1 bg-green-100 rounded">OK</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faMicrochip} className="text-blue-500" /> API Server
                                </span>
                                <span className="text-xs font-bold text-green-600 px-2 py-1 bg-green-100 rounded">OK</span>
                            </div>
                        </div>
                    </div>

                    {/* Dangerous Actions Card */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />
                            Actions Critiques
                        </h2>
                        <div className="space-y-4">
                            <button className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all group">
                                <div className="font-bold text-slate-800 group-hover:text-red-600">Réindexer la base de données</div>
                                <div className="text-xs text-slate-500">Mettre à jour les indices de recherche pour la performance.</div>
                            </button>
                            <button className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all group">
                                <div className="font-bold text-slate-800 group-hover:text-red-600">Purger les logs anciens</div>
                                <div className="text-xs text-slate-500">Supprimer les logs d'audit datant de plus de 2 ans.</div>
                            </button>
                            <button className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all group">
                                <div className="font-bold text-slate-800 group-hover:text-red-600">Mode Maintenance</div>
                                <div className="text-xs text-slate-500">Restreindre l'accès à la plateforme pendant une mise à jour.</div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 bg-red-50 border border-red-100 p-6 rounded-2xl flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <FontAwesomeIcon icon={faExclamationCircle} />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-900">Avertissement de sécurité</h3>
                        <p className="text-sm text-red-800 mt-1">
                            Les actions sur cette page peuvent avoir des conséquences irréversibles sur l'intégrité des données.
                            Veuillez vous assurer d'avoir une sauvegarde récente avant toute manipulation critique.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    </div>
)

export default MaintenanceView
