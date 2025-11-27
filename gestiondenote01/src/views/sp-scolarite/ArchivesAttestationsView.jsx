import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faArchive, faArrowLeft, faDownload, faFileAlt, faCalendarAlt, faGraduationCap, faSchool, faUsers, faSearch, faChevronLeft, faChevronRight
} from '@fortawesome/free-solid-svg-icons'
import SidebarSP from '../../components/common/SidebarSP'
import HeaderSP from '../../components/common/HeaderSP'
import html2pdf from 'html2pdf.js'

const ArchivesAttestationsView = () => {
  const [selectedPromotion, setSelectedPromotion] = useState('')
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('')
  const [attestationToView, setAttestationToView] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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

  const niveaux = [
    { id: 'L1', nom: '1ère année', ordinal: '1ère' },
    { id: 'L2', nom: '2ème année', ordinal: '2ème' },
    { id: 'L3', nom: '3ème année', ordinal: '3ème' }
  ]

  const getClasses = (filiere, niveau) => {
    const niveauNum = niveau.replace('L', '')
    return [
      { id: `${filiere}-${niveauNum}A`, nom: `${filiere}-${niveauNum}A` },
      { id: `${filiere}-${niveauNum}B`, nom: `${filiere}-${niveauNum}B` },
      { id: `${filiere}-${niveauNum}C`, nom: `${filiere}-${niveauNum}C` }
    ]
  }

  // Attestations archivées (uniquement étudiants inscrits)
  const getAttestationsArchivees = (promotion, filiere, niveau, classe) => {
    const filiereCode = classe.split('-')[0]
    const niveauNum = classe.split('-')[1].charAt(0)
    const niveauObj = niveaux.find(n => n.id === `L${niveauNum}`)
    
    // Données d'exemple - Uniquement les étudiants inscrits (liste étendue pour pagination)
    const nomsExemple = [
      'ANDEME MBO Lidvige Johane', 'MBADINGA Paul', 'OBIANG Sophie', 'ONDO Marie', 
      'EKOMY Pierre', 'NGUEMA Sarah', 'MBOUMBA Jean', 'OVONO Claire',
      'NZAMBA André', 'MINKO Patricia', 'ESSONO Michel', 'KOMBILA Julie',
      'AKENDENGUE David', 'MOUSSOUNDA Grace', 'ELLA NKOGHE Franck', 'MOUKAGNI Céline',
      'IBINGA Christian', 'NDONG Sylvie', 'OYANE Robert', 'MAMBOUNDOU Alice',
      'PAMBOU Joseph', 'KOUMBA Annie', 'BOUNGUENDZA Marc', 'MAYOMBO Nadine'
    ]
    
    return nomsExemple.map((nom, index) => ({
      id: index + 1,
      etudiant: nom,
      matricule: `${filiereCode}2024-L${niveauNum}-${String(index + 20).padStart(3, '0')}`,
      formation: index % 3 === 0 ? 'Formation Initiale 2' : 'Formation Initiale 1',
      dateGeneration: `${10 + index} novembre 2024`,
      numero: `N°${460 + index}/INPTIC/DG/DSE/2024`,
      filiere: filieres.find(f => f.id === filiere)?.nom,
      niveau: niveauObj?.ordinal,
      anneeAcademique: promotion
    }))
  }

  const handleDownloadAttestation = (attestation) => {
    setAttestationToView(attestation)
    
    // Attendre que le DOM soit mis à jour, puis générer le PDF
    setTimeout(() => {
      const element = document.getElementById('attestation-preview')
      if (element) {
        const opt = {
          margin: 0,
          filename: `Attestation_${attestation.etudiant.replace(/\s+/g, '_')}_${attestation.numero.replace(/\//g, '-')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true, 
            letterRendering: true,
            windowWidth: 794,
            windowHeight: 1123
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
          },
          pagebreak: { mode: 'avoid-all' }
        }
        
        html2pdf().set(opt).from(element).save().then(() => {
          setAttestationToView(null)
        })
      }
    }, 100)
  }

  const handleBack = () => {
    if (attestationToView) {
      setAttestationToView(null)
    } else if (selectedClasse) {
      setSelectedClasse('')
      setSearchQuery('')
      setCurrentPage(1)
    } else if (selectedNiveau) {
      setSelectedNiveau('')
    } else if (selectedFiliere) {
      setSelectedFiliere('')
    } else if (selectedPromotion) {
      setSelectedPromotion('')
    }
  }

  // Vue: Liste des attestations avec tableau, recherche et pagination
  if (selectedClasse && !attestationToView) {
    const allAttestations = getAttestationsArchivees(selectedPromotion, selectedFiliere, selectedNiveau, selectedClasse)
    const promotion = promotions.find(p => p.id === selectedPromotion)
    const filiere = filieres.find(f => f.id === selectedFiliere)
    const niveau = niveaux.find(n => n.id === selectedNiveau)

    // Filtrage par recherche
    const filteredAttestations = allAttestations.filter(attestation => 
      attestation.etudiant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attestation.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attestation.numero.toLowerCase().includes(searchQuery.toLowerCase())
    )

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
        <SidebarSP />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-28 lg:mt-20">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faArchive} className="text-blue-600" />
                Archives des attestations
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                {promotion?.nom} • {filiere?.nom} • {niveau?.nom} • {selectedClasse}
              </p>
            </div>

            <div className="bg-white shadow overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">Attestations archivées - {selectedClasse}</h2>
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
                    {paginatedAttestations.map((attestation) => (
                      <tr key={attestation.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-slate-800">{attestation.etudiant}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-600">{attestation.matricule}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-600">{attestation.formation}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-600">{attestation.dateGeneration}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-mono text-slate-600">{attestation.numero}</div>
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
                    ))}
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
                      className={`px-3 py-2 font-semibold transition-colors ${
                        currentPage === 1
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
                            className={`px-4 py-2 font-semibold transition-colors ${
                              currentPage === pageNum
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
                      className={`px-3 py-2 font-semibold transition-colors ${
                        currentPage === totalPages
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                      }`}>
                      <FontAwesomeIcon icon={faChevronRight} />
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

  // Vue: Sélection de la classe
  if (selectedNiveau && !selectedClasse) {
    const classes = getClasses(selectedFiliere, selectedNiveau)
    const filiere = filieres.find(f => f.id === selectedFiliere)
    const niveau = niveaux.find(n => n.id === selectedNiveau)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarSP />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-28 lg:mt-20">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faSchool} className="text-blue-600" />
                Choisissez la classe
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                {selectedPromotion} • {filiere?.nom} • {niveau?.nom}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((classe) => (
                <button
                  key={classe.id}
                  onClick={() => {
                    setSelectedClasse(classe.id)
                    setSearchQuery('')
                    setCurrentPage(1)
                  }}
                  className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-blue-500">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                      <FontAwesomeIcon icon={faUsers} className="text-white text-2xl" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{classe.nom}</h3>
                    <p className="text-sm text-slate-600">Voir les attestations</p>
                  </div>
                </button>
              ))}
            </div>
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
        <SidebarSP />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-28 lg:mt-20">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faGraduationCap} className="text-blue-600" />
                Choisissez le niveau
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                {selectedPromotion} • {filiere?.nom}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {niveaux.map((niveau) => (
                <button
                  key={niveau.id}
                  onClick={() => setSelectedNiveau(niveau.id)}
                  className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-blue-500">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                      <FontAwesomeIcon icon={faGraduationCap} className="text-white text-2xl" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{niveau.nom}</h3>
                    <p className="text-sm text-slate-600">{niveau.id}</p>
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
  if (selectedPromotion && !selectedFiliere) {
    const promotion = promotions.find(p => p.id === selectedPromotion)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarSP />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-28 lg:mt-20">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faFileAlt} className="text-blue-600" />
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
                  className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-blue-500">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                      <FontAwesomeIcon icon={faFileAlt} className="text-white text-2xl" />
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
      <SidebarSP />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-28 lg:mt-20">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
              <FontAwesomeIcon icon={faArchive} className="text-blue-600" />
              Archives des attestations
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Consultez et téléchargez les attestations générées pour les étudiants inscrits
            </p>
          </div>

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
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{promotion.nom}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    promotion.statut === 'en_cours'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {promotion.statut === 'en_cours' ? 'En cours' : 'Archivé'}
                  </span>
                </div>
              </button>
            ))}
          </div>

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
                        <p className="text-right mb-16" style={{ fontSize: '12pt', whiteSpace: 'nowrap' }}>Fait à Libreville, le {attestationToView.dateGeneration}</p>
                        
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

