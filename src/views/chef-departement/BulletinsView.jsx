import { useState, useEffect, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFileAlt, faSpinner, faCheckCircle, faExclamationTriangle,
  faGraduationCap, faFilePdf, faCalendarAlt, faRefresh, faDownload, faEye, faTimes
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
import { getEtatBulletinsToutesClasses, genererBulletins, getBulletinsGeneres } from '../../api/chefDepartement'

const BulletinsView = () => {
  const { user } = useAuth()
  const { showAlert } = useAlert()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [classesAvecEtat, setClassesAvecEtat] = useState([])
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [selectedSemestre, setSelectedSemestre] = useState('')
  const [generationLoading, setGenerationLoading] = useState({})
  const [bulletinsModal, setBulletinsModal] = useState({ open: false, classeId: null, semestre: null, classeCode: '' })
  const [bulletinsList, setBulletinsList] = useState([])
  const [loadingBulletins, setLoadingBulletins] = useState(false)
  const [viewingBulletinId, setViewingBulletinId] = useState(null)

  // Fonction pour charger les données
  const loadEtatBulletins = useCallback(async () => {
    if (!user) {
      console.log('⏳ En attente de l\'utilisateur...')
      return
    }

    try {
      console.log('🚀 Début du chargement des bulletins...')
      console.log('👤 Utilisateur:', user)
      console.log('📅 Semestre sélectionné:', selectedSemestre || 'Tous')

      setLoading(true)
      setError(null)

      const semestreParam = selectedSemestre || null
      console.log('📡 Appel API avec paramètre:', { semestre: semestreParam })

      const result = await getEtatBulletinsToutesClasses(semestreParam)

      console.log('📥 Réponse API reçue:', result)

      if (result && result.success) {
        console.log('✅ Succès - Classes reçues:', result.classes?.length || 0)

        if (result.classes && Array.isArray(result.classes)) {
          console.log('📊 Détails des classes:')
          result.classes.forEach((classe, index) => {
            console.log(`  ${index + 1}. ${classe.code} (${classe.filiere} ${classe.niveau})`)
            console.log(`     - Semestres:`, classe.semestres?.map(s => s.semestre).join(', ') || 'Aucun')
            console.log(`     - Modules requis:`, classe.nombreModulesRequis || 'Non défini')
          })

          setClassesAvecEtat(result.classes)
        } else {
          console.warn('⚠️ Aucune classe dans la réponse')
          setClassesAvecEtat([])
        }
      } else {
        const errorMessage = result?.error || 'Erreur inconnue lors du chargement'
        console.error('❌ Erreur API:', errorMessage)
        setError(errorMessage)
        setClassesAvecEtat([])
        showAlert(errorMessage, 'error')
      }
    } catch (error) {
      console.error('❌ Exception lors du chargement:', error)
      const errorMessage = error.message || 'Erreur de connexion au serveur'
      setError(errorMessage)
      setClassesAvecEtat([])
      showAlert(errorMessage, 'error')
    } finally {
      setLoading(false)
      console.log('✅ Chargement terminé')
    }
  }, [user, selectedSemestre, showAlert])

  // Charger les données au montage et quand le semestre change
  useEffect(() => {
    console.log('🔄 useEffect déclenché - user:', user?.id, 'semestre:', selectedSemestre)
    loadEtatBulletins()
  }, [loadEtatBulletins])

  // Fonction pour voir les bulletins générés
  const handleVoirBulletins = async (classeId, semestre, classeCode) => {
    try {
      setLoadingBulletins(true)
      setBulletinsModal({ open: true, classeId, semestre, classeCode })

      const result = await getBulletinsGeneres(classeId, semestre)

      if (result && result.success) {
        setBulletinsList(result.bulletins || [])
      } else {
        showAlert(result?.error || 'Erreur lors du chargement des bulletins', 'error')
        setBulletinsList([])
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('Erreur lors du chargement des bulletins', 'error')
      setBulletinsList([])
    } finally {
      setLoadingBulletins(false)
    }
  }

  // Fonction pour prévisualiser le bulletin
  const handlePreviewBulletin = async (bulletin) => {
    try {
      const token = localStorage.getItem('token')
      const API_BASE_URL = 'http://localhost:3000/api/chef-departement'

      // Faire une requête authentifiée pour récupérer les données du bulletin
      const response = await fetch(`${API_BASE_URL}/bulletins/${bulletin.id}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          showAlert('Vous n\'êtes pas autorisé à voir ce bulletin', 'error')
          return
        }
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
        showAlert(errorData.error || 'Erreur lors de la récupération du bulletin', 'error')
        return
      }

      // Récupérer les données JSON
      const result = await response.json()

      if (!result.success || !result.data) {
        showAlert('Impossible de récupérer les données du bulletin', 'error')
        return
      }

      // Pour l'instant, ouvrir les données dans une nouvelle fenêtre avec un aperçu
      // TODO: Générer un PDF réel à partir de ces données
      const previewWindow = window.open('', '_blank', 'width=800,height=600')
      if (!previewWindow) {
        showAlert('Veuillez autoriser les pop-ups pour visualiser le bulletin', 'warning')
        return
      }

      // Créer une page HTML simple pour afficher les données du bulletin
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Bulletin - ${result.data.etudiant?.nom} ${result.data.etudiant?.prenom}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px; }
            .info { margin: 20px 0; }
            .info-row { display: flex; margin: 10px 0; }
            .info-label { font-weight: bold; width: 150px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #1e40af; color: white; }
            .moyenne { font-size: 18px; font-weight: bold; color: ${result.data.moyenneGenerale >= 10 ? '#10b981' : '#ef4444'}; }
            .statut { padding: 5px 10px; border-radius: 5px; display: inline-block; }
            .valide { background: #d1fae5; color: #065f46; }
            .ajourne { background: #fee2e2; color: #991b1b; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Bulletin de Notes</h1>
            <div class="info">
              <div class="info-row">
                <span class="info-label">Étudiant:</span>
                <span>${result.data.etudiant?.nom} ${result.data.etudiant?.prenom}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Matricule:</span>
                <span>${result.data.etudiant?.matricule}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Semestre:</span>
                <span>${result.bulletin?.semestre}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Classe:</span>
                <span>${result.data.classe || 'N/A'}</span>
              </div>
            </div>
            <h2>Notes par module</h2>
            <table>
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Code</th>
                  <th>Moyenne</th>
                  <th>Crédits</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${result.data.modules?.map(mod => `
                  <tr>
                    <td>${mod.nom || '-'}</td>
                    <td>${mod.code || '-'}</td>
                    <td>${mod.moyenne !== null && mod.moyenne !== undefined ? mod.moyenne.toFixed(2) : '-'}</td>
                    <td>${mod.credit || '-'}</td>
                    <td><span class="statut ${mod.valide ? 'valide' : 'ajourne'}">${mod.valide ? 'Validé' : 'Ajourné'}</span></td>
                  </tr>
                `).join('') || '<tr><td colspan="5">Aucun module</td></tr>'}
              </tbody>
            </table>
            <div style="margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 5px;">
              <div class="info-row">
                <span class="info-label">Moyenne Générale:</span>
                <span class="moyenne">${result.data.moyenneGenerale !== null && result.data.moyenneGenerale !== undefined ? result.data.moyenneGenerale.toFixed(2) : '-'}/20</span>
              </div>
              <div class="info-row">
                <span class="info-label">Crédits Validés:</span>
                <span>${result.data.totalCreditsValides || 0}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Statut:</span>
                <span class="statut ${result.data.statut === 'VALIDE' ? 'valide' : 'ajourne'}">
                  ${result.data.statut === 'VALIDE' ? 'Validé' : result.data.statut === 'AJOURNE' ? 'Ajourné' : 'En attente'}
                </span>
              </div>
            </div>
            <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
              <p>Date de génération: ${result.bulletin?.date_generation ? new Date(result.bulletin.date_generation).toLocaleDateString('fr-FR') : '-'}</p>
            </div>
          </div>
        </body>
        </html>
      `)
      previewWindow.document.close()

    } catch (error) {
      console.error('Erreur lors de la prévisualisation:', error)
      showAlert('Erreur lors de la prévisualisation du bulletin: ' + (error.message || 'Erreur inconnue'), 'error')
    }
  }

  // Fonction pour générer les bulletins
  const handleGenererBulletins = async (classeId, semestre, classeCode) => {
    if (!window.confirm(
      `Êtes-vous sûr de vouloir générer les bulletins pour ${classeCode} - ${semestre} ?\n\n` +
      `Les bulletins seront générés pour TOUS les étudiants de la classe et envoyés en attente de visa au DEP.`
    )) {
      return
    }

    const key = `${classeId}_${semestre}`
    try {
      console.log('🚀 Génération des bulletins pour:', { classeId, semestre, classeCode })
      setGenerationLoading(prev => ({ ...prev, [key]: true }))

      const result = await genererBulletins(classeId, semestre)

      console.log('📥 Résultat de la génération:', result)

      if (result && result.success) {
        showAlert(result.message || 'Bulletins générés avec succès', 'success')
        // Recharger l'état après un court délai
        setTimeout(() => {
          loadEtatBulletins()
        }, 1000)
      } else {
        const errorMessage = result?.error || 'Erreur lors de la génération'
        console.error('❌ Erreur génération:', errorMessage)
        showAlert(errorMessage, 'error')
      }
    } catch (error) {
      console.error('❌ Exception lors de la génération:', error)
      showAlert('Erreur lors de la génération des bulletins', 'error')
    } finally {
      setGenerationLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  // Grouper les classes par filière et niveau
  const classesGrouped = classesAvecEtat.reduce((acc, classe) => {
    const filiere = classe.filiere || 'Autres'
    const niveau = classe.niveau || 'Autres'
    const key = `${filiere}_${niveau}`

    if (!acc[key]) {
      acc[key] = {
        filiere,
        niveau,
        classes: []
      }
    }

    acc[key].classes.push(classe)
    return acc
  }, {})

  // Filtrer par filière et niveau
  let classesFiltrees = Object.values(classesGrouped)
  if (selectedFiliere) {
    classesFiltrees = classesFiltrees.filter(g => g.filiere === selectedFiliere)
  }
  if (selectedNiveau) {
    classesFiltrees = classesFiltrees.filter(g => g.niveau === selectedNiveau)
  }

  // Obtenir les filières et niveaux uniques
  const filieres = [...new Set(classesAvecEtat.map(c => c.filiere).filter(Boolean))].sort()
  const niveaux = [...new Set(classesAvecEtat.map(c => c.niveau).filter(Boolean))].sort()

  // Écran de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32 flex items-center justify-center">
            <div className="text-center">
              <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-600 animate-spin mb-4" />
              <p className="text-slate-600">Chargement des données...</p>
              <p className="text-sm text-slate-400 mt-2">Connexion au serveur...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Bulletins</h1>
              <p className="text-sm text-slate-600">
                Générez les bulletins pour les classes dont toutes les notes sont saisies
              </p>
            </div>
            <button
              onClick={loadEtatBulletins}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              title="Actualiser les données"
            >
              <FontAwesomeIcon icon={faRefresh} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-800">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <span className="font-medium">Erreur de chargement</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button
                onClick={loadEtatBulletins}
                className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Filtres */}
          <div className="bg-white rounded-xl shadow-md p-4 border border-slate-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Filière</label>
                <select
                  value={selectedFiliere}
                  onChange={(e) => setSelectedFiliere(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes les filières</option>
                  {filieres.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Niveau</label>
                <select
                  value={selectedNiveau}
                  onChange={(e) => setSelectedNiveau(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les niveaux</option>
                  {niveaux.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Semestre</label>
                <select
                  value={selectedSemestre}
                  onChange={(e) => setSelectedSemestre(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les semestres</option>
                  <option value="S1">S1</option>
                  <option value="S2">S2</option>
                  <option value="S3">S3</option>
                  <option value="S4">S4</option>
                  <option value="S5">S5</option>
                  <option value="S6">S6</option>
                </select>
              </div>
            </div>
          </div>

          {/* Liste des classes */}
          {classesFiltrees.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <FontAwesomeIcon icon={faGraduationCap} className="text-6xl text-slate-300 mb-4" />
              <p className="text-slate-600 text-lg mb-2">
                {error ? 'Erreur de chargement' : 'Aucune classe trouvée'}
              </p>
              {!error && (
                <p className="text-sm text-slate-400">
                  {selectedFiliere || selectedNiveau || selectedSemestre
                    ? 'Essayez de modifier les filtres'
                    : 'Aucune classe disponible pour votre département'}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {classesFiltrees.map((groupe, idx) => (
                <div key={`${groupe.filiere}_${groupe.niveau}_${idx}`} className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">
                    {groupe.filiere} {groupe.niveau}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupe.classes.map((classe) => {
                      // Trouver le semestre à afficher
                      const semestreData = selectedSemestre
                        ? classe.semestres?.find(s => s.semestre === selectedSemestre)
                        : classe.semestres?.[0] // Prendre le premier semestre si aucun n'est sélectionné

                      if (!semestreData) return null

                      const {
                        semestre,
                        pretPourGeneration,
                        pourcentageNotes,
                        modulesAvecNotesCompletes,
                        modulesAvecNotes, // Nombre de modules avec au moins une note saisie
                        nombreModulesRequis,
                        nombreModulesDisponibles,
                        nombreEtudiants,
                        etudiantsAvecNotesCompletes,
                        bulletinsExistent,
                        nombreBulletinsGeneres
                      } = semestreData

                      // Utiliser modulesAvecNotes si disponible, sinon modulesAvecNotesCompletes
                      const modulesAvecNotesSaisies = modulesAvecNotes !== undefined ? modulesAvecNotes : modulesAvecNotesCompletes
                      const modulesRequis = nombreModulesRequis || classe.nombreModulesRequis || 0
                      const modulesDisponibles = nombreModulesDisponibles || modulesRequis || 0
                      const key = `${classe.id}_${semestre}`
                      const isLoading = generationLoading[key]

                      return (
                        <div key={`${classe.id}_${semestre}`} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-bold text-lg text-slate-800">{classe.code}</h4>
                              <p className="text-sm text-slate-500">{classe.nom}</p>
                            </div>
                            <div className="bg-blue-50 p-2 rounded-lg">
                              <FontAwesomeIcon icon={faFilePdf} className="text-blue-600" />
                            </div>
                          </div>

                          {/* Statut */}
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              {bulletinsExistent ? (
                                <>
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1">
                                    <FontAwesomeIcon icon={faFilePdf} />
                                    Généré
                                  </span>
                                  <span className="text-sm font-semibold text-blue-700">{nombreBulletinsGeneres || 0} bulletin(s)</span>
                                </>
                              ) : pretPourGeneration ? (
                                <>
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                    Prêt
                                  </span>
                                  <span className="text-sm font-semibold text-green-700">100%</span>
                                </>
                              ) : (
                                <>
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1">
                                    <FontAwesomeIcon icon={faExclamationTriangle} />
                                    En cours
                                  </span>
                                  <span className="text-sm font-semibold text-yellow-700">{Math.round(pourcentageNotes || 0)}%</span>
                                </>
                              )}
                            </div>
                            <div className="text-xs text-slate-600 mb-1">Notes saisies</div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${pretPourGeneration ? 'bg-green-600' : 'bg-yellow-500'}`}
                                style={{ width: `${Math.min(pourcentageNotes || 0, 100)}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Détails */}
                          <div className="space-y-1 mb-3">
                            <div className="flex items-center justify-between text-sm text-slate-600">
                              <span className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faFileAlt} className="text-xs" />
                                Modules
                              </span>
                              <span className="font-medium">
                                {modulesAvecNotesSaisies}/{modulesDisponibles > 0 ? modulesDisponibles : modulesRequis}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-slate-600">
                              <span className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faGraduationCap} className="text-xs" />
                                Étudiants
                              </span>
                              <span className="font-medium">
                                {etudiantsAvecNotesCompletes || 0}/{nombreEtudiants || 0}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-slate-600">
                              <span className="flex items-center gap-1">
                                <FontAwesomeIcon icon={faCalendarAlt} className="text-xs" />
                                Semestre
                              </span>
                              <span className="font-medium">{semestre}</span>
                            </div>
                          </div>

                          {/* Boutons d'action */}
                          {bulletinsExistent ? (
                            <div className="space-y-2 mt-3">
                              <button
                                onClick={() => handleVoirBulletins(classe.id, semestre, classe.code)}
                                className="w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <FontAwesomeIcon icon={faEye} />
                                <span>Voir les bulletins ({nombreBulletinsGeneres || 0})</span>
                              </button>
                              <button
                                onClick={() => handleGenererBulletins(classe.id, semestre, classe.code)}
                                disabled={isLoading}
                                className="w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 bg-slate-400 hover:bg-slate-500 text-white disabled:opacity-50"
                                title="Régénérer les bulletins (les anciens seront remplacés)"
                              >
                                {isLoading ? (
                                  <>
                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                    <span>Régénération...</span>
                                  </>
                                ) : (
                                  <>
                                    <FontAwesomeIcon icon={faRefresh} />
                                    <span>Régénérer</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleGenererBulletins(classe.id, semestre, classe.code)}
                              disabled={!pretPourGeneration || isLoading}
                              className={`w-full mt-3 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${pretPourGeneration
                                ? 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50'
                                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                }`}
                            >
                              {isLoading ? (
                                <>
                                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                  <span>Génération...</span>
                                </>
                              ) : pretPourGeneration ? (
                                <>
                                  <FontAwesomeIcon icon={faFileAlt} />
                                  <span>Générer les bulletins</span>
                                </>
                              ) : (
                                <>
                                  <FontAwesomeIcon icon={faExclamationTriangle} />
                                  <span>Notes incomplètes</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal pour voir les bulletins générés */}
          {bulletinsModal.open && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Bulletins générés</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      {bulletinsModal.classeCode} - {bulletinsModal.semestre}
                    </p>
                  </div>
                  <button
                    onClick={() => setBulletinsModal({ open: false, classeId: null, semestre: null, classeCode: '' })}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-slate-600" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {loadingBulletins ? (
                    <div className="flex items-center justify-center py-12">
                      <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-600 animate-spin" />
                    </div>
                  ) : bulletinsList.length === 0 ? (
                    <div className="text-center py-12">
                      <FontAwesomeIcon icon={faFilePdf} className="text-6xl text-slate-300 mb-4" />
                      <p className="text-slate-600">Aucun bulletin trouvé</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-800">
                          <strong>{bulletinsList.length}</strong> bulletin(s) généré(s) pour cette classe et ce semestre
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Étudiant</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Matricule</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Statut Visa</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Date génération</th>
                              <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {bulletinsList.map((bulletin) => (
                              <tr key={bulletin.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm text-slate-800">
                                  {bulletin.etudiants?.nom} {bulletin.etudiants?.prenom}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                  {bulletin.etudiants?.matricule}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${bulletin.statut_visa === 'VISE'
                                    ? 'bg-green-100 text-green-800'
                                    : bulletin.statut_visa === 'REJETE'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {bulletin.statut_visa === 'VISE' ? 'Visé' :
                                      bulletin.statut_visa === 'REJETE' ? 'Rejeté' :
                                        'En attente'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                  {bulletin.date_generation
                                    ? new Date(bulletin.date_generation).toLocaleDateString('fr-FR')
                                    : '-'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={async () => {
                                        try {
                                          setViewingBulletinId(bulletin.id)
                                          const token = localStorage.getItem('token')
                                          const API_BASE_URL = 'http://localhost:3000/api/chef-departement'

                                          // Télécharger le PDF et l'ouvrir dans un nouvel onglet
                                          const response = await fetch(`${API_BASE_URL}/bulletins/${bulletin.id}/download-pdf`, {
                                            method: 'GET',
                                            headers: {
                                              'Authorization': `Bearer ${token}`
                                            }
                                          })

                                          if (!response.ok) {
                                            const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
                                            showAlert(errorData.error || 'Erreur lors du chargement', 'error')
                                            return
                                          }

                                          // Créer un blob et l'ouvrir dans un nouvel onglet
                                          const blob = await response.blob()
                                          const url = window.URL.createObjectURL(blob)
                                          window.open(url, '_blank')

                                          // Nettoyer l'URL après un délai
                                          setTimeout(() => window.URL.revokeObjectURL(url), 1000)
                                        } catch (error) {
                                          console.error('Erreur lors de la prévisualisation:', error)
                                          showAlert('Erreur lors de la prévisualisation: ' + (error.message || 'Erreur inconnue'), 'error')
                                        } finally {
                                          setViewingBulletinId(null)
                                        }
                                      }}
                                      disabled={viewingBulletinId === bulletin.id}
                                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                      title="Voir le bulletin PDF officiel INPTIC"
                                    >
                                      {viewingBulletinId === bulletin.id ? (
                                        <>
                                          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                          <span>Chargement...</span>
                                        </>
                                      ) : (
                                        <>
                                          <FontAwesomeIcon icon={faEye} />
                                          <span>Voir</span>
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={async () => {
                                        try {
                                          const token = localStorage.getItem('token')
                                          const API_BASE_URL = 'http://localhost:3000/api/chef-departement'

                                          // Télécharger le PDF
                                          const response = await fetch(`${API_BASE_URL}/bulletins/${bulletin.id}/download-pdf`, {
                                            method: 'GET',
                                            headers: {
                                              'Authorization': `Bearer ${token}`
                                            }
                                          })

                                          if (!response.ok) {
                                            const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
                                            showAlert(errorData.error || 'Erreur lors du téléchargement', 'error')
                                            return
                                          }

                                          // Créer un blob et télécharger
                                          const blob = await response.blob()
                                          const url = window.URL.createObjectURL(blob)
                                          const a = document.createElement('a')
                                          a.href = url
                                          a.download = `Bulletin_${bulletin.etudiants?.nom}_${bulletin.etudiants?.prenom}_${bulletinsModal.semestre}.pdf`
                                          document.body.appendChild(a)
                                          a.click()
                                          window.URL.revokeObjectURL(url)
                                          document.body.removeChild(a)

                                          showAlert('Bulletin téléchargé avec succès', 'success')
                                        } catch (error) {
                                          console.error('Erreur lors du téléchargement:', error)
                                          showAlert('Erreur lors du téléchargement: ' + (error.message || 'Erreur inconnue'), 'error')
                                        }
                                      }}
                                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2"
                                      title="Télécharger le bulletin PDF officiel INPTIC"
                                    >
                                      <FontAwesomeIcon icon={faDownload} />
                                      <span>Télécharger</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default BulletinsView
