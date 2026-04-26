import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenNib, faUpload, faTrash, faCheck, faDownload, faEye } from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAlert } from '../../contexts/AlertContext'
import { buildAttestationPdfBlob, preloadAttestationImages } from '../../utils/attestationPdfGenerator'

const STORAGE_KEY = 'ds_signature_dataurl'

const SignatureDSView = () => {
  const { success, error: alertError } = useAlert()
  const fileRef = useRef(null)
  const [signatureUrl, setSignatureUrl] = useState(null)
  const [preview, setPreview]           = useState(false)

  // Charger la signature sauvegardée localement
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setSignatureUrl(saved)
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alertError('Veuillez sélectionner un fichier image (PNG, JPG, etc.)')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      setSignatureUrl(dataUrl)
      localStorage.setItem(STORAGE_KEY, dataUrl)
      success('Signature enregistrée avec succès !')
    }
    reader.readAsDataURL(file)
  }

  const handleDelete = () => {
    setSignatureUrl(null)
    localStorage.removeItem(STORAGE_KEY)
    success('Signature supprimée.')
  }

  const handlePreview = async () => {
    try {
      const { logoUrl, cachetUrl } = await preloadAttestationImages()
      const data = {
        etudiant: 'EXEMPLE Étudiant Prénom',
        matricule: '00000',
        niveau: '1ère',
        filiere: 'Génie Informatique',
        formation: 'Formation Initiale 1',
        anneeAcademique: '2024-2025',
        numero: 'N°0001/INPTIC/DG/DSE/2024',
        lieu: 'Libreville',
        dateTexte: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      }
      const blob = buildAttestationPdfBlob(data, logoUrl, cachetUrl, false, signatureUrl)
      const url  = URL.createObjectURL(blob)
      const tab  = window.open(url, '_blank')
      if (tab) setTimeout(() => URL.revokeObjectURL(url), 10000)
      else {
        URL.revokeObjectURL(url)
        alertError('Autorisez les pop-ups pour visualiser le PDF.')
      }
    } catch (e) {
      console.error(e)
      alertError('Erreur lors de la prévisualisation.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32 max-w-2xl">

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <FontAwesomeIcon icon={faPenNib} className="text-blue-600" />
              Ma signature numérique
            </h1>
            <p className="text-slate-500 mt-1">
              Importez votre signature (image PNG/JPG fond transparent recommandé).
              Elle sera apposée automatiquement sur toutes les attestations générées.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">

            {signatureUrl ? (
              <>
                <p className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faCheck} /> Signature enregistrée
                </p>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 mb-6 flex items-center justify-center bg-slate-50">
                  <img
                    src={signatureUrl}
                    alt="Signature"
                    className="max-h-32 max-w-xs object-contain"
                  />
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faUpload} /> Remplacer
                  </button>
                  <button
                    onClick={handlePreview}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faEye} /> Prévisualiser sur attestation
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-colors flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faTrash} /> Supprimer
                  </button>
                </div>
              </>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <FontAwesomeIcon icon={faUpload} className="text-4xl text-slate-400 mb-4" />
                <p className="text-slate-600 font-semibold mb-1">Cliquez pour importer votre signature</p>
                <p className="text-slate-400 text-sm">PNG, JPG — fond transparent recommandé</p>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <strong>Note :</strong> La signature est stockée localement dans ce navigateur. Elle sera apposée sur toutes
            les attestations générées depuis cet appareil. Pour un déploiement multi-postes, contactez l'administrateur
            système pour activer la signature serveur.
          </div>

        </main>
      </div>
    </div>
  )
}

export default SignatureDSView
