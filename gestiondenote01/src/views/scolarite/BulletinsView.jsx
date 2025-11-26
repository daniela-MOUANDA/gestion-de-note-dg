import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faFileAlt, faArrowLeft, faCalendar, faGraduationCap, faCheckCircle,
  faDownload, faCheck
} from '@fortawesome/free-solid-svg-icons'
import SidebarScolarite from '../../components/common/SidebarScolarite'
import HeaderScolarite from '../../components/common/HeaderScolarite'

const BulletinsView = () => {
  const [selectedPromotion, setSelectedPromotion] = useState('')
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedSemestre, setSelectedSemestre] = useState('')
  const [bulletinsRecuperes, setBulletinsRecuperes] = useState({})
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedEtudiant, setSelectedEtudiant] = useState(null)

  const promotions = [
    { id: '2024-2025', nom: '2024-2025', statut: 'en_cours' },
    { id: '2023-2024', nom: '2023-2024', statut: 'archive' },
    { id: '2022-2023', nom: '2022-2023', statut: 'archive' }
  ]

  const filieres = [
    { id: 'RT', nom: 'Réseau et Télécom' },
    { id: 'GI', nom: 'Génie Informatique' },
    { id: 'MTIC', nom: 'Métiers des TIC' },
    { id: 'AV', nom: 'Audiovisuel' }
  ]

  const niveaux = ['L1', 'L2', 'L3']

  const getClasses = (filiere, niveau) => {
    const niveauNum = niveau.replace('L', '')
    return [
      { id: `${filiere}-${niveauNum}A`, nom: `${filiere}-${niveauNum}A`, effectif: 35 },
      { id: `${filiere}-${niveauNum}B`, nom: `${filiere}-${niveauNum}B`, effectif: 32 },
      { id: `${filiere}-${niveauNum}C`, nom: `${filiere}-${niveauNum}C`, effectif: 28 }
    ]
  }

  // Données d'exemple pour les bulletins
  const getBulletins = (classe, semestre) => {
    const filiereCode = classe.split('-')[0]
    const niveau = classe.split('-')[1].charAt(0)
    return [
      { 
        id: 1, 
        nom: 'MBADINGA', 
        prenom: 'Paul', 
        matricule: `${filiereCode}2024-L${niveau}-001`,
        moyenne: 14.5,
        mention: 'Bien',
        dateGeneration: '2025-02-15'
      },
      { 
        id: 2, 
        nom: 'OBIANG', 
        prenom: 'Sophie', 
        matricule: `${filiereCode}2024-L${niveau}-002`,
        moyenne: 16.2,
        mention: 'Très Bien',
        dateGeneration: '2025-02-15'
      },
      { 
        id: 3, 
        nom: 'NZAMBA', 
        prenom: 'Jean', 
        matricule: `${filiereCode}2024-L${niveau}-003`,
        moyenne: 13.1,
        mention: 'Assez Bien',
        dateGeneration: '2025-02-15'
      },
      { 
        id: 4, 
        nom: 'ONDO', 
        prenom: 'Marie', 
        matricule: `${filiereCode}2024-L${niveau}-004`,
        moyenne: 15.8,
        mention: 'Bien',
        dateGeneration: '2025-02-15'
      },
      { 
        id: 5, 
        nom: 'EKOMY', 
        prenom: 'Pierre', 
        matricule: `${filiereCode}2024-L${niveau}-005`,
        moyenne: 12.3,
        mention: 'Passable',
        dateGeneration: '2025-02-15'
      },
      { 
        id: 6, 
        nom: 'BITEGUE', 
        prenom: 'Anne', 
        matricule: `${filiereCode}2024-L${niveau}-006`,
        moyenne: 17.1,
        mention: 'Très Bien',
        dateGeneration: '2025-02-15'
      },
      { 
        id: 7, 
        nom: 'MVOU', 
        prenom: 'Patrick', 
        matricule: `${filiereCode}2024-L${niveau}-007`,
        moyenne: 11.5,
        mention: 'Passable',
        dateGeneration: '2025-02-15'
      },
      { 
        id: 8, 
        nom: 'EBANG', 
        prenom: 'Claire', 
        matricule: `${filiereCode}2024-L${niveau}-008`,
        moyenne: 14.9,
        mention: 'Bien',
        dateGeneration: '2025-02-15'
      }
    ]
  }

  const handleBack = () => {
    if (selectedSemestre) setSelectedSemestre('')
    else if (selectedClasse) setSelectedClasse('')
    else if (selectedNiveau) setSelectedNiveau('')
    else if (selectedFiliere) setSelectedFiliere('')
    else if (selectedPromotion) setSelectedPromotion('')
  }

  const handleMarquerRecupere = (etudiant) => {
    setSelectedEtudiant(etudiant)
    setShowConfirm(true)
  }

  const confirmerRecuperation = () => {
    const key = `${selectedPromotion}-${selectedClasse}-${selectedSemestre}-${selectedEtudiant.id}`
    setBulletinsRecuperes({ ...bulletinsRecuperes, [key]: true })
    setShowConfirm(false)
    setSelectedEtudiant(null)
  }

  const isBulletinRecupere = (etudiantId) => {
    const key = `${selectedPromotion}-${selectedClasse}-${selectedSemestre}-${etudiantId}`
    return bulletinsRecuperes[key] || false
  }

  // Vue 1: Sélection de la promotion
  if (!selectedPromotion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarScolarite />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderScolarite scolariteName="Service Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faFileAlt} className="text-blue-600" />
                Gestion des Bulletins
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Gérez la remise des bulletins semestriels aux étudiants
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Sélectionnez une promotion</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {promotions.map((promo) => (
                  <button 
                    key={promo.id} 
                    onClick={() => setSelectedPromotion(promo.id)}
                    className={`p-6 border-2 rounded-xl transition-all duration-200 group ${
                      promo.statut === 'en_cours'
                        ? 'border-green-300 bg-green-50 hover:border-green-500 hover:shadow-lg'
                        : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50 hover:shadow-lg'
                    }`}>
                    <div className="text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        promo.statut === 'en_cours' ? 'bg-green-100 group-hover:bg-green-200' : 'bg-blue-100 group-hover:bg-blue-200'
                      }`}>
                        <FontAwesomeIcon icon={faCalendar} className={`text-3xl ${
                          promo.statut === 'en_cours' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className={`text-2xl font-bold mb-2 ${
                        promo.statut === 'en_cours' ? 'text-green-800 group-hover:text-green-600' : 'text-slate-800 group-hover:text-blue-600'
                      }`}>
                        {promo.nom}
                      </div>
                      {promo.statut === 'en_cours' && (
                        <span className="inline-block px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-bold">
                          En cours
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 2: Sélection de la filière
  if (!selectedFiliere) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarScolarite />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderScolarite scolariteName="Service Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Bulletins - Promotion {selectedPromotion}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez la filière
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez la filière</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {filieres.map((filiere) => (
                  <button 
                    key={filiere.id}
                    onClick={() => setSelectedFiliere(filiere.id)}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                        <FontAwesomeIcon icon={faGraduationCap} className="text-3xl text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">{filiere.id}</div>
                      <div className="text-sm text-slate-600">{filiere.nom}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 3: Sélection du niveau
  if (!selectedNiveau) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarScolarite />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderScolarite scolariteName="Service Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Bulletins - {selectedFiliere}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez le niveau
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez le niveau</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {niveaux.map((niveau) => (
                  <button 
                    key={niveau}
                    onClick={() => setSelectedNiveau(niveau)}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">{niveau}</div>
                      <div className="text-sm text-slate-600">
                        {niveau === 'L1' ? 'Première année' : niveau === 'L2' ? 'Deuxième année' : 'Troisième année'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 4: Sélection de la classe
  if (!selectedClasse) {
    const classes = getClasses(selectedFiliere, selectedNiveau)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarScolarite />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderScolarite scolariteName="Service Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Bulletins - {selectedFiliere} {selectedNiveau}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez la classe
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez la classe</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {classes.map((classe) => (
                  <button 
                    key={classe.id}
                    onClick={() => setSelectedClasse(classe.id)}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                        <FontAwesomeIcon icon={faGraduationCap} className="text-3xl text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">{classe.nom}</div>
                      <div className="text-sm text-slate-600">
                        Effectif: {classe.effectif} étudiants
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 5: Sélection du semestre
  if (!selectedSemestre) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarScolarite />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderScolarite scolariteName="Service Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Bulletins - Classe {selectedClasse}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez le semestre concerné
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez le semestre</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {['Semestre 1', 'Semestre 2'].map((semestre) => (
                  <button 
                    key={semestre}
                    onClick={() => setSelectedSemestre(semestre)}
                    className="p-8 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                        <FontAwesomeIcon icon={faFileAlt} className="text-4xl text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-slate-800 group-hover:text-blue-600">{semestre}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 6: Liste des bulletins
  const bulletins = getBulletins(selectedClasse, selectedSemestre)
  const nbRecuperes = bulletins.filter(b => isBulletinRecupere(b.id)).length
  const nbNonRecuperes = bulletins.length - nbRecuperes

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarScolarite />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderScolarite scolariteName="Service Scolarité" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
          <div className="mb-6">
            <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
            </button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              Bulletins - Classe {selectedClasse} • {selectedSemestre}
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Promotion {selectedPromotion}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faFileAlt} className="text-blue-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total bulletins</p>
                  <p className="text-2xl font-bold text-slate-800">{bulletins.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Récupérés</p>
                  <p className="text-2xl font-bold text-green-600">{nbRecuperes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faFileAlt} className="text-orange-600 text-xl" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Non récupérés</p>
                  <p className="text-2xl font-bold text-orange-600">{nbNonRecuperes}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Liste des bulletins</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Matricule</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Nom et Prénom</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Moyenne</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Mention</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Statut</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bulletins.map((etudiant) => {
                    const estRecupere = isBulletinRecupere(etudiant.id)
                    return (
                      <tr 
                        key={etudiant.id}
                        className={`${estRecupere ? 'bg-slate-50 opacity-60' : 'hover:bg-blue-50'} transition-colors`}>
                        <td className="px-6 py-4 text-sm text-slate-800 font-medium">{etudiant.matricule}</td>
                        <td className="px-6 py-4 text-sm text-slate-800">
                          {etudiant.prenom} {etudiant.nom}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-800">{etudiant.moyenne.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            etudiant.moyenne >= 16 ? 'bg-green-100 text-green-800' :
                            etudiant.moyenne >= 14 ? 'bg-blue-100 text-blue-800' :
                            etudiant.moyenne >= 12 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {etudiant.mention}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {estRecupere ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                              <FontAwesomeIcon icon={faCheck} />
                              Récupéré
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                              Non récupéré
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 transition-colors flex items-center gap-1">
                              <FontAwesomeIcon icon={faDownload} />
                              Télécharger
                            </button>
                            {!estRecupere && (
                              <button
                                onClick={() => handleMarquerRecupere(etudiant)}
                                className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-colors flex items-center gap-1">
                                <FontAwesomeIcon icon={faCheckCircle} />
                                Marquer récupéré
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Confirmer la récupération</h3>
            <p className="text-slate-600 mb-6">
              Confirmez-vous que <strong>{selectedEtudiant?.prenom} {selectedEtudiant?.nom}</strong> a récupéré son bulletin physiquement ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmerRecuperation}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
                Oui, confirmer
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false)
                  setSelectedEtudiant(null)
                }}
                className="flex-1 px-4 py-2 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BulletinsView

