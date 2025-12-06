import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFileAlt, faArrowLeft, faSearch, faDownload, faPrint, faPlus, faCheck
} from '@fortawesome/free-solid-svg-icons'
import SidebarSP from '../../components/common/SidebarSP'
import HeaderSP from '../../components/common/HeaderSP'
import html2pdf from 'html2pdf.js'
import { getPromotions, getFilieres, getNiveauxDisponibles, getFormations } from '../../api/scolarite'
import { getEtudiantsInscritsParFiliereNiveau, creerAttestation } from '../../api/scolarite'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAlert } from '../../contexts/AlertContext'

const AttestationsView = () => {
  const { success, error: alertError } = useAlert()
  const [selectedPromotion, setSelectedPromotion] = useState('')
  const [selectedFormation, setSelectedFormation] = useState('')
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [selectedEtudiant, setSelectedEtudiant] = useState(null)
  const [attestationGenerated, setAttestationGenerated] = useState(null)
  const [numeroAttestation, setNumeroAttestation] = useState(460) // Commence à 460
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // États pour les données de la base
  const [promotions, setPromotions] = useState([])
  const [formations, setFormations] = useState([])
  const [filieres, setFilieres] = useState([])
  const [niveaux, setNiveaux] = useState([])
  const [etudiants, setEtudiants] = useState([])

  const markAttestationAsGenerated = (etudiantId, attestationInfo) => {
    if (!etudiantId) return
    setEtudiants(prev =>
      prev.map(item =>
        item.id === etudiantId
          ? {
            ...item,
            attestationExiste: true,
            attestationId: attestationInfo?.id || item.attestationId || null,
            attestationNumero: attestationInfo?.numero || item.attestationNumero || null,
            attestationArchivee: attestationInfo?.archivee ?? true,
            attestationDate: attestationInfo?.dateGeneration || item.attestationDate || null
          }
          : item
      )
    )
  }

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
        // Sélectionner la promotion en cours par défaut
        const promoEnCours = promotionsData.find(p => p.statut === 'EN_COURS')
        if (promoEnCours) {
          setSelectedPromotion(promoEnCours.id)
        }
        // Sélectionner la première formation par défaut
        if (formationsData.length > 0) {
          setSelectedFormation(formationsData[0].id)
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error)
        alertError('Erreur lors du chargement des données')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

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

  // Charger les étudiants inscrits quand promotion, filière, niveau et formation sont sélectionnés
  useEffect(() => {
    if (selectedPromotion && selectedFiliere && selectedNiveau && selectedFormation) {
      const loadEtudiants = async () => {
        try {
          setLoading(true)
          const etudiantsData = await getEtudiantsInscritsParFiliereNiveau(
            selectedPromotion,
            selectedFiliere,
            selectedNiveau,
            selectedFormation
          )
          setEtudiants(etudiantsData || [])
        } catch (error) {
          console.error('Erreur lors du chargement des étudiants:', error)
          alertError(error.message || 'Erreur lors du chargement des étudiants')
          setEtudiants([])
        } finally {
          setLoading(false)
        }
      }
      loadEtudiants()
    } else {
      setEtudiants([])
    }
  }, [selectedPromotion, selectedFiliere, selectedNiveau, selectedFormation])

  const handleGenerateAttestation = async (etudiant) => {
    try {
      setLoading(true)
      const promotion = promotions.find(p => p.id === selectedPromotion)
      const niveau = niveaux.find(n => n.id === selectedNiveau)
      const filiere = filieres.find(f => f.id === selectedFiliere)

      // Créer l'attestation dans la base de données
      const attestationData = await creerAttestation(etudiant.id, selectedPromotion, promotion?.annee || '2024-2025')

      const attestation = {
        numero: attestationData.numero,
        etudiant: `${etudiant.nom} ${etudiant.prenom}`,
        matricule: etudiant.matricule,
        filiere: filiere?.nom || etudiant.filiere,
        filiereCode: selectedFiliere,
        niveau: niveau?.ordinal || etudiant.niveauOrdinal || '1ère',
        niveauFull: niveau?.nom || etudiant.niveau || '1ère année',
        formation: etudiant.formation,
        anneeAcademique: promotion?.annee || '2024-2025',
        dateGeneration: attestationData.dateGeneration
          ? (typeof attestationData.dateGeneration === 'string'
            ? attestationData.dateGeneration.split('T')[0]
            : new Date(attestationData.dateGeneration).toISOString().split('T')[0])
          : new Date().toISOString().split('T')[0],
        lieu: 'Libreville',
        dateTexte: attestationData.dateGeneration
          ? new Date(attestationData.dateGeneration).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
          : new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      }

      setAttestationGenerated(attestation)
      markAttestationAsGenerated(etudiant.id, attestationData)
      success('Attestation générée avec succès')

      // Déclencher un événement pour rafraîchir le dashboard
      window.dispatchEvent(new CustomEvent('attestationGenerated'))
    } catch (error) {
      console.error('Erreur lors de la génération de l\'attestation:', error)
      alertError(error.message || 'Erreur lors de la génération de l\'attestation')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    const element = document.getElementById('attestation-content')
    const opt = {
      margin: [0, 0, 0, 0],
      filename: `Attestation_${attestationGenerated.etudiant.replace(/\s+/g, '_')}_${attestationGenerated.numero.replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        windowWidth: 794,
        windowHeight: 1123,
        backgroundColor: '#ffffff',
        logging: false,
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

    html2pdf().set(opt).from(element).save()
  }

  const handlePrint = () => {
    window.print()
  }

  const handleGenerateAllAttestations = async () => {
    const etudiantsDisponibles = etudiants.filter(e => !e.attestationExiste)

    if (etudiantsDisponibles.length === 0) {
      alertError('Toutes les attestations ont déjà été générées.')
      return
    }

    const confirmation = window.confirm(
      `Voulez-vous générer ${etudiantsInscrits.length} attestations pour tous les étudiants inscrits ?\n\nCela peut prendre quelques minutes...`
    )

    if (!confirmation) return

    try {
      setLoading(true)
      for (let i = 0; i < etudiantsDisponibles.length; i++) {
        const etudiant = etudiantsDisponibles[i]
        await generateAttestationForStudent(etudiant)
        // Délai de 2 secondes entre chaque génération pour assurer le bon chargement
        if (i < etudiantsDisponibles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }

      success(`${etudiantsDisponibles.length} attestation(s) générée(s) et envoyée(s) dans les archives !`)

      // Déclencher un événement pour rafraîchir le dashboard
      window.dispatchEvent(new CustomEvent('attestationGenerated'))
    } catch (error) {
      console.error('Erreur lors de la génération en masse:', error)
      alertError(error.message || 'Erreur lors de la génération en masse')
    } finally {
      setLoading(false)
    }
  }

  const generateAttestationForStudent = async (etudiant) => {
    const promotion = promotions.find(p => p.id === selectedPromotion)
    const niveauInfo = niveaux.find(n => n.id === selectedNiveau)
    const filiereInfo = filieres.find(f => f.id === selectedFiliere)

    // Créer l'attestation dans la base de données
    const attestationData = await creerAttestation(etudiant.id, selectedPromotion, promotion?.annee || '2024-2025')

    const attestation = {
      etudiant: `${etudiant.nom} ${etudiant.prenom}`,
      matricule: etudiant.matricule,
      niveau: niveauInfo?.ordinal || etudiant.niveauOrdinal || '1ère',
      filiere: filiereInfo?.nom || etudiant.filiere,
      formation: etudiant.formation,
      anneeAcademique: promotion?.annee || '2024-2025',
      numero: attestationData.numero,
      lieu: 'Libreville',
      dateTexte: new Date(attestationData.dateGeneration).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    }

    // Créer l'élément HTML pour le PDF
    const element = document.createElement('div')
    element.style.width = '210mm'
    element.style.height = '297mm'
    element.style.maxHeight = '297mm'
    element.style.overflow = 'hidden'
    element.style.position = 'absolute'
    element.style.left = '-9999px'
    element.style.backgroundColor = '#ffffff'
    element.style.boxSizing = 'border-box'
    element.style.pageBreakInside = 'avoid'

    element.innerHTML = `
      <div style="padding: 2cm; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; position: relative; background-color: #ffffff; page-break-inside: avoid;">
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
              Communication (INPTIC), atteste que l'étudiant(e) <strong>${attestation.etudiant}</strong> suit 
              la formation ci-dessous dans notre établissement.
            </p>

            <div style="margin-bottom: 1rem; padding-left: 1.5cm;">
              <p style="margin-bottom: 0.25rem; display: flex; align-items: baseline;">
                <span style="margin-right: 0.5cm;">➤</span>
                <span><strong>Niveau d'études :</strong> ${attestation.niveau} année</span>
              </p>
              <p style="margin-bottom: 0.25rem; display: flex; align-items: baseline;">
                <span style="margin-right: 0.5cm;">➤</span>
                <span><strong>Filière :</strong> ${attestation.filiere}</span>
              </p>
              <p style="margin-bottom: 0.25rem; display: flex; align-items: baseline;">
                <span style="margin-right: 0.5cm;">➤</span>
                <span><strong>Programme :</strong> ${attestation.formation}</span>
              </p>
              <p style="margin-bottom: 0.25rem; display: flex; align-items: baseline;">
                <span style="margin-right: 0.5cm;">➤</span>
                <span><strong>Année académique :</strong> ${attestation.anneeAcademique}</span>
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
                <p style="text-align: right; margin-bottom: 4rem; font-size: 12pt; white-space: nowrap;">Fait à ${attestation.lieu}, le ${attestation.dateTexte}</p>
                
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
      margin: [0, 0, 0, 0],
      filename: `Attestation_${attestation.matricule}.pdf`,
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

    await html2pdf().set(opt).from(element).save()
    document.body.removeChild(element)
    markAttestationAsGenerated(etudiant.id, attestationData)
    return attestationData
  }

  const handleBack = () => {
    if (attestationGenerated) {
      setAttestationGenerated(null)
    } else if (selectedNiveau) {
      setSelectedNiveau('')
    } else if (selectedFiliere) {
      setSelectedFiliere('')
    } else if (selectedFormation) {
      setSelectedFormation('')
    } else if (selectedPromotion) {
      setSelectedPromotion('')
    }
  }

  // Vue: Attestation générée (format INPTIC exact)
  if (attestationGenerated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarSP />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-28 lg:pt-28">
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

            {/* Attestation de Scolarité - Format A4 officiel */}
            <div
              id="attestation-content"
              className="bg-white max-w-4xl mx-auto shadow-2xl"
              style={{
                width: '210mm',
                height: '297mm',
                overflow: 'hidden',
                pageBreakInside: 'avoid',
                boxSizing: 'border-box'
              }}
            >
              <div
                style={{ padding: '2cm', pageBreakInside: 'avoid', boxSizing: 'border-box', height: '100%' }}
                className="h-full flex flex-col"
              >
                {/* En-tête - Logo et informations à gauche */}
                <div className="mb-12">
                  <div className="flex justify-start mb-2">
                    <img src="/images/logo.png" alt="Logo INPTIC" className="h-20" />
                  </div>
                  <div className="text-left" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', lineHeight: '1.2' }}>
                    <p className="font-bold m-0" style={{ fontSize: '10pt' }}>DIRECTION GENERALE</p>
                    <p className="font-bold m-0" style={{ fontSize: '10pt' }}>LA DIRECTION DE LA SCOLARITE ET DES EXAMENS</p>
                    <p className="font-bold mt-1" style={{ fontSize: '10pt' }}>{attestationGenerated.numero}</p>
                  </div>
                </div>

                {/* Titre centré avec cadre bleu ciel */}
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

                {/* Corps du texte - Alignement justifié */}
                <div className="flex-1" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt', lineHeight: '1.3' }}>
                  <p className="mb-4 text-justify" style={{ textIndent: '2cm' }}>
                    Je soussigné, Soilihi ALI ISSILAM, Directeur de la Scolarité et des Examens de
                    l'Institut National de la Poste, des Technologies de l'Information et de la
                    Communication (INPTIC), atteste que l'étudiant(e) <strong>{attestationGenerated.etudiant}</strong> suit
                    la formation ci-dessous dans notre établissement.
                  </p>

                  <div className="mb-4" style={{ paddingLeft: '1.5cm' }}>
                    <p className="mb-1" style={{ display: 'flex', alignItems: 'baseline' }}>
                      <span style={{ marginRight: '0.5cm' }}>➤</span>
                      <span><strong>Niveau d'études :</strong> {attestationGenerated.niveau}<sup>ème</sup> année</span>
                    </p>
                    <p className="mb-1" style={{ display: 'flex', alignItems: 'baseline' }}>
                      <span style={{ marginRight: '0.5cm' }}>➤</span>
                      <span><strong>Filière :</strong> {attestationGenerated.filiere}</span>
                    </p>
                    <p className="mb-1" style={{ display: 'flex', alignItems: 'baseline' }}>
                      <span style={{ marginRight: '0.5cm' }}>➤</span>
                      <span><strong>Programme :</strong> {attestationGenerated.formation}</span>
                    </p>
                    <p className="mb-1" style={{ display: 'flex', alignItems: 'baseline' }}>
                      <span style={{ marginRight: '0.5cm' }}>➤</span>
                      <span><strong>Année académique :</strong> {attestationGenerated.anneeAcademique}</span>
                    </p>
                  </div>

                  <p className="text-justify" style={{ textIndent: '2cm' }}>
                    En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que
                    de droit.
                  </p>
                </div>

                {/* Espace flexible pour pousser la signature en bas */}
                <div style={{ flexGrow: 1, minHeight: '100px' }}></div>

                {/* Pied de page - Date et signature */}
                <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt' }}>
                  <div className="flex justify-end">
                    <div className="relative" style={{ width: '300px' }}>
                      <p className="text-right mb-16" style={{ fontSize: '12pt', whiteSpace: 'nowrap' }}>Fait à {attestationGenerated.lieu}, le {attestationGenerated.dateTexte}</p>

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

                {/* Pied de page institutionnel */}
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
          </main>
        </div>
      </div>
    )
  }

  // Vue 1: Sélection de l'année académique (promotion)
  if (!selectedPromotion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarSP />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faFileAlt} className="text-blue-600" />
                Attestations de scolarité
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez l'année académique
              </p>
            </div>

            {loading ? (
              <div className="bg-white rounded-xl shadow-md p-12 border border-slate-200 text-center">
                <LoadingSpinner size="lg" text="Chargement des promotions..." />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez l'année académique</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {promotions.map((promotion) => (
                    <button
                      key={promotion.id}
                      onClick={() => setSelectedPromotion(promotion.id)}
                      className={`p-6 border-2 rounded-xl transition-all duration-200 group ${promotion.statut === 'EN_COURS'
                          ? 'border-green-300 bg-green-50 hover:border-green-500 hover:shadow-lg'
                          : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50 hover:shadow-lg'
                        }`}>
                      <div className="text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${promotion.statut === 'EN_COURS' ? 'bg-green-100 group-hover:bg-green-200' : 'bg-blue-100 group-hover:bg-blue-200'
                          }`}>
                          <FontAwesomeIcon icon={faFileAlt} className={`text-3xl ${promotion.statut === 'EN_COURS' ? 'text-green-600' : 'text-blue-600'
                            }`} />
                        </div>
                        <div className={`text-2xl font-bold mb-2 ${promotion.statut === 'EN_COURS' ? 'text-green-800 group-hover:text-green-600' : 'text-slate-800 group-hover:text-blue-600'
                          }`}>
                          {promotion.annee}
                        </div>
                        {promotion.statut === 'EN_COURS' && (
                          <span className="inline-block px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-bold">
                            En cours
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    )
  }

  // Vue 2: Sélection de la formation
  if (!selectedFormation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarSP />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Attestations - {promotions.find(p => p.id === selectedPromotion)?.annee}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez le type de formation
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez le type de formation</h2>
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
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 3: Sélection de la filière
  if (!selectedFiliere) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <SidebarSP />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Attestations - {formations.find(f => f.id === selectedFormation)?.nom}
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
                      <div className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">{filiere.code || filiere.id}</div>
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
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                Attestations - {filieres.find(f => f.id === selectedFiliere)?.nom || selectedFiliere}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez le niveau
              </p>
            </div>

            {loading ? (
              <div className="bg-white rounded-xl shadow-md p-12 border border-slate-200 text-center">
                <LoadingSpinner size="lg" text="Chargement des niveaux..." />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez le niveau</h2>
                {niveaux.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500">Aucun niveau disponible pour cette formation et cette filière</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                    {niveaux.map((niveau) => (
                      <button
                        key={niveau.id}
                        onClick={() => setSelectedNiveau(niveau.id)}
                        className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-slate-800 group-hover:text-blue-600 mb-2">{niveau.code}</div>
                          <div className="text-sm text-slate-600">{niveau.nom}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    )
  }

  // Vue 4: Liste des étudiants inscrits
  const filteredEtudiants = etudiants.filter(e =>
    (e.nom || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.prenom || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.matricule || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const etudiantsDisponibles = etudiants.filter(e => !e.attestationExiste)

  const promotion = promotions.find(p => p.id === selectedPromotion)
  const filiere = filieres.find(f => f.id === selectedFiliere)
  const niveau = niveaux.find(n => n.id === selectedNiveau)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarSP />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderSP spName="Secrétaire Particulière - Direction de la Scolarité" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
          <div className="mb-6">
            <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
            </button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              Attestations - {filiere?.nom || selectedFiliere} {niveau?.code || selectedNiveau}
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              {promotion?.annee} • {etudiants.length} étudiant{etudiants.length > 1 ? 's' : ''} inscrit{etudiants.length > 1 ? 's' : ''}
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
            {loading ? (
              <div className="p-12 text-center">
                <LoadingSpinner size="lg" text="Chargement des étudiants..." />
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">Étudiants inscrits</h2>
                    {etudiants.length > 0 && (
                      <button
                        onClick={handleGenerateAllAttestations}
                        disabled={loading || etudiantsDisponibles.length === 0}
                        className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors ${etudiantsDisponibles.length === 0 || loading
                            ? 'bg-emerald-200 text-emerald-700 cursor-not-allowed'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                      >
                        <FontAwesomeIcon icon={faPlus} />
                        {etudiantsDisponibles.length === 0 ? 'Toutes générées' : 'Générer toutes les attestations'}
                      </button>
                    )}
                  </div>
                </div>
                {etudiants.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-slate-500 text-lg">Aucun étudiant inscrit trouvé pour cette combinaison</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Matricule</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Nom et Prénom</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Formation</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredEtudiants.map((etudiant) => {
                          const dejaGeneree = !!etudiant.attestationExiste
                          return (
                            <tr key={etudiant.id} className="hover:bg-blue-50 transition-colors">
                              <td className="px-6 py-4 text-sm text-slate-800 font-mono">{etudiant.matricule || 'N/A'}</td>
                              <td className="px-6 py-4 text-sm text-slate-800 font-medium">
                                {etudiant.prenom || ''} {etudiant.nom || ''}
                                {dejaGeneree && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                                    Déjà générée
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">{etudiant.formation || 'N/A'}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center">
                                  <button
                                    onClick={() => handleGenerateAttestation(etudiant)}
                                    disabled={loading || dejaGeneree}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${loading || dejaGeneree
                                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 transition-colors'
                                      }`}>
                                    <FontAwesomeIcon icon={faFileAlt} />
                                    {dejaGeneree ? 'Déjà générée' : 'Générer attestation'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AttestationsView

