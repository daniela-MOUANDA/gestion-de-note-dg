import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faIdCard, faSave, faEye, faCheckCircle
} from '@fortawesome/free-solid-svg-icons'
import SidebarSP from '../../components/common/SidebarSP'
import HeaderSP from '../../components/common/HeaderSP'

const MatriculesView = () => {
  const [formatConfig, setFormatConfig] = useState({
    structure: '[FILIERE][ANNEE]-[NIVEAU]-[NUMERO]',
    separateur: '-',
    numeroDebut: 1,
    longueurNumero: 3,
    anneeFormat: 'YYYY'
  })

  const [exemples] = useState([
    { filiere: 'GI', annee: '2024', niveau: 'L1', numero: 1, resultat: 'GI2024-L1-001' },
    { filiere: 'RT', annee: '2024', niveau: 'L2', numero: 45, resultat: 'RT2024-L2-045' },
    { filiere: 'MTIC', annee: '2024', niveau: 'L3', numero: 125, resultat: 'MTIC2024-L3-125' },
    { filiere: 'AV', annee: '2024', niveau: 'L1', numero: 8, resultat: 'AV2024-L1-008' }
  ])

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const genererExemple = (filiere, annee, niveau, numero) => {
    const numStr = String(numero).padStart(formatConfig.longueurNumero, '0')
    return `${filiere}${annee}${formatConfig.separateur}${niveau}${formatConfig.separateur}${numStr}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarSP />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
              <FontAwesomeIcon icon={faIdCard} className="text-blue-600" />
              Configuration des matricules
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Définissez le format des matricules étudiants
            </p>
          </div>

          {saved && (
            <div className="mb-6 bg-green-100 border border-green-300 text-green-800 px-6 py-4 rounded-lg flex items-center gap-3">
              <FontAwesomeIcon icon={faCheckCircle} className="text-2xl" />
              <p className="font-semibold">Configuration enregistrée avec succès !</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Format du matricule</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Structure actuelle
                  </label>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <p className="font-mono text-lg text-blue-800 font-bold text-center">
                      {formatConfig.structure}
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">
                    Cette structure définit comment les matricules seront générés automatiquement
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Séparateur
                  </label>
                  <select
                    value={formatConfig.separateur}
                    onChange={(e) => setFormatConfig({ ...formatConfig, separateur: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="-">Tiret (-)</option>
                    <option value="_">Underscore (_)</option>
                    <option value="/">Slash (/)</option>
                    <option value="">Aucun</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Longueur du numéro séquentiel
                  </label>
                  <select
                    value={formatConfig.longueurNumero}
                    onChange={(e) => setFormatConfig({ ...formatConfig, longueurNumero: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="2">2 chiffres (01, 02, ...)</option>
                    <option value="3">3 chiffres (001, 002, ...)</option>
                    <option value="4">4 chiffres (0001, 0002, ...)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Format de l'année
                  </label>
                  <select
                    value={formatConfig.anneeFormat}
                    onChange={(e) => setFormatConfig({ ...formatConfig, anneeFormat: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="YYYY">Année complète (2024)</option>
                    <option value="YY">Année courte (24)</option>
                  </select>
                </div>

                <button
                  onClick={handleSave}
                  className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={faSave} />
                  Enregistrer la configuration
                </button>
              </div>
            </div>

            {/* Exemples */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <FontAwesomeIcon icon={faEye} />
                Aperçu des matricules
              </h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">Exemples générés :</h3>
                  <div className="space-y-2">
                    {exemples.map((ex, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-blue-100">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-slate-600">
                            <span className="font-semibold">{ex.filiere}</span> • {ex.annee} • {ex.niveau} • N°{ex.numero}
                          </div>
                          <div className="font-mono text-sm font-bold text-blue-800">
                            {genererExemple(ex.filiere, ex.annee, ex.niveau, ex.numero)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-900 mb-2">Composants du matricule :</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="font-mono bg-amber-100 px-2 py-1 rounded text-amber-800">[FILIERE]</span>
                      <span className="text-slate-600">Code de la filière (RT, GI, MTIC, AV)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-mono bg-amber-100 px-2 py-1 rounded text-amber-800">[ANNEE]</span>
                      <span className="text-slate-600">Année d'inscription (2024)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-mono bg-amber-100 px-2 py-1 rounded text-amber-800">[NIVEAU]</span>
                      <span className="text-slate-600">Niveau d'études (L1, L2, L3)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-mono bg-amber-100 px-2 py-1 rounded text-amber-800">[NUMERO]</span>
                      <span className="text-slate-600">Numéro séquentiel unique</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">📋 Règles importantes :</h3>
                  <ul className="space-y-1 text-sm text-green-800">
                    <li>• Les matricules sont générés automatiquement lors de l'inscription</li>
                    <li>• Chaque matricule est unique et ne peut être dupliqué</li>
                    <li>• Le numéro séquentiel s'incrémente automatiquement</li>
                    <li>• La modification du format n'affecte pas les matricules existants</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faIdCard} className="text-blue-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Matricules actifs</p>
                  <p className="text-2xl font-bold text-slate-800">485</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faIdCard} className="text-emerald-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Générés ce mois</p>
                  <p className="text-2xl font-bold text-slate-800">34</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faIdCard} className="text-indigo-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Dernier numéro</p>
                  <p className="text-lg font-bold text-slate-800 font-mono">GI2024-L3-125</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default MatriculesView

