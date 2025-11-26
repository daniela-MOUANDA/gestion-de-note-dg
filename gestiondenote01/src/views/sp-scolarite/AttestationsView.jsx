import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faFileAlt, faArrowLeft, faSearch, faDownload, faPrint, faPlus, faCheck
} from '@fortawesome/free-solid-svg-icons'
import SidebarSP from '../../components/common/SidebarSP'
import HeaderSP from '../../components/common/HeaderSP'

const AttestationsView = () => {
  const [selectedAnnee, setSelectedAnnee] = useState('')
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedEtudiant, setSelectedEtudiant] = useState(null)
  const [attestationGenerated, setAttestationGenerated] = useState(null)
  const [numeroAttestation, setNumeroAttestation] = useState(460) // Commence à 460
  const [searchQuery, setSearchQuery] = useState('')

  const anneesAcademiques = [
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
      { id: `${filiere}-${niveauNum}A`, nom: `${filiere}-${niveauNum}A`, effectif: 35 },
      { id: `${filiere}-${niveauNum}B`, nom: `${filiere}-${niveauNum}B`, effectif: 32 },
      { id: `${filiere}-${niveauNum}C`, nom: `${filiere}-${niveauNum}C`, effectif: 28 }
    ]
  }

  // Étudiants avec statut d'inscription
  const getEtudiants = (classe) => {
    const filiereCode = classe.split('-')[0]
    const niveau = classe.split('-')[1].charAt(0)
    return [
      { 
        id: 1, 
        nom: 'ANDEME MBO', 
        prenom: 'Lidvige Johane', 
        matricule: `${filiereCode}2024-L${niveau}-125`,
        formation: 'Formation Initiale 1',
        estInscrit: true
      },
      { 
        id: 2, 
        nom: 'MBADINGA', 
        prenom: 'Paul', 
        matricule: `${filiereCode}2024-L${niveau}-089`,
        formation: 'Formation Initiale 1',
        estInscrit: true
      },
      { 
        id: 3, 
        nom: 'OBIANG', 
        prenom: 'Sophie', 
        matricule: `${filiereCode}2024-L${niveau}-045`,
        formation: 'Formation Initiale 1',
        estInscrit: true
      },
      { 
        id: 4, 
        nom: 'NZAMBA', 
        prenom: 'Jean', 
        matricule: `${filiereCode}2024-L${niveau}-023`,
        formation: 'Formation Initiale 1',
        estInscrit: false
      },
      { 
        id: 5, 
        nom: 'ONDO', 
        prenom: 'Marie', 
        matricule: `${filiereCode}2024-L${niveau}-067`,
        formation: 'Formation Initiale 1',
        estInscrit: true
      },
      { 
        id: 6, 
        nom: 'EKOMY', 
        prenom: 'Pierre', 
        matricule: `${filiereCode}2024-L${niveau}-034`,
        formation: 'Formation Initiale 2',
        estInscrit: false
      },
      { 
        id: 7, 
        nom: 'BITEGUE', 
        prenom: 'Anne', 
        matricule: `${filiereCode}2024-L${niveau}-078`,
        formation: 'Formation Initiale 1',
        estInscrit: true
      },
      { 
        id: 8, 
        nom: 'MVOU', 
        prenom: 'Patrick', 
        matricule: `${filiereCode}2024-L${niveau}-012`,
        formation: 'Formation Initiale 1',
        estInscrit: true
      }
    ]
  }

  const handleGenerateAttestation = (etudiant) => {
    const nouveauNumero = `N°0${numeroAttestation}/INPTIC/DG/DSE/2024`
    const niveau = niveaux.find(n => n.id === selectedNiveau)
    const filiere = filieres.find(f => f.id === selectedFiliere)
    
    const attestation = {
      numero: nouveauNumero,
      etudiant: `${etudiant.nom} ${etudiant.prenom}`,
      matricule: etudiant.matricule,
      filiere: filiere.nom,
      filiereCode: selectedFiliere,
      niveau: niveau.ordinal,
      niveauFull: niveau.nom,
      formation: etudiant.formation,
      anneeAcademique: selectedAnnee,
      dateGeneration: new Date().toISOString().split('T')[0],
      lieu: 'Libreville',
      dateTexte: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    }
    
    setAttestationGenerated(attestation)
    setNumeroAttestation(numeroAttestation + 1)
  }

  const handleDownloadPDF = () => {
    // Logique de génération PDF (sera implémenté avec jsPDF)
    alert('Téléchargement du PDF en cours...')
  }

  const handlePrint = () => {
    window.print()
  }

  const handleBack = () => {
    if (attestationGenerated) {
      setAttestationGenerated(null)
    } else if (selectedClasse) {
      setSelectedClasse('')
    } else if (selectedNiveau) {
      setSelectedNiveau('')
    } else if (selectedFiliere) {
      setSelectedFiliere('')
    } else if (selectedAnnee) {
      setSelectedAnnee('')
    }
  }

  // Vue: Attestation générée (format INPTIC exact)
  if (attestationGenerated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarSP />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6 print:hidden">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <FontAwesomeIcon icon={faDownload} />
                  Télécharger PDF
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2">
                  <FontAwesomeIcon icon={faPrint} />
                  Imprimer
                </button>
              </div>
            </div>

            {/* Template INPTIC exact - Fond gris comme l'original */}
            <div id="attestation-content" className="bg-gray-200 max-w-4xl mx-auto shadow-2xl" style={{ aspectRatio: '210/297' }}>
              <div className="p-12 h-full flex flex-col">
                {/* En-tête */}
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-3">
                    <img src="/images/logo.png" alt="Logo INPTIC" className="h-20" />
                  </div>
                  <p className="text-xs font-bold mb-0.5" style={{ fontSize: '10px' }}>Institut National de la Poste, des Technologies</p>
                  <p className="text-xs font-bold mb-0.5" style={{ fontSize: '10px' }}>de l'Information et de la Communication</p>
                  <p className="text-xs font-bold mb-2" style={{ fontSize: '10px' }}>(INPTIC)</p>
                  <p className="text-xs font-semibold mb-0.5" style={{ fontSize: '9px' }}>LA DIRECTION GÉNÉRALE</p>
                  <p className="text-xs font-semibold mb-0.5" style={{ fontSize: '9px' }}>LA DIRECTION DE LA SCOLARITÉ ET DES EXAMENS</p>
                  <p className="text-xs font-bold mt-2" style={{ fontSize: '9px' }}>{attestationGenerated.numero}</p>
                </div>

                {/* Titre - Bleu marine comme l'original */}
                <div style={{ backgroundColor: '#2C3E50' }} className="text-white text-center py-3 mb-6">
                  <h1 className="text-xl font-bold tracking-wider" style={{ fontSize: '20px', letterSpacing: '2px' }}>ATTESTATION DE SCOLARITE</h1>
                </div>

                {/* Corps du texte */}
                <div className="flex-1 space-y-5">
                  <p className="text-sm leading-relaxed text-justify" style={{ fontSize: '11px', textIndent: '3rem' }}>
                    Je soussigné, Soilihi ALI ISSILAM, Directeur de la Scolarité et des Examens de 
                    l'Institut National de la Poste, des Technologies de l'Information et de la 
                    Communication (INPTIC), atteste que l'étudiant(e) <strong>{attestationGenerated.etudiant}</strong> suit 
                    la formation ci-dessous dans notre établissement.
                  </p>

                  <div className="pl-10 space-y-1.5">
                    <p className="flex items-start text-sm" style={{ fontSize: '11px' }}>
                      <span className="mr-2 font-bold">➤</span>
                      <span><strong>Niveau d'études :</strong> {attestationGenerated.niveau} année</span>
                    </p>
                    <p className="flex items-start text-sm" style={{ fontSize: '11px' }}>
                      <span className="mr-2 font-bold">➤</span>
                      <span><strong>Filière :</strong> {attestationGenerated.filiere}</span>
                    </p>
                    <p className="flex items-start text-sm" style={{ fontSize: '11px' }}>
                      <span className="mr-2 font-bold">➤</span>
                      <span><strong>Programme :</strong> {attestationGenerated.formation}</span>
                    </p>
                    <p className="flex items-start text-sm" style={{ fontSize: '11px' }}>
                      <span className="mr-2 font-bold">➤</span>
                      <span><strong>Année académique :</strong> {attestationGenerated.anneeAcademique}</span>
                    </p>
                  </div>

                  <p className="text-sm leading-relaxed text-justify" style={{ fontSize: '11px', textIndent: '3rem' }}>
                    En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que 
                    de droit.
                  </p>
                </div>

                {/* Pied de page */}
                <div className="mt-auto pt-8">
                  <p className="text-right mb-16 text-sm" style={{ fontSize: '11px' }}>Fait à {attestationGenerated.lieu}, le {attestationGenerated.dateTexte}</p>
                  <div className="text-center">
                    <p className="font-bold mb-1 text-sm" style={{ fontSize: '11px' }}>Directeur de la Scolarité et des Examens</p>
                    <p className="text-xs italic text-slate-600 mb-10" style={{ fontSize: '9px' }}>(Signature et cachet numérisés)</p>
                    <p className="font-bold text-sm" style={{ fontSize: '11px' }}>Soilihi ALI ISSILAM</p>
                  </div>
                </div>

                {/* Pied de page institutionnel */}
                <div className="border-t border-slate-400 pt-2 mt-4">
                  <p className="text-center text-slate-700" style={{ fontSize: '8px', lineHeight: '1.3' }}>
                    Établissement public sous tutelle du Ministère de l'Économie Numérique et des Nouvelles Technologies de l'Information
                  </p>
                  <p className="text-center text-slate-700" style={{ fontSize: '8px', lineHeight: '1.3' }}>
                    Tél : (241) 01 73 81 31 – Fax: (241) 01 73 44 16 - BP 13 124 Libreville - Gabon – Email : gabon.inptic@gmail.com
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 1: Sélection de l'année académique
  if (!selectedAnnee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarSP />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faFileAlt} className="text-blue-600" />
                Attestations de scolarité
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez l'année académique
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez l'année académique</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {anneesAcademiques.map((annee) => (
                  <button 
                    key={annee.id}
                    onClick={() => setSelectedAnnee(annee.id)}
                    className={`p-6 border-2 rounded-xl transition-all duration-200 group ${
                      annee.statut === 'en_cours'
                        ? 'border-green-300 bg-green-50 hover:border-green-500 hover:shadow-lg'
                        : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50 hover:shadow-lg'
                    }`}>
                    <div className="text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        annee.statut === 'en_cours' ? 'bg-green-100 group-hover:bg-green-200' : 'bg-blue-100 group-hover:bg-blue-200'
                      }`}>
                        <FontAwesomeIcon icon={faFileAlt} className={`text-3xl ${
                          annee.statut === 'en_cours' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className={`text-2xl font-bold mb-2 ${
                        annee.statut === 'en_cours' ? 'text-green-800 group-hover:text-green-600' : 'text-slate-800 group-hover:text-blue-600'
                      }`}>
                        {annee.nom}
                      </div>
                      {annee.statut === 'en_cours' && (
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
        <SidebarSP />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Attestations - Année {selectedAnnee}
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
                        <FontAwesomeIcon icon={faFileAlt} className="text-3xl text-blue-600" />
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
        <SidebarSP />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Attestations - {selectedFiliere}
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
                    key={niveau.id}
                    onClick={() => setSelectedNiveau(niveau.id)}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">{niveau.id}</div>
                      <div className="text-sm text-slate-600">{niveau.nom}</div>
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
        <SidebarSP />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Attestations - {selectedFiliere} {selectedNiveau}
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
                        <FontAwesomeIcon icon={faFileAlt} className="text-3xl text-blue-600" />
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

  // Vue 5: Liste des étudiants de la classe
  const etudiants = getEtudiants(selectedClasse)
  const filteredEtudiants = etudiants.filter(e =>
    e.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.matricule.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarSP />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 lg:mt-0">
          <div className="mb-6">
            <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
            </button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              Classe {selectedClasse} - Année {selectedAnnee}
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Liste des étudiants - Générez les attestations de scolarité
            </p>
          </div>

          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Rechercher par nom, prénom ou matricule..."
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Étudiants de la classe</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Matricule</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Nom et Prénom</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Formation</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Statut</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredEtudiants.map((etudiant) => (
                    <tr key={etudiant.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-800 font-mono">{etudiant.matricule}</td>
                      <td className="px-6 py-4 text-sm text-slate-800 font-medium">
                        {etudiant.prenom} {etudiant.nom}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{etudiant.formation}</td>
                      <td className="px-6 py-4">
                        {etudiant.estInscrit ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            <FontAwesomeIcon icon={faCheck} />
                            Inscrit
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                            Non inscrit
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          {etudiant.estInscrit ? (
                            <button
                              onClick={() => handleGenerateAttestation(etudiant)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
                              <FontAwesomeIcon icon={faFileAlt} />
                              Générer attestation
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-4 py-2 bg-slate-300 text-slate-500 rounded-lg text-sm font-semibold cursor-not-allowed">
                              Non disponible
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AttestationsView

