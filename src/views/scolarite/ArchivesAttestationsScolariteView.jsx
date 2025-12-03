import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faArchive, faArrowLeft, faDownload, faSearch, faCalendarAlt, faGraduationCap, faSchool, faUsers
} from '@fortawesome/free-solid-svg-icons'
import html2pdf from 'html2pdf.js'
import SidebarScolarite from '../../components/common/SidebarScolarite'
import HeaderScolarite from '../../components/common/HeaderScolarite'
import SidebarChef from '../../components/common/SidebarChef'
import HeaderChef from '../../components/common/HeaderChef'
import { getPromotions, getFilieres, getNiveauxDisponibles, getFormations, getAttestationsArchiveesParFiliereNiveau } from '../../api/scolarite'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAlert } from '../../contexts/AlertContext'

const ArchivesAttestationsScolariteView = () => {
  const location = useLocation()
  const isChefView = location.pathname.startsWith('/chef-scolarite')
  const Sidebar = isChefView ? SidebarChef : SidebarScolarite
  const Header = isChefView ? HeaderChef : HeaderScolarite
  const { error: alertError } = useAlert()
  const [selectedPromotion, setSelectedPromotion] = useState('')
  const [selectedFormation, setSelectedFormation] = useState('')
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // États pour les données de la base
  const [promotions, setPromotions] = useState([])
  const [formations, setFormations] = useState([])
  const [filieres, setFilieres] = useState([])
  const [niveaux, setNiveaux] = useState([])
  const [attestationsArchivees, setAttestationsArchivees] = useState([])

  // Charger les promotions, formations et filières au montage
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [promotionsData, formationsData, filieresData] = await Promise.all([
          getPromotions(),
          getFormations(),
          getFilieres()
        ])
        setPromotions(promotionsData)
        setFormations(formationsData)
        setFilieres(filieresData)
      } catch (error) {
        console.error('Erreur lors du chargement:', error)
        alertError('Erreur lors du chargement des données')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [alertError])

  // Charger les niveaux quand filière est sélectionnée (récupérer tous les niveaux disponibles pour cette filière)
  // On utilise la première formation disponible pour récupérer les niveaux
  useEffect(() => {
    if (selectedFiliere && formations.length > 0 && !selectedNiveau) {
      const loadNiveaux = async () => {
        try {
          // Utiliser la première formation pour récupérer les niveaux
          // Les niveaux sont généralement les mêmes pour toutes les formations d'une filière
          const niveauxData = await getNiveauxDisponibles(formations[0].id, selectedFiliere)
          setNiveaux(niveauxData)
        } catch (error) {
          console.error('Erreur lors du chargement des niveaux:', error)
        }
      }
      loadNiveaux()
    } else if (!selectedFiliere) {
      setNiveaux([])
    }
  }, [selectedFiliere, formations])

  // Charger les attestations archivées quand promotion, filière et niveau sont sélectionnés (sans formation)
  useEffect(() => {
    if (selectedPromotion && selectedFiliere && selectedNiveau) {
      const loadAttestations = async () => {
        try {
          setLoading(true)
          // Passer null pour formationId pour récupérer toutes les formations
          const attestations = await getAttestationsArchiveesParFiliereNiveau(
            selectedPromotion,
            selectedFiliere,
            selectedNiveau,
            null // Pas de filtre par formation
          )
          
          if (!attestations || !Array.isArray(attestations)) {
            setAttestationsArchivees([])
            return
          }
          
          setAttestationsArchivees(attestations)
        } catch (error) {
          console.error('Erreur lors du chargement des attestations:', error)
          alertError('Erreur lors du chargement des attestations')
          setAttestationsArchivees([])
        } finally {
          setLoading(false)
        }
      }
      loadAttestations()
    } else {
      setAttestationsArchivees([])
    }
  }, [selectedPromotion, selectedFiliere, selectedNiveau, alertError])

  const generateAttestationPDF = async (attestation) => {
    const element = document.createElement('div')
    element.style.width = '210mm'
    element.style.height = '297mm'
    element.style.overflow = 'hidden'
    element.style.position = 'absolute'
    element.style.left = '-9999px'
    element.style.backgroundColor = '#e5e7eb'
    element.innerHTML = `
      <div style="padding: 2cm; height: 100%; display: flex; flex-direction: column; position: relative;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 72pt; font-weight: bold; color: rgba(0, 0, 0, 0.1); font-family: Arial, sans-serif; z-index: 1; pointer-events: none; white-space: nowrap;">DUPLICATA - Conforme à l'original</div>
        
        <div style="z-index: 2; position: relative;">
          <div style="margin-bottom: 3rem;">
            <div style="display: flex; justify-content: flex-start; margin-bottom: 0.5rem;">
              <img src="${window.location.origin}/images/logo.png" alt="Logo INPTIC" style="height: 80px;" crossorigin="anonymous" />
            </div>
            <div style="text-align: left; font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.2;">
              <p style="font-weight: bold; margin: 0; font-size: 10pt;">DIRECTION GENERALE</p>
              <p style="font-weight: bold; margin: 0; font-size: 10pt;">LA DIRECTION DE LA SCOLARITE ET DES EXAMENS</p>
              <p style="font-weight: bold; margin-top: 0.25rem; font-size: 10pt;">${attestation.numero}</p>
            </div>
          </div>

          <div style="background-color: #A8C9E4; border: 3px solid #2C3E50; padding: 15px 0; margin-bottom: 3rem; width: 100%; display: flex; justify-content: center; align-items: center;">
            <h1 style="font-family: Arial, sans-serif; font-size: 18pt; letter-spacing: 4px; color: #000; font-weight: bold; margin: 0; text-align: center;">ATTESTATION DE SCOLARITE</h1>
          </div>

          <div style="font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.3; flex: 1;">
            <p style="margin-bottom: 1rem; text-align: justify; text-indent: 2cm;">
              Je soussigné, Soilihi ALI ISSILAM, Directeur de la Scolarité et des Examens de 
              l'Institut National de la Poste, des Technologies de l'Information et de la 
              Communication (INPTIC), atteste que l'étudiant(e) <strong>${attestation.etudiant}</strong> suit 
              la formation ci-dessous dans notre établissement.
            </p>

            <div style="margin-bottom: 1rem; padding-left: 1.5cm;">
              <p style="margin-bottom: 0.25rem; display: flex; align-items: baseline;">
                <span style="margin-right: 0.5cm;">➤</span>
                <span><strong>Matricule :</strong> ${attestation.matricule}</span>
              </p>
              <p style="margin-bottom: 0.25rem; display: flex; align-items: baseline;">
                <span style="margin-right: 0.5cm;">➤</span>
                <span><strong>Niveau d'études :</strong> ${selectedNiveau}</span>
              </p>
              <p style="margin-bottom: 0.25rem; display: flex; align-items: baseline;">
                <span style="margin-right: 0.5cm;">➤</span>
                <span><strong>Filière :</strong> ${selectedFiliere}</span>
              </p>
              <p style="margin-bottom: 0.25rem; display: flex; align-items: baseline;">
                <span style="margin-right: 0.5cm;">➤</span>
                <span><strong>Programme :</strong> ${attestation.formation}</span>
              </p>
              <p style="margin-bottom: 0.25rem; display: flex; align-items: baseline;">
                <span style="margin-right: 0.5cm;">➤</span>
                <span><strong>Année académique :</strong> ${selectedPromotion}</span>
              </p>
            </div>

            <p style="text-align: justify; text-indent: 2cm;">
              En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que 
              de droit.
            </p>
          </div>

          <div style="flex-grow: 1; min-height: 100px;"></div>

          <div style="font-family: Arial, sans-serif; font-size: 12pt;">
            <div style="display: flex; justify-content: flex-end;">
              <div style="width: 300px; position: relative;">
                <p style="text-align: right; margin-bottom: 4rem; font-size: 12pt; white-space: nowrap;">Fait à Libreville, le ${attestation.dateGeneration} ${new Date().getFullYear()}</p>
                
                <p style="font-weight: bold; margin-bottom: 0.5rem; text-align: right; font-size: 12pt; white-space: nowrap;">Directeur de la Scolarité et des Examens</p>
                
                <div style="position: relative; height: 120px; display: flex; align-items: center; justify-content: center;">
                  <img src="${window.location.origin}/images/cachet.png" alt="Cachet" style="width: 140px; height: auto; display: block; margin: 0 auto;" crossorigin="anonymous" />
                </div>
                
                <p style="font-weight: bold; text-align: center; font-size: 12pt;">Soilihi ALI ISSILAM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(element)
    
    // Attendre que les images soient chargées
    await new Promise((resolve) => {
      const images = element.getElementsByTagName('img')
      let loadedCount = 0
      const totalImages = images.length
      
      if (totalImages === 0) {
        resolve()
        return
      }
      
      const checkAllLoaded = () => {
        loadedCount++
        if (loadedCount === totalImages) {
          // Attendre encore un peu pour être sûr
          setTimeout(resolve, 500)
        }
      }
      
      for (let img of images) {
        if (img.complete) {
          checkAllLoaded()
        } else {
          img.onload = checkAllLoaded
          img.onerror = checkAllLoaded
        }
      }
    })
    
    const opt = {
      margin: 0,
      filename: `Attestation_Duplicata_${attestation.matricule}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        logging: false
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    
    await html2pdf().set(opt).from(element).save()
    document.body.removeChild(element)
  }

  const handleBack = () => {
    if (selectedNiveau) {
      setSelectedNiveau('')
      setAttestationsArchivees([])
    } else if (selectedFiliere) {
      setSelectedFiliere('')
      setNiveaux([])
    } else if (selectedPromotion) {
      setSelectedPromotion('')
    }
    setSearchQuery('')
    setCurrentPage(1)
  }

  // Vue: Liste des attestations archivées
  if (selectedPromotion && selectedFiliere && selectedNiveau) {
    const promotion = promotions.find(p => p.id === selectedPromotion)
    const filiere = filieres.find(f => f.id === selectedFiliere)
    const niveau = niveaux.find(n => n.id === selectedNiveau)

    const filteredAttestations = attestationsArchivees.filter(att => {
      const nomComplet = `${att.etudiant?.prenom || ''} ${att.etudiant?.nom || ''}`.toLowerCase()
      const matricule = (att.etudiant?.matricule || '').toLowerCase()
      const numero = (att.numero || '').toLowerCase()
      const query = searchQuery.toLowerCase()
      return nomComplet.includes(query) || matricule.includes(query) || numero.includes(query)
    })

    const totalPages = Math.ceil(filteredAttestations.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedAttestations = filteredAttestations.slice(startIndex, startIndex + itemsPerPage)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-28 lg:pt-28">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faArchive} className="text-blue-600" />
                Archives des attestations
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                {promotion?.nom || promotion?.anneeAcademique} • {filiere?.nom} • {niveau?.nom || niveau?.code}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800">Attestations archivées</h2>
                  <span className="text-sm text-slate-600">{filteredAttestations.length} attestation(s)</span>
                </div>
                
                {/* Barre de recherche */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faSearch} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Rechercher par nom, matricule ou numéro..."
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b-2 border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Étudiant</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Matricule</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Formation</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Date de génération</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">N° Attestation</th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <LoadingSpinner size="md" text="Chargement des attestations..." />
                        </td>
                      </tr>
                    ) : paginatedAttestations.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                          Aucune attestation archivée trouvée
                        </td>
                      </tr>
                    ) : (
                      paginatedAttestations.map((attestation) => {
                        // Gérer les deux formats possibles
                        const nomComplet = typeof attestation.etudiant === 'string' 
                          ? attestation.etudiant 
                          : `${attestation.etudiant?.prenom || ''} ${attestation.etudiant?.nom || ''}`.trim()
                        const matricule = attestation.matricule || attestation.etudiant?.matricule || 'N/A'
                        const dateGen = attestation.dateGeneration 
                          ? (typeof attestation.dateGeneration === 'string' 
                              ? attestation.dateGeneration 
                              : new Date(attestation.dateGeneration).toLocaleDateString('fr-FR', { 
                                  day: 'numeric', 
                                  month: 'long', 
                                  year: 'numeric' 
                                }))
                          : 'N/A'
                        const formationNom = attestation.formation || 'N/A'
                        return (
                          <tr key={attestation.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-800">{nomComplet || 'N/A'}</p>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{matricule}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{formationNom}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{dateGen}</td>
                            <td className="px-6 py-4 text-sm text-slate-600">{attestation.numero || 'N/A'}</td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => generateAttestationPDF({
                                  ...attestation,
                                  etudiant: nomComplet,
                                  matricule: matricule,
                                  formation: formationNom,
                                  dateGeneration: dateGen,
                                  numero: attestation.numero || 'N/A'
                                })}
                                className="px-3 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-sm inline-flex items-center gap-2"
                              >
                                <FontAwesomeIcon icon={faDownload} />
                                Télécharger PDF
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-6 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Affichage {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredAttestations.length)} sur {filteredAttestations.length} résultats
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        currentPage === 1
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      Précédent
                    </button>
                    <span className="px-4 py-2 text-slate-700">
                      Page {currentPage} sur {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        currentPage === totalPages
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    )
  }


  // Vue: Sélection du niveau
  if (selectedFiliere && selectedFormation && !selectedNiveau) {
    const filiere = filieres.find(f => f.id === selectedFiliere)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-28 lg:pt-28">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faGraduationCap} className="text-blue-600" />
                Choisissez le niveau
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                {promotions.find(p => p.id === selectedPromotion)?.nom || promotions.find(p => p.id === selectedPromotion)?.anneeAcademique} • {filiere?.nom}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" text="Chargement des niveaux..." />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {niveaux.map((niveau) => (
                  <button
                    key={niveau.id}
                    onClick={() => setSelectedNiveau(niveau.id)}
                    className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-blue-500"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                        <FontAwesomeIcon icon={faGraduationCap} className="text-white text-2xl" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">{niveau.nom || niveau.code}</h3>
                      <p className="text-sm text-slate-600">{niveau.code || niveau.id}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    )
  }

  // Vue: Sélection de la filière
  if (selectedPromotion) {
    const promotion = promotions.find(p => p.id === selectedPromotion)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-28 lg:pt-28">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faArchive} className="text-blue-600" />
                Choisissez la filière
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Promotion {promotion?.nom}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filieres.map((filiere) => (
                <button
                  key={filiere.id}
                  onClick={() => setSelectedFiliere(filiere.id)}
                  className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-blue-500"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                      <FontAwesomeIcon icon={faArchive} className="text-white text-2xl" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{filiere.id}</h3>
                    <p className="text-sm text-slate-600 text-center">{filiere.nom}</p>
                  </div>
                </button>
              ))}
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue: Sélection de la promotion
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Sidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-28 lg:pt-28">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
              <FontAwesomeIcon icon={faArchive} className="text-blue-600" />
              Archives des attestations de scolarité
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Consultez et téléchargez les attestations archivées (avec duplicata)
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" text="Chargement des promotions..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((promotion) => (
                <button
                  key={promotion.id}
                  onClick={() => setSelectedPromotion(promotion.id)}
                  className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-blue-500"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-white text-2xl" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{promotion.nom || promotion.anneeAcademique}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      promotion.statut === 'EN_COURS'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {promotion.statut === 'EN_COURS' ? 'En cours' : 'Archivé'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default ArchivesAttestationsScolariteView

