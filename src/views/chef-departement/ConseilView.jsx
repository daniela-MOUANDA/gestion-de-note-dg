import { useState, useEffect, useMemo, Fragment } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGavel,
  faSpinner,
  faUsers,
  faCheckCircle,
  faExclamationTriangle,
  faTimesCircle,
  faGraduationCap,
  faChartPie,
  faFileExcel
} from '@fortawesome/free-solid-svg-icons'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAlert } from '../../contexts/AlertContext'
import {
  getFilieres,
  getPromotionsList,
  getNiveaux,
  getConseilClasseData,
  getConseilClasses,
  exportConseilExcel
} from '../../api/chefDepartement.js'
import { getFormations } from '../../api/scolarite.js'
import { abbreviateClasseLabel } from '../../utils/classeLabel'

const NAVY = '#0f2744'

const decisionStyles = {
  green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  amber: 'bg-amber-100 text-amber-900 border-amber-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200'
}

const KpiCard = ({ label, value, sub, icon, wrapClass }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
        {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
      </div>
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${wrapClass || 'bg-slate-100 text-slate-600'}`}
      >
        <FontAwesomeIcon icon={icon} />
      </div>
    </div>
  </div>
)

const ConseilView = () => {
  const { showAlert } = useAlert()

  const [loadingRefs, setLoadingRefs] = useState(true)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loadingConseil, setLoadingConseil] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)

  const [promotions, setPromotions] = useState([])
  const [formations, setFormations] = useState([])
  const [filieres, setFilieres] = useState([])
  const [niveaux, setNiveaux] = useState([])
  const [classes, setClasses] = useState([])

  const [selectedPromotion, setSelectedPromotion] = useState('')
  const [selectedFormation, setSelectedFormation] = useState('')
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedNiveau, setSelectedNiveau] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('')

  const [conseilData, setConseilData] = useState(null)
  const [phase, setPhase] = useState(null)   // null (L1) | 'avant_soutenance' | 'apres_soutenance'

  useEffect(() => {
    void loadReferences()
  }, [])

  useEffect(() => {
    setSelectedClasse('')
    setConseilData(null)
    setClasses([])
    setPhase(null)
  }, [selectedPromotion, selectedFormation, selectedFiliere, selectedNiveau])

  const handlePromotionChange = (value) => {
    setSelectedPromotion(value)
    setSelectedFormation('')
    setSelectedFiliere('')
    setSelectedNiveau('')
  }

  const handleFormationChange = (value) => {
    setSelectedFormation(value)
    setSelectedFiliere('')
    setSelectedNiveau('')
  }

  const handleFiliereChange = (value) => {
    setSelectedFiliere(value)
    setSelectedNiveau('')
  }

  useEffect(() => {
    if (selectedClasse) {
      void loadConseil(selectedClasse, phase)
    } else {
      setConseilData(null)
    }
  }, [selectedClasse, phase])

  const filtersComplete =
    Boolean(selectedPromotion) &&
    Boolean(selectedFormation) &&
    Boolean(selectedFiliere) &&
    Boolean(selectedNiveau)

  useEffect(() => {
    if (!filtersComplete) {
      setClasses([])
      return
    }
    void loadFilteredClasses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPromotion, selectedFormation, selectedFiliere, selectedNiveau, formations, niveaux])

  const loadReferences = async () => {
    setLoadingRefs(true)
    try {
      const [promoRes, formationsData, filRes, nivRes] = await Promise.all([
        getPromotionsList(),
        getFormations().catch(() => []),
        getFilieres(),
        getNiveaux()
      ])

      if (promoRes.success) setPromotions(promoRes.promotions || [])
      const formationsList = Array.isArray(formationsData) ? formationsData : []
      const initialFormations = formationsList.filter(
        (f) =>
          f.code === 'INITIAL_1' ||
          f.code === 'INITIAL_2' ||
          /initiale\s*1/i.test(f.nom || '') ||
          /initiale\s*2/i.test(f.nom || '')
      )
      setFormations(initialFormations)
      if (filRes.success) setFilieres(filRes.filieres || [])
      if (nivRes.success) setNiveaux(nivRes.niveaux || [])
    } catch {
      showAlert('Erreur lors du chargement des données', 'error')
    } finally {
      setLoadingRefs(false)
    }
  }

  const loadFilteredClasses = async () => {
    setLoadingClasses(true)
    try {
      const selFormation = formations.find((f) => f.id === selectedFormation)
      const selNiveau = niveaux.find((n) => n.id === selectedNiveau)
      const selPromo = promotions.find((p) => p.id === selectedPromotion)

      const res = await getConseilClasses({
        promotionId: selectedPromotion,
        promotionAnnee: selPromo?.annee,
        formationId: selectedFormation,
        formationCode: selFormation?.code,
        filiereId: selectedFiliere,
        niveauId: selectedNiveau,
        niveauCode: selNiveau?.code
      })

      if (res.success) {
        setClasses(res.classes || [])
      } else {
        setClasses([])
        showAlert(res.error || 'Erreur lors du chargement des classes', 'error')
      }
    } catch {
      setClasses([])
      showAlert('Erreur lors du chargement des classes', 'error')
    } finally {
      setLoadingClasses(false)
    }
  }

  const loadConseil = async (classeId, currentPhase) => {
    setLoadingConseil(true)
    try {
      const res = await getConseilClasseData(classeId, currentPhase)
      if (res.success) {
        // Initialise la phase par défaut selon le niveau (L2/L3 → avant_soutenance)
        if (!currentPhase && (res.meta?.niveauCode === 'L2' || res.meta?.niveauCode === 'L3')) {
          setPhase('avant_soutenance')
          // Le useEffect relancera loadConseil avec la phase
          return
        }
        setConseilData(res)
      } else {
        showAlert(res.error || 'Impossible de charger le conseil', 'error')
        setConseilData(null)
      }
    } catch {
      showAlert('Erreur lors du chargement du conseil', 'error')
      setConseilData(null)
    } finally {
      setLoadingConseil(false)
    }
  }

  const handleExportExcel = async () => {
    if (!selectedClasse || !conseilData) return
    setExportingExcel(true)
    try {
      const blob = await exportConseilExcel(selectedClasse, phase)
      const classe = selectedClasseInfo || conseilData.meta?.classe
      const annee  = conseilData.meta?.anneeAcademique ||
        promotions.find((p) => p.id === selectedPromotion)?.annee || ''
      const nom    = classe?.nom || selectedClasse
      const niveau = conseilData.meta?.niveauCode || ''
      const safe   = nom.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 40)
      const fname  = `Conseil_${safe}_${niveau}_${annee || 'N-A'}.xlsx`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = fname; a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      showAlert(err.message || 'Erreur lors de l\'export Excel', 'error')
    } finally {
      setExportingExcel(false)
    }
  }

  const filteredClasses = classes

  const selectedFormationInfo = useMemo(
    () => formations.find((f) => f.id === selectedFormation),
    [formations, selectedFormation]
  )

  const selectedClasseInfo = useMemo(
    () => filteredClasses.find((c) => c.id === selectedClasse),
    [filteredClasses, selectedClasse]
  )

  const blocks = conseilData?.meta?.blocks || []
  const stats = conseilData?.stats
  const chartData = conseilData?.chartData || []
  const etudiants = conseilData?.etudiants || []

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <AdminSidebar />
      <div className="flex min-h-screen flex-col lg:ml-64">
        <AdminHeader />
        <main className="flex-1 p-4 pt-28 sm:p-6 sm:pt-28 lg:p-8 lg:pt-32">
          <header className="mb-6">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-md"
                style={{ backgroundColor: NAVY }}
              >
                <FontAwesomeIcon icon={faGavel} className="text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Conseil</h1>
                <p className="text-sm text-slate-600">
                  Évolution académique des étudiants, décisions du jury et statistiques de passage
                </p>
              </div>
            </div>
          </header>

          {/* Filtres */}
          <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                  Année académique
                </label>
                <select
                  value={selectedPromotion}
                  onChange={(e) => handlePromotionChange(e.target.value)}
                  disabled={loadingRefs}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une année</option>
                  {promotions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.annee}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Formation</label>
                <select
                  value={selectedFormation}
                  onChange={(e) => handleFormationChange(e.target.value)}
                  disabled={!selectedPromotion || loadingRefs}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">Sélectionner une formation</option>
                  {formations.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nom || (f.code === 'INITIAL_1' ? 'Formation Initiale 1' : 'Formation Initiale 2')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Filière</label>
                <select
                  value={selectedFiliere}
                  onChange={(e) => handleFiliereChange(e.target.value)}
                  disabled={!selectedFormation || loadingRefs}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">Sélectionner une filière</option>
                  {filieres.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.code} — {f.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Niveau</label>
                <select
                  value={selectedNiveau}
                  onChange={(e) => setSelectedNiveau(e.target.value)}
                  disabled={!selectedFiliere || loadingRefs}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">Sélectionner un niveau</option>
                  {niveaux.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.code} — {n.nom || n.code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <p className="text-sm text-slate-500">
                  {loadingClasses
                    ? 'Recherche des classes…'
                    : filtersComplete
                      ? `${filteredClasses.length} classe(s) disponible(s)`
                      : 'Choisissez tous les filtres pour afficher les classes'}
                </p>
              </div>
            </div>
          </section>

          {/* Grille des classes */}
          {filtersComplete && (
            <section className="mb-6">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600">Classes</h2>
              {loadingClasses ? (
                <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
                  <FontAwesomeIcon icon={faSpinner} className="mr-3 animate-spin text-[#0f2744]" />
                  <span className="text-slate-600">Chargement des classes depuis la base…</span>
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                  Aucune classe pour cette sélection.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredClasses.map((c) => {
                    const active = selectedClasse === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedClasse(c.id)}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          active
                            ? 'border-[#0f2744] bg-[#0f2744]/5 shadow-md ring-2 ring-[#0f2744]/30'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                        }`}
                      >
                        <p className="font-bold text-slate-900">{abbreviateClasseLabel(c.nom, c)}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {c.formation?.nom || (c.formation?.code === 'INITIAL_1' ? 'FI1' : c.formation?.code === 'INITIAL_2' ? 'FI2' : '')}
                          {(c.formation?.nom || c.formation?.code) && ' · '}
                          {c.filieres?.code || c.filiere} · {c.niveau || c.niveaux?.code}
                        </p>
                        {(c.promotion?.annee || c.promotion_id) && (
                          <p className="mt-2 text-xs font-medium text-blue-800">
                            {c.promotion?.annee || 'Année académique liée'}
                          </p>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* Contenu conseil */}
          {!selectedClasse ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-16 text-slate-400">
              <FontAwesomeIcon icon={faGraduationCap} className="mb-4 text-5xl opacity-20" />
              <p className="text-lg font-medium text-slate-600">
                Sélectionnez une année, une formation (FI1 ou FI2), une filière, un niveau puis une classe.
              </p>
            </div>
          ) : loadingConseil ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-16">
              <FontAwesomeIcon icon={faSpinner} className="mb-4 text-4xl text-[#0f2744] animate-spin" />
              <p className="text-slate-600">Analyse du parcours académique en cours…</p>
            </div>
          ) : conseilData ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {abbreviateClasseLabel(selectedClasseInfo?.nom || conseilData.meta?.classe?.nom, selectedClasseInfo || {})}
                  </h2>
                  <p className="text-sm text-slate-600">
                    Année académique{' '}
                    {conseilData.meta?.anneeAcademique ||
                      promotions.find((p) => p.id === selectedPromotion)?.annee ||
                      '—'}
                    {' · '}
                    {conseilData.meta?.formationNom ||
                      selectedFormationInfo?.nom ||
                      conseilData.meta?.classe?.formation ||
                      '—'}
                    {' · '}
                    Filière {conseilData.meta?.classe?.filiere || '—'} · Niveau {conseilData.meta?.niveauCode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={exportingExcel}
                  className="flex shrink-0 items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
                >
                  {exportingExcel ? (
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faFileExcel} />
                  )}
                  {exportingExcel ? 'Export en cours…' : 'Exporter Excel'}
                </button>
              </div>

              {/* ── Filtre phase (L2 / L3 uniquement) ────────────────── */}
              {phase !== null && (
                <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Phase du conseil :
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPhase('avant_soutenance')}
                      className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                        phase === 'avant_soutenance'
                          ? 'bg-amber-500 text-white shadow'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Avant soutenance
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhase('apres_soutenance')}
                      className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                        phase === 'apres_soutenance'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Après soutenance (résultats annuels)
                    </button>
                  </div>
                </div>
              )}

              {stats && (
                <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <KpiCard
                    label="Effectif"
                    value={stats.effectif}
                    sub="Étudiants inscrits"
                    icon={faUsers}
                    wrapClass="bg-slate-100 text-slate-700"
                  />
                  <KpiCard
                    label={stats.admisLabel || 'Admis'}
                    value={stats.admis}
                    sub={`${stats.tauxReussite}% de l'effectif`}
                    icon={faCheckCircle}
                    wrapClass="bg-emerald-50 text-emerald-600"
                  />
                  {stats.afficherPassageConditionnel && (
                    <KpiCard
                      label="Passage conditionnel"
                      value={stats.passageConditionnel}
                      sub={`L1 → L2 · ${stats.tauxPassageConditionnel}%`}
                      icon={faExclamationTriangle}
                      wrapClass="bg-amber-50 text-amber-600"
                    />
                  )}
                  <KpiCard
                    label={stats.redoubleLabel || 'Redouble'}
                    value={stats.redouble}
                    sub={`${stats.tauxEchec}%`}
                    icon={faTimesCircle}
                    wrapClass="bg-red-50 text-red-600"
                  />
                  <KpiCard
                    label="Taux de réussite"
                    value={`${stats.tauxReussite}%`}
                    sub={phase === 'avant_soutenance' ? 'Admis en stage' : 'Admis / diplômé'}
                    icon={faChartPie}
                    wrapClass="bg-blue-50 text-blue-700"
                  />
                </section>
              )}

              <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5">
                  <h3 className="mb-4 text-base font-bold text-slate-900">Répartition des décisions</h3>
                  {chartData.length > 0 && stats?.effectif > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={95}
                          paddingAngle={2}
                          label={({ percent }) =>
                            percent > 0 ? `${(percent * 100).toFixed(2)}%` : ''
                          }
                        >
                          {chartData.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, _name) => {
                            const total = chartData.reduce((s, d) => s + d.value, 0)
                            const pct = total > 0 ? ((value / total) * 100).toFixed(2) : '0.00'
                            return [`${value} étudiant(s) (${pct}%)`, _name]
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="py-12 text-center text-sm text-slate-500">Aucune donnée à afficher.</p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
                  <h3 className="mb-3 text-base font-bold text-slate-900">Synthèse du conseil</h3>
                  <ul className="space-y-3 text-sm text-slate-700">
                    <li className="flex justify-between border-b border-slate-100 pb-2">
                      <span>Effectif de la classe</span>
                      <span className="font-bold">{stats?.effectif ?? 0}</span>
                    </li>
                    <li className="flex justify-between border-b border-slate-100 pb-2">
                      <span>{stats?.admisLabel || 'Total admis'}</span>
                      <span className="font-bold text-emerald-700">{stats?.admis ?? 0}</span>
                    </li>
                    {stats?.afficherPassageConditionnel && (
                      <li className="flex justify-between border-b border-slate-100 pb-2">
                        <span>Passage conditionnel (L1 → L2)</span>
                        <span className="font-bold text-amber-700">{stats?.passageConditionnel ?? 0}</span>
                      </li>
                    )}
                    <li className="flex justify-between border-b border-slate-100 pb-2">
                      <span>Taux de réussite</span>
                      <span className="font-bold">{stats?.tauxReussite ?? 0}%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>{stats?.redoubleLabel ? `${stats.redoubleLabel} (taux)` : "Taux d'échec (redoublement)"}</span>
                      <span className="font-bold text-red-700">{stats?.tauxEchec ?? 0}%</span>
                    </li>
                  </ul>
                  <p className="mt-4 text-xs text-slate-500">
                    {phase === 'avant_soutenance'
                      ? conseilData?.meta?.niveauCode === 'L2'
                        ? 'L2 → Admis en stage : L1 validée + S3 UE1&UE2 validées + S4 UE1 validée + S4 UE2 validée (ou compensable si 12/20 au stage). Si certains ont déjà soutenu, un 0 au stage = Redoublement direct.'
                        : 'L3 → Admis en soutenance : L1+L2 validées + S5 UE1&UE2 validées + S6 UE1 validée + S6 UE2 validée (ou compensable si 12/20). Si certains ont déjà soutenu, un 0 = Redoublement direct.'
                      : phase === 'apres_soutenance'
                        ? conseilData?.meta?.niveauCode === 'L3'
                          ? 'Diplôme Licence : 180 crédits cumulés L1+L2+L3 requis.'
                          : 'Résultats annuels : 60 crédits L2 requis pour être diplômé admis en L3.'
                        : 'Règles : 60 crédits annuels = admis ; 48–59 crédits = passage conditionnel (L1 uniquement) ; sinon redoublement.'}
                  </p>
                </div>
              </div>

              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="text-base font-bold text-slate-900">Récapitulatif par étudiant</h3>
                  <p className="text-xs text-slate-500">
                    Parcours {blocks.map((b) => b.label).join(' → ')} — crédits et décision du jury
                    {phase === 'avant_soutenance' ? ' · Phase : Avant soutenance' : ''}
                    {phase === 'apres_soutenance' ? ' · Phase : Après soutenance (résultats annuels)' : ''}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-600">
                      <tr>
                        <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left">Étudiant</th>
                        {blocks.map((block) => (
                          <th
                            key={block.label}
                            colSpan={block.semestres.length + 2}
                            className="border-l border-slate-200 px-2 py-3 text-center"
                          >
                            {block.label}
                          </th>
                        ))}
                        <th className="border-l border-slate-200 px-4 py-3 text-center">
                          {phase === 'avant_soutenance'
                            ? 'Admissibilité stage'
                            : phase === 'apres_soutenance'
                              ? 'Décision jury'
                              : 'Décision (année en cours)'}
                        </th>
                      </tr>
                      <tr className="bg-white text-[10px] font-semibold normal-case text-slate-500">
                        <th className="sticky left-0 z-10 bg-white px-4 py-2" />
                        {blocks.map((block) => (
                          <Fragment key={`hdr-${block.label}`}>
                            {block.semestres.map((s) => (
                              <th key={`${block.label}-${s}`} className="px-2 py-2 text-center">
                                {s}
                              </th>
                            ))}
                            <th className="px-2 py-2 text-center">Crédits</th>
                            <th className="border-r border-slate-100 px-2 py-2 text-center">Moy.</th>
                          </Fragment>
                        ))}
                        <th className="px-4 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {etudiants.map((row) => (
                        <tr key={row.etudiant.id} className="hover:bg-slate-50/80">
                          <td className="sticky left-0 z-10 bg-white px-4 py-3 font-medium">
                            <div className="uppercase text-slate-900">
                              {row.etudiant.nom} {row.etudiant.prenom}
                            </div>
                            <div className="font-mono text-xs text-slate-500">{row.etudiant.matricule}</div>
                          </td>
                          {row.annees.map((annee) => (
                            <Fragment key={`${row.etudiant.id}-${annee.label}`}>
                              {annee.semestres.map((sem) => (
                                <td key={`${row.etudiant.id}-${sem.semestre}`} className="px-2 py-3 text-center">
                                  <div className="font-semibold text-slate-800">
                                    {sem.moyenne != null ? Number(sem.moyenne).toFixed(2) : '—'}
                                  </div>
                                  <div className="text-[10px] text-slate-500">{sem.credits} cr.</div>
                                </td>
                              ))}
                              <td className="px-2 py-3 text-center font-bold text-slate-800">
                                {annee.creditsAnnuel}
                              </td>
                              <td className="border-r border-slate-100 px-2 py-3 text-center text-slate-700">
                                {annee.moyenneAnnuelle != null
                                  ? Number(annee.moyenneAnnuelle).toFixed(2)
                                  : '—'}
                              </td>
                            </Fragment>
                          ))}
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block max-w-[14rem] rounded-lg border px-2 py-1 text-[10px] font-bold uppercase leading-tight ${
                                decisionStyles[
                                  row.annees[row.annees.length - 1]?.decisionBadge || 'slate'
                                ]
                              }`}
                            >
                              {row.decisionCourante}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {etudiants.length === 0 && (
                  <p className="p-8 text-center text-slate-500">Aucun étudiant inscrit dans cette classe.</p>
                )}
              </section>
            </>
          ) : null}
        </main>
      </div>
    </div>
  )
}

export default ConseilView
