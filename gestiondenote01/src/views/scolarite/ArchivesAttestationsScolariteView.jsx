import { useState } from 'react'
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

const ArchivesAttestationsScolariteView = () => {
  const location = useLocation()
  const isChefView = location.pathname.startsWith('/chef-scolarite')
  const Sidebar = isChefView ? SidebarChef : SidebarScolarite
  const Header = isChefView ? HeaderChef : HeaderScolarite
  const [selectedPromotion, setSelectedPromotion] = useState('')
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('')
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
    { id: 'L1', nom: '1ère année' },
    { id: 'L2', nom: '2ème année' },
    { id: 'L3', nom: '3ème année' }
  ]

  const getClasses = (filiere, niveau) => {
    const niveauNum = niveau.replace('L', '')
    return [
      { id: `${filiere}-${niveauNum}A`, nom: `${filiere}-${niveauNum}A` },
      { id: `${filiere}-${niveauNum}B`, nom: `${filiere}-${niveauNum}B` },
      { id: `${filiere}-${niveauNum}C`, nom: `${filiere}-${niveauNum}C` }
    ]
  }

  const getAttestationsArchivees = (promotion, filiere, niveau, classe) => {
    const filiereCode = classe.split('-')[0]
    const niveauNum = classe.split('-')[1].charAt(0)
    
    // Attestations archivées
    const attestations = [
      { id: 1, etudiant: 'ANDEME MBO Lidvige Johane', matricule: `${filiereCode}2024-L${niveauNum}-125`, formation: 'Formation Initiale 1', dateGeneration: '11 novembre 2024', numero: 'N°0460/INPTIC/DG/DSE/2024' },
      { id: 2, etudiant: 'MBADINGA Paul', matricule: `${filiereCode}2024-L${niveauNum}-089`, formation: 'Formation Initiale 1', dateGeneration: '12 novembre 2024', numero: 'N°0461/INPTIC/DG/DSE/2024' },
      { id: 3, etudiant: 'OBIANG Sophie', matricule: `${filiereCode}2024-L${niveauNum}-045`, formation: 'Formation Initiale 1', dateGeneration: '13 novembre 2024', numero: 'N°0462/INPTIC/DG/DSE/2024' },
      { id: 4, etudiant: 'ONDO Marie', matricule: `${filiereCode}2024-L${niveauNum}-067`, formation: 'Formation Initiale 1', dateGeneration: '14 novembre 2024', numero: 'N°0463/INPTIC/DG/DSE/2024' },
      { id: 5, etudiant: 'EKOMY Pierre', matricule: `${filiereCode}2024-L${niveauNum}-034`, formation: 'Formation Initiale 2', dateGeneration: '15 novembre 2024', numero: 'N°0464/INPTIC/DG/DSE/2024' },
      { id: 6, etudiant: 'NZAMBA Claire', matricule: `${filiereCode}2024-L${niveauNum}-156`, formation: 'Formation Initiale 1', dateGeneration: '16 novembre 2024', numero: 'N°0465/INPTIC/DG/DSE/2024' },
      { id: 7, etudiant: 'IBINGA Jean', matricule: `${filiereCode}2024-L${niveauNum}-078`, formation: 'Formation Initiale 2', dateGeneration: '17 novembre 2024', numero: 'N°0466/INPTIC/DG/DSE/2024' },
      { id: 8, etudiant: 'MOUITY Sarah', matricule: `${filiereCode}2024-L${niveauNum}-134`, formation: 'Formation Initiale 1', dateGeneration: '18 novembre 2024', numero: 'N°0467/INPTIC/DG/DSE/2024' },
      { id: 9, etudiant: 'AKUE David', matricule: `${filiereCode}2024-L${niveauNum}-092`, formation: 'Formation Initiale 1', dateGeneration: '19 novembre 2024', numero: 'N°0468/INPTIC/DG/DSE/2024' },
      { id: 10, etudiant: 'ELLA Nadège', matricule: `${filiereCode}2024-L${niveauNum}-103`, formation: 'Formation Initiale 2', dateGeneration: '20 novembre 2024', numero: 'N°0469/INPTIC/DG/DSE/2024' },
      { id: 11, etudiant: 'BIVIGOU Thomas', matricule: `${filiereCode}2024-L${niveauNum}-118`, formation: 'Formation Initiale 1', dateGeneration: '21 novembre 2024', numero: 'N°0470/INPTIC/DG/DSE/2024' },
      { id: 12, etudiant: 'MBOUMBA Astrid', matricule: `${filiereCode}2024-L${niveauNum}-147`, formation: 'Formation Initiale 1', dateGeneration: '22 novembre 2024', numero: 'N°0471/INPTIC/DG/DSE/2024' }
    ]
    
    return attestations
  }

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
    if (selectedClasse) {
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

  // Vue: Liste des attestations archivées
  if (selectedClasse) {
    const attestations = getAttestationsArchivees(selectedPromotion, selectedFiliere, selectedNiveau, selectedClasse)
    const promotion = promotions.find(p => p.id === selectedPromotion)
    const filiere = filieres.find(f => f.id === selectedFiliere)
    const niveau = niveaux.find(n => n.id === selectedNiveau)

    const filteredAttestations = attestations.filter(att => 
      att.etudiant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.numero.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const totalPages = Math.ceil(filteredAttestations.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedAttestations = filteredAttestations.slice(startIndex, startIndex + itemsPerPage)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-28 lg:mt-20">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faArchive} className="text-blue-600" />
                Archives des attestations - {selectedClasse}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                {promotion?.nom} • {filiere?.nom} • {niveau?.nom}
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
                    {paginatedAttestations.map((attestation) => (
                      <tr key={attestation.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{attestation.etudiant}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{attestation.matricule}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{attestation.formation}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{attestation.dateGeneration}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{attestation.numero}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => generateAttestationPDF(attestation)}
                            className="px-3 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-sm inline-flex items-center gap-2"
                          >
                            <FontAwesomeIcon icon={faDownload} />
                            Télécharger PDF
                          </button>
                        </td>
                      </tr>
                    ))}
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

  // Vue: Sélection de la classe
  if (selectedNiveau) {
    const classes = getClasses(selectedFiliere, selectedNiveau)
    const filiere = filieres.find(f => f.id === selectedFiliere)
    const niveau = niveaux.find(n => n.id === selectedNiveau)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header />
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
                  onClick={() => setSelectedClasse(classe.id)}
                  className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-blue-500"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                      <FontAwesomeIcon icon={faUsers} className="text-white text-2xl" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{classe.nom}</h3>
                    <p className="text-sm text-slate-600">Voir les archives</p>
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
  if (selectedFiliere) {
    const filiere = filieres.find(f => f.id === selectedFiliere)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header />
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
                  className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-blue-500"
                >
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
  if (selectedPromotion) {
    const promotion = promotions.find(p => p.id === selectedPromotion)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-28 lg:mt-20">
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-28 lg:mt-20">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
              <FontAwesomeIcon icon={faArchive} className="text-blue-600" />
              Archives des attestations de scolarité
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Consultez et téléchargez les attestations archivées (avec duplicata)
            </p>
          </div>

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
        </main>
      </div>
    </div>
  )
}

export default ArchivesAttestationsScolariteView

