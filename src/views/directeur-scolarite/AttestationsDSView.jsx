/**
 * Vue Directeur de la Scolarité — Attestations
 * Réutilise la logique SP mais avec la signature DS injectée dans chaque PDF.
 */
import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFileAlt, faArrowLeft, faSearch, faDownload, faPlus, faEye, faPenNib
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import JSZip from 'jszip'
import { getPromotions, getFilieres, getNiveauxDisponibles, getFormations } from '../../api/scolarite'
import { getEtudiantsInscritsParFiliereNiveau, creerAttestation } from '../../api/scolarite'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAlert } from '../../contexts/AlertContext'
import { pickPromotionForCurrentAcademicYear } from '../../utils/academicYear.js'
import {
  preloadAttestationImages,
  buildAttestationPdfBlob,
  sanitizeZipSegment,
  sanitizePdfNamePart,
} from '../../utils/attestationPdfGenerator.js'

const SIGNATURE_KEY = 'ds_signature_dataurl'

const AttestationsDSView = () => {
  const { success, error: alertError } = useAlert()
  const [selectedPromotion, setSelectedPromotion] = useState('')
  const [selectedFormation, setSelectedFormation] = useState('')
  const [selectedFiliere,   setSelectedFiliere]   = useState('')
  const [selectedNiveau,    setSelectedNiveau]     = useState('')
  const [attestationGenerated, setAttestationGenerated] = useState(null)
  const [searchQuery,  setSearchQuery]  = useState('')
  const [loading,      setLoading]      = useState(false)

  const [promotions, setPromotions] = useState([])
  const [formations, setFormations] = useState([])
  const [filieres,   setFilieres]   = useState([])
  const [niveaux,    setNiveaux]    = useState([])
  const [etudiants,  setEtudiants]  = useState([])

  const getSignature = () => localStorage.getItem(SIGNATURE_KEY) || null

  const markAsGenerated = (id, info) => {
    setEtudiants(prev => prev.map(e =>
      e.id === id ? {
        ...e,
        attestationExiste: true,
        attestationId: info?.id || e.attestationId || null,
        attestationNumero: info?.numero || e.attestationNumero || null,
        attestationDate: info?.dateGeneration || e.attestationDate || null,
      } : e
    ))
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [p, fo, fi] = await Promise.all([getPromotions(), getFormations(), getFilieres({ sansGroupes: true })])
        setPromotions(p); setFormations(fo); setFilieres(fi)
        const def = pickPromotionForCurrentAcademicYear(p)
        if (def) setSelectedPromotion(def.id)
      } catch { alertError('Erreur lors du chargement') }
      finally { setLoading(false) }
    }
    load()
  }, [])

  useEffect(() => {
    if (selectedFormation && selectedFiliere) {
      getNiveauxDisponibles(selectedFormation, selectedFiliere)
        .then(setNiveaux).catch(console.error)
    } else setNiveaux([])
  }, [selectedFormation, selectedFiliere])

  useEffect(() => {
    if (selectedPromotion && selectedFiliere && selectedNiveau && selectedFormation) {
      setLoading(true)
      getEtudiantsInscritsParFiliereNiveau(selectedPromotion, selectedFiliere, selectedNiveau, selectedFormation)
        .then(d => setEtudiants(d || []))
        .catch(e => { alertError(e.message); setEtudiants([]) })
        .finally(() => setLoading(false))
    } else setEtudiants([])
  }, [selectedPromotion, selectedFiliere, selectedNiveau, selectedFormation])

  // ── helpers PDF ───────────────────────────────────────────────────────────
  const buildData = (etudiant, attestationData) => {
    const promo  = promotions.find(p => p.id === selectedPromotion)
    const niv    = niveaux.find(n => n.id === selectedNiveau)
    const fil    = filieres.find(f => f.id === selectedFiliere)
    return {
      etudiant: `${etudiant.nom} ${etudiant.prenom}`,
      matricule: etudiant.matricule,
      niveau: niv?.ordinal || etudiant.niveauOrdinal || '1ère',
      filiere: fil?.nom || etudiant.filiere || '',
      formation: etudiant.formation || '',
      anneeAcademique: promo?.annee || '',
      numero: attestationData?.numero || etudiant.attestationNumero || '',
      lieu: 'Libreville',
      dateTexte: attestationData?.dateGeneration
        ? new Date(attestationData.dateGeneration).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        : etudiant.attestationDate
          ? new Date(etudiant.attestationDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
          : new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    }
  }

  // Génération individuelle
  const handleGenerate = async (etudiant) => {
    try {
      setLoading(true)
      const promo = promotions.find(p => p.id === selectedPromotion)
      const attestationData = await creerAttestation(etudiant.id, selectedPromotion, promo?.annee || '')
      const { logoUrl, cachetUrl } = await preloadAttestationImages()
      const sig  = getSignature()
      const data = buildData(etudiant, attestationData)
      const blob = buildAttestationPdfBlob(data, logoUrl, cachetUrl, false, sig)

      // Téléchargement automatique lors de la première génération
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `Attestation_${sanitizePdfNamePart(etudiant.matricule)}_${sanitizePdfNamePart(`${etudiant.nom}_${etudiant.prenom}`)}.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)

      markAsGenerated(etudiant.id, attestationData)
      success('Attestation générée et téléchargée !')
      window.dispatchEvent(new CustomEvent('attestationGenerated'))
    } catch (e) {
      alertError(e.message || 'Erreur lors de la génération')
    } finally { setLoading(false) }
  }

  // Visualisation
  const handleView = async (etudiant) => {
    try {
      setLoading(true)
      const { logoUrl, cachetUrl } = await preloadAttestationImages()
      const sig  = getSignature()
      const data = buildData(etudiant, null)
      const blob = buildAttestationPdfBlob(data, logoUrl, cachetUrl, false, sig)
      const url  = URL.createObjectURL(blob)
      const tab  = window.open(url, '_blank')
      if (tab) setTimeout(() => URL.revokeObjectURL(url), 10000)
      else { URL.revokeObjectURL(url); alertError('Autorisez les pop-ups.') }
    } catch (e) { alertError(e.message) }
    finally { setLoading(false) }
  }

  // Génération groupée → ZIP
  const handleGenerateAll = async () => {
    const disponibles = etudiants.filter(e => !e.attestationExiste)
    if (!disponibles.length) { alertError('Toutes les attestations ont déjà été générées.'); return }
    if (!window.confirm(`Générer ${disponibles.length} attestation(s) et télécharger l'archive ZIP ?`)) return

    const promo   = promotions.find(p => p.id === selectedPromotion)
    const niv     = niveaux.find(n => n.id === selectedNiveau)
    const fil     = filieres.find(f => f.id === selectedFiliere)

    try {
      setLoading(true)
      const { logoUrl, cachetUrl } = await preloadAttestationImages()
      const sig = getSignature()
      const zip = new JSZip()

      for (const etudiant of disponibles) {
        const att  = await creerAttestation(etudiant.id, selectedPromotion, promo?.annee || '')
        const data = buildData(etudiant, att)
        const blob = buildAttestationPdfBlob(data, logoUrl, cachetUrl, false, sig)
        const name = `Attestation_${sanitizePdfNamePart(etudiant.matricule)}_${sanitizePdfNamePart(`${etudiant.nom}_${etudiant.prenom}`)}.pdf`
        zip.file(name, blob)
        markAsGenerated(etudiant.id, att)
      }

      const zipName = [
        sanitizeZipSegment(fil?.code || fil?.id),
        sanitizeZipSegment(niv?.code || niv?.ordinal || niv?.nom),
        sanitizeZipSegment(promo?.annee),
      ].join('_')

      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
      const url = URL.createObjectURL(zipBlob)
      const a   = document.createElement('a')
      a.href = url; a.download = `${zipName}.zip`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)

      success(`${disponibles.length} attestation(s) générée(s) — archive ${zipName}.zip téléchargée.`)
      window.dispatchEvent(new CustomEvent('attestationGenerated'))
    } catch (e) {
      alertError(e.message || 'Erreur lors de la génération en masse')
    } finally { setLoading(false) }
  }

  const handleBack = () => {
    if (selectedNiveau) setSelectedNiveau('')
    else if (selectedFiliere) setSelectedFiliere('')
    else if (selectedFormation) setSelectedFormation('')
    else setSelectedPromotion('')
  }

  const hasSignature = !!getSignature()

  // ── Vues de sélection (identiques à SP) ──────────────────────────────────
  const shellPage = (content) => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">{content}</main>
      </div>
    </div>
  )

  if (!selectedPromotion) return shellPage(
    <>
      {!hasSignature && (
        <div className="mb-6 bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center gap-3 text-amber-800">
          <FontAwesomeIcon icon={faPenNib} />
          <span>Vous n'avez pas encore importé votre signature. <a href="/directeur-scolarite/signature" className="font-semibold underline">Configurer ma signature</a></span>
        </div>
      )}
      <h1 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <FontAwesomeIcon icon={faFileAlt} className="text-blue-600" /> Attestations de scolarité
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {promotions.map(p => (
          <button key={p.id} onClick={() => setSelectedPromotion(p.id)}
            className={`p-6 border-2 rounded-xl transition-all hover:shadow-lg text-center ${p.statut === 'EN_COURS' ? 'border-green-300 bg-green-50 hover:border-green-500' : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50'}`}>
            <div className="text-2xl font-bold mb-2">{p.annee}</div>
            {p.statut === 'EN_COURS' && <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs font-bold">En cours</span>}
          </button>
        ))}
      </div>
    </>
  )

  if (!selectedFormation) return shellPage(
    <>
      <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4"><FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour</button>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Choisissez la formation</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        {formations.map(f => (
          <button key={f.id} onClick={() => setSelectedFormation(f.id)}
            className="p-8 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center">
            <div className="text-xl font-bold text-slate-800">{f.nom}</div>
          </button>
        ))}
      </div>
    </>
  )

  if (!selectedFiliere) return shellPage(
    <>
      <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4"><FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour</button>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Choisissez la filière</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filieres.map(f => (
          <button key={f.id} onClick={() => setSelectedFiliere(f.id)}
            className="p-5 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center">
            <div className="text-xl font-bold mb-1">{f.code || f.id}</div>
            <div className="text-xs text-slate-500">{f.nom}</div>
          </button>
        ))}
      </div>
    </>
  )

  if (!selectedNiveau) return shellPage(
    <>
      <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4"><FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour</button>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Choisissez le niveau</h1>
      {loading ? <LoadingSpinner text="Chargement…" /> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {niveaux.map(n => (
            <button key={n.id} onClick={() => setSelectedNiveau(n.id)}
              className="p-6 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center">
              <div className="text-3xl font-bold mb-1">{n.code}</div>
              <div className="text-sm text-slate-500">{n.nom}</div>
            </button>
          ))}
        </div>
      )}
    </>
  )

  // Vue liste étudiants
  const fil   = filieres.find(f => f.id === selectedFiliere)
  const niv   = niveaux.find(n => n.id === selectedNiveau)
  const promo = promotions.find(p => p.id === selectedPromotion)
  const filtered     = etudiants.filter(e =>
    `${e.nom} ${e.prenom} ${e.matricule}`.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const disponibles  = etudiants.filter(e => !e.attestationExiste)

  return shellPage(
    <>
      <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4"><FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour</button>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">
        Attestations — {fil?.nom} {niv?.code}
      </h1>
      <p className="text-slate-500 text-sm mb-6">{promo?.annee} • {etudiants.length} étudiant(s) inscrit(s)</p>

      {!hasSignature && (
        <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl p-3 text-sm text-amber-800 flex items-center gap-2">
          <FontAwesomeIcon icon={faPenNib} />
          Aucune signature configurée — <a href="/directeur-scolarite/signature" className="underline font-semibold">configurer ma signature</a>
        </div>
      )}

      <div className="mb-4 relative">
        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3.5 text-slate-400" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Rechercher par nom, prénom ou matricule…" />
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Étudiants inscrits</h2>
          {disponibles.length > 0 && (
            <button onClick={handleGenerateAll} disabled={loading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-60">
              <FontAwesomeIcon icon={faPlus} />
              Générer toutes les attestations
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center"><LoadingSpinner text="Chargement…" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Matricule</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Nom et Prénom</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Formation</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map(e => {
                  const done = !!e.attestationExiste
                  return (
                    <tr key={e.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-slate-700">{e.matricule}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {e.nom} {e.prenom}
                        {done && <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">Déjà générée</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{e.formation}</td>
                      <td className="px-6 py-4 flex items-center justify-center gap-2">
                        {done ? (
                          <button onClick={() => handleView(e)} disabled={loading} title="Voir l'attestation"
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition-colors disabled:opacity-50">
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                        ) : (
                          <button onClick={() => handleGenerate(e)} disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-60">
                            <FontAwesomeIcon icon={faFileAlt} /> Générer attestation
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

export default AttestationsDSView
