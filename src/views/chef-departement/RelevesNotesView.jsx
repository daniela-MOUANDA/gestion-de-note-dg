import { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileAlt, faDownload, faSpinner, faFilePdf } from '@fortawesome/free-solid-svg-icons'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAlert } from '../../contexts/AlertContext'
import {
  getClasses,
  getModules,
  getEtudiantsByClasse,
  getParametresNotation,
  getNotesByModuleClasse
} from '../../api/chefDepartement.js'
import { abbreviateClasseLabel } from '../../utils/classeLabel'

const RelevesNotesView = () => {
  const { showAlert } = useAlert()

  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState([])
  const [modules, setModules] = useState([])
  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedSemestre, setSelectedSemestre] = useState('')
  const [selectedModule, setSelectedModule] = useState('')
  const [releveRows, setReleveRows] = useState([])
  const [parametresNotation, setParametresNotation] = useState(null)

  useEffect(() => {
    void loadClasses()
  }, [])

  useEffect(() => {
    void loadModulesForClasseAndSemestre()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClasse, selectedSemestre, classes])

  useEffect(() => {
    if (selectedClasse && selectedSemestre && selectedModule) {
      void loadReleveModule()
    } else {
      setReleveRows([])
      setParametresNotation(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClasse, selectedSemestre, selectedModule])

  const loadClasses = async () => {
    try {
      const result = await getClasses()
      if (result.success) {
        setClasses(result.classes || [])
      } else {
        showAlert(result.error || 'Erreur lors du chargement des classes', 'error')
      }
    } catch {
      showAlert('Erreur lors du chargement des classes', 'error')
    }
  }

  const getSelectedClasseInfo = () => classes.find((c) => c.id === selectedClasse)
  const getSelectedModuleInfo = () => modules.find((m) => m.id === selectedModule)

  const getSemestresAutorises = () => {
    if (!selectedClasse) return []
    const classe = getSelectedClasseInfo()
    if (!classe) return []
    const niveauCode = classe.niveauCode || classe.niveau || classe.niveaux?.code
    const mapping = {
      L1: ['S1', 'S2'],
      L2: ['S3', 'S4'],
      L3: ['S5', 'S6']
    }
    return mapping[niveauCode] || []
  }

  const loadModulesForClasseAndSemestre = async () => {
    if (!selectedClasse || !selectedSemestre) {
      setModules([])
      setSelectedModule('')
      return
    }

    try {
      const classe = getSelectedClasseInfo()
      if (!classe) return
      const filiereId = classe.filiereId || classe.filiere_id
      const semestresAutorises = getSemestresAutorises()
      if (!semestresAutorises.includes(selectedSemestre)) {
        setModules([])
        setSelectedModule('')
        return
      }

      const result = await getModules()
      if (result.success) {
        const filtered = (result.modules || []).filter((module) => {
          const moduleFiliereId = module.filiereId || module.filiere_id
          return moduleFiliereId === filiereId && module.semestre === selectedSemestre
        })
        setModules(filtered)
        if (selectedModule && !filtered.find((m) => m.id === selectedModule)) {
          setSelectedModule('')
        }
      }
    } catch {
      showAlert('Erreur lors du chargement des modules', 'error')
    }
  }

  const loadReleveModule = async () => {
    setLoading(true)
    try {
      const [etudiantsRes, notesRes, paramRes] = await Promise.all([
        getEtudiantsByClasse(selectedClasse),
        getNotesByModuleClasse(selectedModule, selectedClasse, selectedSemestre),
        getParametresNotation(selectedModule, selectedSemestre)
      ])

      if (!etudiantsRes.success) {
        showAlert(etudiantsRes.error || 'Impossible de charger les étudiants', 'error')
        setReleveRows([])
        return
      }
      if (!notesRes.success) {
        showAlert(notesRes.error || 'Impossible de charger les notes du module', 'error')
        setReleveRows([])
        return
      }

      const etudiants = etudiantsRes.etudiants || []
      const notes = notesRes.notes || []
      const param = paramRes?.success ? paramRes.parametres : null
      setParametresNotation(param || null)

      const notesByStudent = new Map()
      notes.forEach((n) => {
        const etuId = n.etudiant_id || n.etudiantId
        const evalId = n.evaluation_id || n.evaluationId
        const value = Number(n.valeur)
        if (!notesByStudent.has(etuId)) notesByStudent.set(etuId, [])
        notesByStudent.get(etuId).push({ evaluationId: String(evalId), value })
      })

      const evalById = new Map()
      ;(param?.evaluations || []).forEach((e) => {
        evalById.set(String(e.id), e)
      })

      const rows = etudiants.map((etu) => {
        const studentNotes = notesByStudent.get(etu.id) || []
        let moyenne = null

        if (studentNotes.length > 0) {
          let somme = 0
          let coeffTotal = 0

          studentNotes.forEach((sn) => {
            const evalPrefix = sn.evaluationId.split('_')[0]
            const evaluation = evalById.get(evalPrefix)
            if (evaluation && evaluation.noteMax && evaluation.coefficient) {
              const noteSur20 = (sn.value / Number(evaluation.noteMax)) * 20
              const coeff = Number(evaluation.coefficient) || 1
              somme += noteSur20 * coeff
              coeffTotal += coeff
            } else {
              somme += sn.value
              coeffTotal += 1
            }
          })

          moyenne = coeffTotal > 0 ? Number((somme / coeffTotal).toFixed(2)) : null
        }

        return {
          etudiantId: etu.id,
          matricule: etu.matricule || '-',
          nom: etu.nom || '',
          prenom: etu.prenom || '',
          nombreEvaluations: studentNotes.length,
          moyenneModule: moyenne,
          statut: moyenne == null ? 'NON SAISI' : moyenne >= 10 ? 'ACQUIS' : 'AJOURNÉ'
        }
      })

      rows.sort((a, b) => {
        const aScore = a.moyenneModule == null ? -1 : a.moyenneModule
        const bScore = b.moyenneModule == null ? -1 : b.moyenneModule
        if (bScore !== aScore) return bScore - aScore
        return `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`)
      })

      const ranked = rows.map((r, i) => ({ ...r, rang: r.moyenneModule == null ? '-' : i + 1 }))
      setReleveRows(ranked)
    } catch {
      showAlert('Erreur lors du chargement du relevé par module', 'error')
      setReleveRows([])
    } finally {
      setLoading(false)
    }
  }

  const tableRows = useMemo(() => releveRows, [releveRows])

  const loadLogoDataUrl = async () => {
    try {
      const response = await fetch('/images/logo.png')
      const blob = await response.blob()
      return await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(blob)
      })
    } catch {
      return null
    }
  }

  const exportRelevePdf = async () => {
    if (!tableRows.length) return
    const classe = getSelectedClasseInfo()
    const module = getSelectedModuleInfo()
    const now = new Date()
    const academicYear = classe?.promotion?.annee || 'N/A'
    const effectifClasse = tableRows.length
    const nbValides = tableRows.filter((r) => r.statut === 'ACQUIS').length
    const nbAjournes = tableRows.filter((r) => r.statut === 'AJOURNÉ').length

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const logoDataUrl = await loadLogoDataUrl()

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', 12, 8, 24, 24)
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(`Classe: ${abbreviateClasseLabel(classe?.nom || '-', classe || {})}`, 148, 12, { align: 'center' })
    doc.text(`Module: ${module?.code || ''} - ${module?.nom || '-'}`, 148, 18, { align: 'center' })
    doc.text(`Semestre: ${selectedSemestre}`, 148, 24, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`UE: ${module?.ue || '-'} ${module?.nom_ue ? `- ${module.nom_ue}` : ''}`, 148, 30, { align: 'center' })
    doc.text(`Annee academique: ${academicYear}`, 280, 12, { align: 'right' })
    doc.text(`Date generation: ${now.toLocaleDateString('fr-FR')} ${now.toLocaleTimeString('fr-FR')}`, 280, 18, { align: 'right' })
    doc.text(`Effectif classe: ${effectifClasse}  |  Valides: ${nbValides}  |  Ajournes: ${nbAjournes}`, 148, 36, { align: 'center' })

    const body = tableRows.map((r) => [
      String(r.rang),
      r.matricule,
      r.nom,
      r.prenom,
      String(r.nombreEvaluations),
      r.moyenneModule == null ? '-' : r.moyenneModule.toFixed(2),
      r.statut
    ])

    autoTable(doc, {
      startY: 42,
      head: [['Rang', 'Matricule', 'Nom', 'Prenom', 'Nb eval.', 'Moyenne module', 'Statut']],
      body,
      styles: { fontSize: 9, cellPadding: 2.5, valign: 'middle' },
      headStyles: { fillColor: [15, 39, 68], textColor: [255, 255, 255], fontStyle: 'bold' },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 6) {
          const status = String(hookData.cell.raw || '').toUpperCase()
          if (status === 'ACQUIS') {
            hookData.cell.styles.textColor = [22, 163, 74]
            hookData.cell.styles.fontStyle = 'bold'
          } else if (status === 'AJOURNÉ' || status === 'AJOURNE') {
            hookData.cell.styles.textColor = [220, 38, 38]
            hookData.cell.styles.fontStyle = 'bold'
          }
        }
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 16 },
        1: { cellWidth: 36 },
        2: { cellWidth: 48 },
        3: { cellWidth: 48 },
        4: { halign: 'center', cellWidth: 20 },
        5: { halign: 'center', cellWidth: 30 },
        6: { halign: 'center', cellWidth: 24 }
      }
    })

    const safeClasse = abbreviateClasseLabel(classe?.nom || 'classe', classe || {}).replace(/[^\w.-]/g, '_')
    const safeModule = `${module?.code || 'module'}`.replace(/[^\w.-]/g, '_')
    doc.save(`Releve_${safeClasse}_${safeModule}_${selectedSemestre}.pdf`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-40 lg:pt-36">
          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Relevé de Notes</h1>
              <p className="text-sm text-slate-500 uppercase font-semibold">Consultation par module</p>
            </div>
            {tableRows.length > 0 && (
              <button
                onClick={exportRelevePdf}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-md"
              >
                <FontAwesomeIcon icon={faFilePdf} />
                Télécharger PDF
              </button>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="w-full">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Classe</label>
              <select
                value={selectedClasse}
                onChange={(e) => {
                  setSelectedClasse(e.target.value)
                  setSelectedSemestre('')
                  setSelectedModule('')
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner une classe</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {abbreviateClasseLabel(c.nom, c)}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Semestre</label>
              <select
                value={selectedSemestre}
                onChange={(e) => {
                  setSelectedSemestre(e.target.value)
                  setSelectedModule('')
                }}
                disabled={!selectedClasse}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Sélectionner un semestre</option>
                {getSemestresAutorises().map((s) => (
                  <option key={s} value={s}>
                    {s.replace('S', 'Semestre ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Module</label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                disabled={!selectedClasse || !selectedSemestre}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Sélectionner un module</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} - {m.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
              <p className="font-semibold text-slate-700 mb-1">Rendu</p>
              <p>{parametresNotation?.evaluations?.length || 0} type(s) d&apos;évaluation configuré(s)</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-slate-300 overflow-hidden min-h-[420px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-24">
                <FontAwesomeIcon icon={faSpinner} className="text-5xl text-blue-500 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Chargement du relevé du module...</p>
              </div>
            ) : tableRows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 border-b border-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">Rang</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">Matricule</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">Prénom</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-700">Nb évaluations</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-700">Moyenne module</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-700">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {tableRows.map((row) => (
                      <tr key={row.etudiantId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-semibold">{row.rang}</td>
                        <td className="px-4 py-3 text-sm font-mono">{row.matricule}</td>
                        <td className="px-4 py-3 text-sm font-medium uppercase">{row.nom}</td>
                        <td className="px-4 py-3 text-sm">{row.prenom}</td>
                        <td className="px-4 py-3 text-sm text-center">{row.nombreEvaluations}</td>
                        <td className="px-4 py-3 text-sm text-center font-bold">
                          {row.moyenneModule == null ? '-' : row.moyenneModule.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                              row.statut === 'ACQUIS'
                                ? 'bg-green-100 text-green-700'
                                : row.statut === 'AJOURNÉ'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {row.statut}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : selectedClasse && selectedSemestre && selectedModule ? (
              <div className="flex flex-col items-center justify-center p-24 text-slate-400 text-center">
                <FontAwesomeIcon icon={faFileAlt} className="text-6xl mb-4 opacity-20" />
                <p className="text-lg font-medium">Aucune note trouvée pour ce module.</p>
                <p className="text-sm">Saisissez d&apos;abord les notes dans l&apos;écran Notes.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-24 text-slate-400 text-center">
                <FontAwesomeIcon icon={faFileAlt} className="text-6xl mb-4 opacity-20" />
                <p className="text-lg font-medium">Sélectionnez une classe, un semestre et un module.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default RelevesNotesView
