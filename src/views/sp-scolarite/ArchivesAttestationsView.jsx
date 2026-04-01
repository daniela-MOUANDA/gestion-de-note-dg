import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArchive, faArrowLeft, faDownload, faFileAlt, faCalendarAlt, faGraduationCap, faSchool, faUsers, faSearch, faChevronLeft, faChevronRight
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import html2pdf from 'html2pdf.js'
import { getPromotions, getFilieres, getNiveauxDisponibles, getFormations } from '../../api/scolarite'
import { getAttestationsArchiveesParFiliereNiveau } from '../../api/scolarite'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAlert } from '../../contexts/AlertContext'

const ArchivesAttestationsView = () => {
  const { error: alertError } = useAlert()
  const [selectedPromotion, setSelectedPromotion] = useState('')
  const [selectedFormation, setSelectedFormation] = useState('')
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [attestationToView, setAttestationToView] = useState(null)
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
          getFilieres({ sansGroupes: true })
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

  // Charger les niveaux quand formation et filière sont sélectionnés
  useEffect(() => {
    if (selectedFormation && selectedFiliere) {
      const loadNiveaux = async () => {
        try {
          const niveauxData = await getNiveauxDisponibles(selectedFormation, selectedFiliere)
          setNiveaux(niveauxData)
        } catch (error) {
          console.error('Erreur lors du chargement des niveaux:', error)
        }
      }
      loadNiveaux()
    } else {
      setNiveaux([])
    }
  }, [selectedFormation, selectedFiliere])

  // Charger les attestations archivées quand promotion, filière et niveau sont sélectionnés (formation optionnelle)
  useEffect(() => {
    if (selectedPromotion && selectedFiliere && selectedNiveau) {
      const loadAttestations = async () => {
        try {
          console.log('Chargement des attestations avec les paramètres:', {
            promotion: selectedPromotion,
            filiere: selectedFiliere,
            niveau: selectedNiveau,
            formation: selectedFormation || null
          })

          setLoading(true)
          // Passer null pour formationId si non sélectionné (pour récupérer toutes les formations)
          const attestations = await getAttestationsArchiveesParFiliereNiveau(
            selectedPromotion,
            selectedFiliere,
            selectedNiveau,
            selectedFormation || null
          )

          console.log('Réponse de l\'API (attestations):', attestations)

          if (!attestations || !Array.isArray(attestations)) {
            console.error('Format de données invalide reçu:', attestations)
            setAttestationsArchivees([])
            return
          }

          setAttestationsArchivees(attestations)
        } catch (error) {
          console.error('Erreur lors du chargement des attestations:', error)
          alertError(error.message || 'Erreur lors du chargement des attestations archivées')
          setAttestationsArchivees([])
        } finally {
          setLoading(false)
        }
      }
      loadAttestations()
    } else {
      setAttestationsArchivees([])
    }
  }, [selectedPromotion, selectedFiliere, selectedNiveau, selectedFormation, alertError])

  const handleDownloadAttestation = async (attestation) => {
    try {
      // Gérer les deux formats possibles pour l'étudiant
      const nomComplet = typeof attestation.etudiant === 'string'
        ? attestation.etudiant
        : `${attestation.etudiant?.prenom || ''} ${attestation.etudiant?.nom || ''}`.trim()
      const matricule = attestation.matricule || attestation.etudiant?.matricule || 'N/A'
      const formation = attestation.formation || 'N/A'
      const filiere = attestation.filiere || 'N/A'
      const niveau = attestation.niveau || attestation.niveauFull || 'N/A'
      const anneeAcademique = attestation.anneeAcademique || 'N/A'
      const dateGeneration = attestation.dateGenerationISO
        ? new Date(attestation.dateGenerationISO).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        : attestation.dateGeneration || new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

      // Récupérer les informations de promotion, filière et niveau depuis les états
      const promotion = promotions.find(p => p.id === selectedPromotion)
      const filiereObj = filieres.find(f => f.id === selectedFiliere)
      const niveauObj = niveaux.find(n => n.id === selectedNiveau)

      // Créer l'élément HTML pour le PDF
      const element = document.createElement('div')
      element.style.width = '210mm'
      element.style.height = '297mm'
      element.style.maxHeight = '297mm'
      element.style.overflow = 'hidden'
      element.style.position = 'absolute'
      element.style.left = '0'
      element.style.top = '0'
      element.style.zIndex = '-1'
      element.style.backgroundColor = '#ffffff'
      element.style.boxSizing = 'border-box'
      element.style.pageBreakInside = 'avoid'
      element.innerHTML = `
        <div style="padding: 2cm; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; position: relative; background-color: #ffffff; page-break-inside: avoid;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 72pt; font-weight: bold; color: rgba(0, 0, 0, 0.1); font-family: Arial, sans-serif; z-index: 1; pointer-events: none; white-space: nowrap;">DUPLICATA - Conforme à l'original</div>
          
          <div style="z-index: 2; position: relative; page-break-inside: avoid;">
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
                Communication (INPTIC), atteste que l'étudiant(e) <strong>${nomComplet}</strong> suit 
                la formation ci-dessous dans notre établissement.
              </p>

              <div style="margin-bottom: 1rem; padding-left: 1.5cm;">
                <p style="margin-bottom: 0.25rem; display: flex; align-items: baseline;">
                  <span style="margin-right: 0.5cm;">➤</span>
                  <span><strong>Matricule :</strong> ${matricule}</span>
                </p>
                <p style="margin-bottom: 0.25rem; display: flex; align-items: baseline;">
                  <span style="margin-right: 0.5cm;">➤</span>
                  <span><strong>Niveau d'études :</strong> ${niveau}</span>
                </p>
                <p style="margin-bottom: 0.25rem; display: flex; align-items: baseline;">
                  <span style="margin-right: 0.5cm;">➤</span>
                  <span><strong>Filière :</strong> ${filiere}</span>
                </p>
                <p style="margin-bottom: 0.25rem; display: flex; align-items: baseline;">
                  <span style="margin-right: 0.5cm;">➤</span>
                  <span><strong>Programme :</strong> ${formation}</span>
                </p>
                <p style="margin-bottom: 0.25rem; display: flex; align-items: baseline;">
                  <span style="margin-right: 0.5cm;">➤</span>
                  <span><strong>Année académique :</strong> ${anneeAcademique}</span>
                </p>
              </div>

              <p style="text-align: justify; text-indent: 2cm;">
                En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que 
                de droit.
              </p>
            </div>

            <div style="flex-grow: 1; min-height: 40px; max-height: 80px;"></div>

            <div style="font-family: Arial, sans-serif; font-size: 12pt;">
              <div style="display: flex; justify-content: flex-end;">
                <div style="width: 300px; position: relative;">
                  <p style="text-align: right; margin-bottom: 4rem; font-size: 12pt; white-space: nowrap;">Fait à Libreville, le ${dateGeneration}</p>
                  
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

      // Attendre que le DOM soit complètement rendu
      await new Promise(resolve => setTimeout(resolve, 300))

      // Attendre que les images soient chargées
      await new Promise((resolve) => {
        const images = element.getElementsByTagName('img')
        let loadedCount = 0
        const totalImages = images.length

        if (totalImages === 0) {
          setTimeout(resolve, 1000)
          return
        }

        let timeoutId = setTimeout(() => {
          console.warn('Timeout lors du chargement des images, génération du PDF quand même')
          resolve()
        }, 10000)

        const checkAllLoaded = () => {
          loadedCount++
          if (loadedCount === totalImages) {
            clearTimeout(timeoutId)
            // Attendre encore un peu pour être sûr que tout est rendu
            setTimeout(resolve, 1000)
          }
        }

        for (let img of images) {
          // Forcer le rechargement si nécessaire
          if (img.complete && img.naturalHeight !== 0) {
            checkAllLoaded()
          } else {
            img.onload = () => {
              checkAllLoaded()
            }
            img.onerror = () => {
              console.warn('Erreur de chargement d\'image:', img.src)
              checkAllLoaded() // Continuer même si l'image échoue
            }
            // Forcer le chargement
            const src = img.src
            img.src = ''
            img.src = src
          }
        }
      })

      // Attendre encore un peu pour le rendu final
      await new Promise(resolve => setTimeout(resolve, 1000))

      const opt = {
        margin: [0, 0, 0, 0],
        filename: `Attestation_Duplicata_${matricule.replace(/\s+/g, '_')}_${attestation.numero.replace(/\//g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          windowWidth: 794,
          windowHeight: 1123,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: false
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: true,
          precision: 16,
          putOnlyUsedFonts: true
        },
        pagebreak: { mode: 'avoid-all' }
      }

      try {
        console.log('Début de la génération du PDF pour:', nomComplet)
        console.log('Dimensions de l\'élément:', element.offsetWidth, element.offsetHeight)
        await html2pdf().set(opt).from(element).save()
        console.log('PDF généré avec succès')
      } catch (pdfError) {
        console.error('Erreur lors de la génération du PDF:', pdfError)
        throw pdfError
      } finally {
        // S'assurer de supprimer l'élément même en cas d'erreur
        if (element.parentNode) {
          document.body.removeChild(element)
        }
      }
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error)
      alertError('Erreur lors de la génération du PDF. Veuillez réessayer.')
    }
  }

  const handleBack = () => {
    if (selectedNiveau) {
      setSelectedNiveau('')
      setAttestationsArchivees([])
      setSearchQuery('')
      setCurrentPage(1)
    } else if (selectedFiliere) {
      setSelectedFiliere('')
    } else if (selectedFormation) {
      setSelectedFormation('')
    } else if (selectedPromotion) {
      setSelectedPromotion('')
    }
  }

  // Vue: Liste des attestations avec tableau, recherche et pagination
  if (selectedNiveau) {
    const promotion = promotions.find(p => p.id === selectedPromotion)
    const filiere = filieres.find(f => f.id === selectedFiliere)
    const niveau = niveaux.find(n => n.id === selectedNiveau)

    // Filtrage par recherche
    const filteredAttestations = attestationsArchivees.filter(attestation => {
      // Gérer les deux formats possibles : objet avec etudiant ou string
      const nomComplet = typeof attestation.etudiant === 'string'
        ? attestation.etudiant
        : `${attestation.etudiant?.prenom || ''} ${attestation.etudiant?.nom || ''}`.trim()
      const matricule = attestation.matricule || attestation.etudiant?.matricule || ''
      const numero = attestation.numero || ''
      const query = (searchQuery || '').toLowerCase()

      return nomComplet.toLowerCase().includes(query) ||
        matricule.toLowerCase().includes(query) ||
        numero.toLowerCase().includes(query)
    })

    // Pagination
    const totalPages = Math.ceil(filteredAttestations.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedAttestations = filteredAttestations.slice(startIndex, endIndex)

    const handlePageChange = (newPage) => {
      setCurrentPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faArchive} className="text-blue-600" />
                Archives des attestations
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                {promotion?.annee || selectedPromotion} • {filiere?.nom || selectedFiliere} • {niveau?.nom || selectedNiveau}
              </p>
            </div>

            {loading ? (
              <div className="bg-white rounded-xl shadow-md p-12 border border-slate-200 text-center">
                <LoadingSpinner size="lg" text="Chargement des attestations archivées..." />
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-xl font-bold text-slate-800">Attestations archivées</h2>
                  <p className="text-sm text-slate-600 mt-1">{filteredAttestations.length} attestation(s) trouvée(s)</p>
                </div>

                {/* Barre de recherche */}
                <div className="p-6 border-b border-slate-200">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faSearch} className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1) // Réinitialiser à la page 1 lors d'une recherche
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Rechercher par nom, matricule ou numéro d'attestation..."
                    />
                  </div>
                </div>

                {/* Tableau */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b-2 border-slate-300">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Étudiant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Matricule
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Formation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Date génération
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          N° Attestation
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {paginatedAttestations.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center">
                            <p className="text-slate-500 text-lg">Aucune attestation archivée trouvée</p>
                          </td>
                        </tr>
                      ) : (
                        paginatedAttestations.map((attestation) => {
                          // Gérer les deux formats possibles
                          const nomComplet = typeof attestation.etudiant === 'string'
                            ? attestation.etudiant
                            : `${attestation.etudiant?.prenom || ''} ${attestation.etudiant?.nom || ''}`.trim()
                          const matricule = attestation.matricule || attestation.etudiant?.matricule || 'N/A'
                          return (
                            <tr key={attestation.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="text-sm font-semibold text-slate-800">{nomComplet || 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-slate-600">{matricule}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-slate-600">{attestation.formation || 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-slate-600">{attestation.dateGeneration || 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-mono text-slate-600">{attestation.numero || 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => handleDownloadAttestation(attestation)}
                                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors text-sm gap-2">
                                  <FontAwesomeIcon icon={faDownload} />
                                  Télécharger
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
                  <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Affichage de {startIndex + 1} à {Math.min(endIndex, filteredAttestations.length)} sur {filteredAttestations.length} résultats
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-2 font-semibold transition-colors ${currentPage === 1
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                          }`}>
                        <FontAwesomeIcon icon={faChevronLeft} />
                      </button>

                      {[...Array(totalPages)].map((_, index) => {
                        const pageNum = index + 1
                        // Afficher seulement quelques pages autour de la page actuelle
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-4 py-2 font-semibold transition-colors ${currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                                }`}>
                              {pageNum}
                            </button>
                          )
                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                          return <span key={pageNum} className="px-2 text-slate-400">...</span>
                        }
                        return null
                      })}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-2 font-semibold transition-colors ${currentPage === totalPages
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                          }`}>
                        <FontAwesomeIcon icon={faChevronRight} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    )
  }

  // Vue: Sélection du niveau
  if (selectedFiliere && !selectedNiveau) {
    const filiere = filieres.find(f => f.id === selectedFiliere)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faGraduationCap} className="text-blue-600" />
                Choisissez le niveau
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                {selectedPromotion} • {filiere?.nom || selectedFiliere}
              </p>
            </div>

            {loading ? (
              <div className="bg-white rounded-xl shadow-md p-12 border border-slate-200 text-center">
                <LoadingSpinner size="lg" text="Chargement des niveaux..." />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {niveaux.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-slate-500">Aucun niveau disponible pour cette formation et cette filière</p>
                  </div>
                ) : (
                  niveaux.map((niveau) => (
                    <button
                      key={niveau.id}
                      onClick={() => setSelectedNiveau(niveau.id)}
                      className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-blue-500">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                          <FontAwesomeIcon icon={faGraduationCap} className="text-white text-2xl" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{niveau.nom}</h3>
                        <p className="text-sm text-slate-600">{niveau.code}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    )
  }

  // Vue: Affichage des attestations
  if (selectedPromotion && selectedFiliere && selectedNiveau) {
    const promotion = promotions.find(p => p.id === selectedPromotion)
    const filiere = filieres.find(f => f.id === selectedFiliere)
    const niveau = niveaux.find(n => n.id === selectedNiveau)

    // Fonction pour formater le nom de l'étudiant en toute sécurité
    const getEtudiantName = (attestation) => {
      if (!attestation) return 'Inconnu';
      if (attestation.etudiant) {
        if (typeof attestation.etudiant === 'string') return attestation.etudiant;
        if (attestation.etudiant.nom && attestation.etudiant.prenom) {
          return `${attestation.etudiant.nom} ${attestation.etudiant.prenom}`;
        }
      }
      return 'Étudiant inconnu';
    };

    // Fonction pour formater la date de génération
    const formatDateGeneration = (dateString) => {
      if (!dateString) return 'Date inconnue';
      try {
        const date = new Date(dateString);
        return isNaN(date.getTime())
          ? 'Date invalide'
          : date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch (e) {
        console.error('Erreur de format de date:', e);
        return 'Date invalide';
      }
    };

    console.log('Rendu des attestations avec les données:', {
      promotion,
      filiere,
      niveau,
      attestationsCount: attestationsArchivees.length,
      attestationsSample: attestationsArchivees.slice(0, 2) // Afficher les 2 premières attestations pour le débogage
    })

    // Filtrage par recherche
    const filteredAttestations = attestationsArchivees.filter(attestation => {
      // Gérer les deux formats possibles : objet avec etudiant ou string
      const nomComplet = typeof attestation.etudiant === 'string'
        ? attestation.etudiant
        : `${attestation.etudiant?.prenom || ''} ${attestation.etudiant?.nom || ''}`.trim()
      const matricule = attestation.matricule || attestation.etudiant?.matricule || ''
      const numero = attestation.numero || ''
      const query = (searchQuery || '').toLowerCase()

      return nomComplet.toLowerCase().includes(query) ||
        matricule.toLowerCase().includes(query) ||
        numero.toLowerCase().includes(query)
    })

    // Pagination
    const totalPages = Math.ceil(filteredAttestations.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedAttestations = filteredAttestations.slice(startIndex, endIndex)

    const handlePageChange = (newPage) => {
      setCurrentPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button
                onClick={handleBack}
                className="flex items-center text-slate-600 hover:text-slate-800 mb-4"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faArchive} className="text-blue-600" />
                Archives des attestations
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                {promotion?.annee} • {filiere?.nom} • {niveau?.nom}
              </p>
            </div>

            {loading ? (
              <div className="bg-white rounded-xl shadow-md p-12 border border-slate-200 text-center">
                <LoadingSpinner size="lg" text="Chargement des attestations..." />
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-xl font-bold text-slate-800">Attestations archivées</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {filteredAttestations.length} attestation(s) trouvée(s)
                  </p>
                </div>

                {/* Barre de recherche */}
                <div className="p-6 border-b border-slate-200">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon icon={faSearch} className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1) // Réinitialiser à la page 1 lors d'une recherche
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Rechercher par nom, matricule ou numéro d'attestation..."
                    />
                  </div>
                </div>

                {/* Tableau des attestations */}
                {filteredAttestations.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-slate-500">Aucune attestation trouvée pour les critères sélectionnés</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Étudiant
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Matricule
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Date de génération
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            N° Attestation
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {paginatedAttestations.map((attestation) => {
                          // Gérer les deux formats possibles
                          const etudiantName = typeof attestation.etudiant === 'string'
                            ? attestation.etudiant
                            : `${attestation.etudiant?.prenom || ''} ${attestation.etudiant?.nom || ''}`.trim() || 'N/A'
                          const matricule = attestation.matricule || attestation.etudiant?.matricule || 'N/A'
                          const dateGeneration = attestation.dateGenerationISO
                            ? new Date(attestation.dateGenerationISO).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                            : attestation.dateGeneration || 'N/A'

                          return (
                            <tr key={attestation.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-slate-900">
                                  {etudiantName}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-slate-500">
                                  {matricule}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-slate-500">
                                  {dateGeneration}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-mono text-slate-600">
                                  {attestation.numero || 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleDownloadAttestation(attestation)}
                                  className="text-blue-600 hover:text-blue-900 mr-4"
                                >
                                  <FontAwesomeIcon icon={faDownload} className="mr-1" /> Télécharger
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                          Affichage de {startIndex + 1} à {Math.min(endIndex, filteredAttestations.length)} sur {filteredAttestations.length} résultats
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded-md ${currentPage === 1
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
                              }`}
                          >
                            <FontAwesomeIcon icon={faChevronLeft} />
                          </button>

                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                              pageNum = i + 1
                            } else if (currentPage <= 3) {
                              pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            } else {
                              pageNum = currentPage - 2 + i
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-1 rounded-md ${currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
                                  }`}
                              >
                                {pageNum}
                              </button>
                            )
                          })}

                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded-md ${currentPage === totalPages
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
                              }`}
                          >
                            <FontAwesomeIcon icon={faChevronRight} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    )
  }

  // Vue: Sélection de la promotion
  if (!selectedPromotion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-600" />
                Choisissez la promotion
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez une promotion pour afficher les attestations disponibles
              </p>
            </div>

            {loading ? (
              <div className="bg-white rounded-xl shadow-md p-12 border border-slate-200 text-center">
                <LoadingSpinner size="lg" text="Chargement des promotions..." />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promotions.map((promotion) => (
                  <button
                    key={promotion.id}
                    onClick={() => setSelectedPromotion(promotion.id)}
                    className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-blue-500">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-white text-2xl" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">{promotion.annee}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${promotion.statut === 'EN_COURS'
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

  // Vue: Sélection de la formation
  if (selectedPromotion && !selectedFormation) {
    const promotion = promotions.find(p => p.id === selectedPromotion)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faFileAlt} className="text-blue-600" />
                Choisissez le type de formation
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Promotion {promotion?.annee || selectedPromotion}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {formations.map((formation) => (
                <button
                  key={formation.id}
                  onClick={() => setSelectedFormation(formation.id)}
                  className="p-8 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200">
                      <FontAwesomeIcon icon={faFileAlt} className="text-4xl text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">{formation.nom}</div>
                  </div>
                </button>
              ))}
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue: Sélection de la filière
  if (selectedFormation && !selectedFiliere) {
    const promotion = promotions.find(p => p.id === selectedPromotion)
    const formation = formations.find(f => f.id === selectedFormation)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <AdminSidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faFileAlt} className="text-blue-600" />
                Choisissez la filière
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                {promotion?.annee || selectedPromotion} • {formation?.nom}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filieres.map((filiere) => (
                <button
                  key={filiere.id}
                  onClick={() => setSelectedFiliere(filiere.id)}
                  className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-blue-500">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                      <FontAwesomeIcon icon={faFileAlt} className="text-white text-2xl" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{filiere.code || filiere.id}</h3>
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

  // Vue: Accueil des archives (déplacée à la fin)
  // Si on arrive ici, c'est qu'aucune des vues précédentes n'a été affichée
  // On affiche donc la vue d'accueil par défaut
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
              <FontAwesomeIcon icon={faArchive} className="text-blue-600" />
              Archives des attestations
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Sélectionnez une promotion pour commencer
            </p>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-12 border border-slate-200 text-center">
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
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{promotion.annee}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${promotion.statut === 'EN_COURS' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                      {promotion.statut === 'EN_COURS' ? 'En cours' : 'Archivé'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Prévisualisation cachée pour génération PDF */}
          {attestationToView && (
            <div className="hidden">
              <div id="attestation-preview" className="bg-gray-200" style={{ width: '210mm', height: '297mm', position: 'relative', overflow: 'hidden' }}>
                {/* Filigrane DUPLICATA */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-45deg)',
                  fontSize: '80px',
                  fontWeight: 'bold',
                  color: 'rgba(220, 38, 38, 0.15)',
                  fontFamily: 'Arial, sans-serif',
                  textTransform: 'uppercase',
                  pointerEvents: 'none',
                  zIndex: 1,
                  whiteSpace: 'nowrap'
                }}>
                  DUPLICATA
                </div>

                <div style={{ padding: '2cm', position: 'relative', zIndex: 2 }} className="h-full flex flex-col">
                  {/* En-tête */}
                  <div className="mb-12">
                    <div className="flex justify-start mb-2">
                      <img src="/images/logo.png" alt="Logo INPTIC" className="h-20" />
                    </div>
                    <div className="text-left" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', lineHeight: '1.2' }}>
                      <p className="font-bold m-0">DIRECTION GENERALE</p>
                      <p className="font-bold m-0">LA DIRECTION DE LA SCOLARITE ET DES EXAMENS</p>
                      <p className="font-bold mt-1">{attestationToView.numero}</p>
                    </div>
                  </div>

                  {/* Titre */}
                  <div style={{
                    backgroundColor: '#A8C9E4',
                    border: '3px solid #2C3E50',
                    padding: '15px 0',
                    marginBottom: '3rem',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <h1 style={{
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '18pt',
                      letterSpacing: '4px',
                      color: '#000',
                      fontWeight: 'bold',
                      margin: 0,
                      textAlign: 'center'
                    }}>
                      ATTESTATION DE SCOLARITE
                    </h1>
                  </div>

                  {/* Corps */}
                  <div className="flex-1" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt', lineHeight: '1.3' }}>
                    <p className="mb-4 text-justify" style={{ textIndent: '2cm' }}>
                      Je soussigné, Soilihi ALI ISSILAM, Directeur de la Scolarité et des Examens de
                      l'Institut National de la Poste, des Technologies de l'Information et de la
                      Communication (INPTIC), atteste que l'étudiant(e) <strong>{attestationToView.etudiant}</strong> suit
                      la formation ci-dessous dans notre établissement.
                    </p>

                    <div className="mb-4" style={{ paddingLeft: '1.5cm' }}>
                      <p className="mb-1" style={{ display: 'flex', alignItems: 'baseline' }}>
                        <span style={{ marginRight: '0.5cm' }}>➤</span>
                        <span><strong>Niveau d'études :</strong> {attestationToView.niveau} année</span>
                      </p>
                      <p className="mb-1" style={{ display: 'flex', alignItems: 'baseline' }}>
                        <span style={{ marginRight: '0.5cm' }}>➤</span>
                        <span><strong>Filière :</strong> {attestationToView.filiere}</span>
                      </p>
                      <p className="mb-1" style={{ display: 'flex', alignItems: 'baseline' }}>
                        <span style={{ marginRight: '0.5cm' }}>➤</span>
                        <span><strong>Programme :</strong> {attestationToView.formation}</span>
                      </p>
                      <p className="mb-1" style={{ display: 'flex', alignItems: 'baseline' }}>
                        <span style={{ marginRight: '0.5cm' }}>➤</span>
                        <span><strong>Année académique :</strong> {attestationToView.anneeAcademique}</span>
                      </p>
                    </div>

                    <p className="text-justify" style={{ textIndent: '2cm' }}>
                      En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que
                      de droit.
                    </p>
                  </div>

                  {/* Espace flexible pour pousser la signature en bas */}
                  <div style={{ flexGrow: 1, minHeight: '100px' }}></div>

                  {/* Pied de page */}
                  <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt' }}>
                    <div className="flex justify-end">
                      <div className="relative" style={{ width: '300px' }}>
                        <p className="text-right mb-16" style={{ fontSize: '12pt', whiteSpace: 'nowrap' }}>
                          Fait à Libreville, le {attestationToView.dateGeneration || (attestationToView.dateGenerationISO ? new Date(attestationToView.dateGenerationISO).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '')}
                        </p>

                        <p className="font-bold mb-2 text-right" style={{ fontSize: '12pt', whiteSpace: 'nowrap' }}>Directeur de la Scolarité et des Examens</p>

                        <div className="relative" style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img
                            src="/images/cachet.png"
                            alt="Cachet INPTIC"
                            style={{
                              width: '150px',
                              height: '150px',
                              opacity: 0.95
                            }}
                          />
                        </div>

                        <p className="font-bold mt-2 text-center" style={{ fontSize: '12pt' }}>Soilihi ALI ISSILAM</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-slate-500 pt-1.5 mt-3 text-center" style={{ fontFamily: 'Arial, sans-serif', fontSize: '8pt', lineHeight: '1.2', color: '#333' }}>
                    <p className="m-0">
                      Établissement public sous tutelle du Ministère de l'Économie Numérique et des Nouvelles Technologies de l'Information
                    </p>
                    <p className="m-0">
                      Tél : (241) 01 73 81 31 – Fax: (241) 01 73 44 16 - BP 13 124 Libreville - Gabon – Email : gabon.inptic@gmail.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default ArchivesAttestationsView

