import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faGraduationCap, faArrowRight, faCheckCircle, faTimes } from '@fortawesome/free-solid-svg-icons'
import SidebarChefDepartement from '../../components/common/SidebarChefDepartement'
import HeaderChef from '../../components/common/HeaderChef'
import Modal from '../../components/common/Modal'
import { useAuth } from '../../contexts/AuthContext'

const RepartitionClasseView = () => {
  const { user } = useAuth()
  const [departementChef] = useState('Génie Informatique')
  
  const [etudiantsNonRepartis, setEtudiantsNonRepartis] = useState([
    { id: 1, matricule: '26001', nom: 'MBO', prenom: 'Lidvige', filiere: 'GI', niveau: 'L3' },
    { id: 2, matricule: '26002', nom: 'MBADINGA', prenom: 'Paul', filiere: 'GI', niveau: 'L2' },
    { id: 3, matricule: '26003', nom: 'OBIANG', prenom: 'Sophie', filiere: 'GI', niveau: 'L1' },
  ])
  
  const [classes] = useState([
    { id: 1, code: 'GI-L3-A', niveau: 'L3', effectif: 45, capacite: 50 },
    { id: 2, code: 'GI-L3-B', niveau: 'L3', effectif: 42, capacite: 50 },
    { id: 3, code: 'GI-L2-A', niveau: 'L2', effectif: 48, capacite: 50 },
    { id: 4, code: 'GI-L2-B', niveau: 'L2', effectif: 40, capacite: 50 },
    { id: 5, code: 'GI-L1-A', niveau: 'L1', effectif: 50, capacite: 50 },
    { id: 6, code: 'GI-L1-B', niveau: 'L1', effectif: 48, capacite: 50 },
  ])

  const [repartition, setRepartition] = useState({
    1: [], // GI-L3-A
    2: [], // GI-L3-B
    3: [], // GI-L2-A
    4: [], // GI-L2-B
    5: [], // GI-L1-A
    6: [], // GI-L1-B
  })

  const [showModal, setShowModal] = useState(false)
  const [selectedEtudiant, setSelectedEtudiant] = useState(null)
  const [selectedClasse, setSelectedClasse] = useState('')

  const handleRepartir = (etudiant) => {
    setSelectedEtudiant(etudiant)
    setSelectedClasse('')
    setShowModal(true)
  }

  const handleConfirmerRepartition = () => {
    if (!selectedEtudiant || !selectedClasse) return

    const classeId = parseInt(selectedClasse)
    const classe = classes.find(c => c.id === classeId)

    if (classe.effectif >= classe.capacite) {
      alert('Cette classe est pleine !')
      return
    }

    // Ajouter l'étudiant à la classe
    setRepartition(prev => ({
      ...prev,
      [classeId]: [...prev[classeId], selectedEtudiant]
    }))

    // Retirer l'étudiant de la liste non répartie
    setEtudiantsNonRepartis(prev => prev.filter(e => e.id !== selectedEtudiant.id))

    // Mettre à jour l'effectif de la classe
    const updatedClasses = classes.map(c => 
      c.id === classeId ? { ...c, effectif: c.effectif + 1 } : c
    )

    setShowModal(false)
    alert(`Étudiant ${selectedEtudiant.prenom} ${selectedEtudiant.nom} réparti dans ${classe.code}`)
  }

  const getClassesByNiveau = (niveau) => {
    return classes.filter(c => c.niveau === niveau && c.effectif < c.capacite)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarChefDepartement />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderChef chefName={`Chef de Département - ${departementChef}`} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-20">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Répartition par Classe</h1>
            <p className="text-sm text-slate-600">Répartissez les étudiants inscrits dans les classes de votre département</p>
          </div>

          {/* Étudiants non répartis */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faUsers} className="text-amber-600" />
              Étudiants non répartis ({etudiantsNonRepartis.length})
            </h2>
            {etudiantsNonRepartis.length > 0 ? (
              <div className="space-y-2">
                {etudiantsNonRepartis.map((etudiant) => (
                  <div key={etudiant.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faGraduationCap} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{etudiant.prenom} {etudiant.nom}</p>
                        <p className="text-sm text-slate-600">Matricule: {etudiant.matricule} | Niveau: {etudiant.niveau}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRepartir(etudiant)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faArrowRight} />
                      Répartir
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-500 mb-2" />
                <p>Tous les étudiants ont été répartis !</p>
              </div>
            )}
          </div>

          {/* Répartition par classe */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classe) => {
              const etudiantsClasse = repartition[classe.id] || []
              const tauxOccupation = (classe.effectif / classe.capacite) * 100
              
              return (
                <div key={classe.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{classe.code}</h3>
                      <p className="text-sm text-slate-500">Niveau: {classe.niveau}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tauxOccupation >= 100 ? 'bg-red-100 text-red-800' :
                      tauxOccupation >= 80 ? 'bg-amber-100 text-amber-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {classe.effectif}/{classe.capacite}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          tauxOccupation >= 100 ? 'bg-red-600' :
                          tauxOccupation >= 80 ? 'bg-amber-500' :
                          'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(tauxOccupation, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{Math.round(tauxOccupation)}% d'occupation</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700 mb-2">Étudiants répartis ({etudiantsClasse.length})</p>
                    {etudiantsClasse.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {etudiantsClasse.map((etudiant) => (
                          <div key={etudiant.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded text-sm">
                            <FontAwesomeIcon icon={faGraduationCap} className="text-blue-600 text-xs" />
                            <span className="text-slate-700">{etudiant.prenom} {etudiant.nom}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-4">Aucun étudiant réparti</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Modal de répartition */}
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title="Répartir l'étudiant dans une classe"
          >
            <div className="p-6 space-y-4">
              {selectedEtudiant && (
                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-slate-800">{selectedEtudiant.prenom} {selectedEtudiant.nom}</p>
                  <p className="text-sm text-slate-600">Matricule: {selectedEtudiant.matricule} | Niveau: {selectedEtudiant.niveau}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sélectionner une classe</label>
                <select
                  value={selectedClasse}
                  onChange={(e) => setSelectedClasse(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une classe</option>
                  {selectedEtudiant && getClassesByNiveau(selectedEtudiant.niveau).map((classe) => (
                    <option key={classe.id} value={classe.id}>
                      {classe.code} ({classe.effectif}/{classe.capacite} places)
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmerRepartition}
                  disabled={!selectedClasse}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmer la répartition
                </button>
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  )
}

export default RepartitionClasseView

