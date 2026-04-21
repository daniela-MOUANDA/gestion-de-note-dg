import { useState, useEffect, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChartLine,
  faUsers,
  faGraduationCap,
  faSpinner,
  faUserGraduate,
  faDownload,
  faLayerGroup,
  faTable,
  faPercent
} from '@fortawesome/free-solid-svg-icons'
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Legend
} from 'recharts'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import { useAlert } from '../../contexts/AlertContext'
import { getDashboardStats } from '../../api/chefDepartement'
import * as XLSX from 'xlsx'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#0ea5e9']
const NAVY = '#0f2744'

const StatistiquesView = () => {
  const { showAlert } = useAlert()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalEnseignants: 0,
    totalEtudiants: 0,
    studentsData: [],
    levelData: [],
    genreData: [],
    tauxReussiteData: []
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const statsRes = await getDashboardStats()
      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats)
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error)
      showAlert('Erreur lors du chargement des statistiques', 'error')
    } finally {
      setLoading(false)
    }
  }

  const synthèseFilières = useMemo(() => {
    const tauxList = stats.tauxReussiteData || []
    const studMap = Object.fromEntries((stats.studentsData || []).map((s) => [s.name, s.value]))
    return tauxList
      .map((t) => {
        const effectif = studMap[t.filiere] ?? t.totalEtudiants ?? 0
        const totalDept = stats.totalEtudiants || 0
        const partDept = totalDept > 0 ? Math.round((effectif / totalDept) * 1000) / 10 : 0
        return {
          filiere: t.filiere,
          effectif,
          partDept,
          inscritsClasses: t.totalEtudiants ?? 0,
          avecNotes: t.etudiantsAvecNotes ?? 0,
          reussis: t.etudiantsReussis ?? 0,
          taux: t.tauxReussite ?? 0
        }
      })
      .sort((a, b) => (b.effectif || 0) - (a.effectif || 0))
  }, [stats])

  /** Réussites et taux au niveau département : dénominateur = effectif inscrit (totalEtudiants API). */
  const agrégatsRéussite = useMemo(() => {
    const rows = stats.tauxReussiteData || []
    const sumReussis = rows.reduce((a, t) => a + (t.etudiantsReussis || 0), 0)
    const totalInscrits = stats.totalEtudiants || 0
    const tauxSurEffectif = totalInscrits > 0 ? Math.round((sumReussis / totalInscrits) * 100) : 0
    return { sumReussis, totalInscrits, tauxSurEffectif }
  }, [stats])

  const insightsDepartement = useMemo(() => {
    const activeFilieres = synthèseFilières.filter((r) => (r.inscritsClasses || 0) > 0)
    const topFiliere = activeFilieres.length > 0 ? activeFilieres[0] : null
    const bestFiliere =
      activeFilieres.length > 0 ? [...activeFilieres].sort((a, b) => (b.taux || 0) - (a.taux || 0))[0] : null
    const lowFiliere =
      activeFilieres.length > 0 ? [...activeFilieres].sort((a, b) => (a.taux || 0) - (b.taux || 0))[0] : null
    const ecartPerf =
      bestFiliere && lowFiliere ? Math.max(0, (bestFiliere.taux || 0) - (lowFiliere.taux || 0)) : 0

    const sumAvecNotes = activeFilieres.reduce((a, r) => a + (r.avecNotes || 0), 0)
    const couvertureNotes =
      agrégatsRéussite.totalInscrits > 0
        ? Math.round((sumAvecNotes / agrégatsRéussite.totalInscrits) * 100)
        : 0

    const chargeParClasse =
      stats.totalClasses > 0 ? Math.round((stats.totalEtudiants / stats.totalClasses) * 10) / 10 : 0

    const genreM = (stats.genreData || []).find((g) => g.name === 'Masculin')?.percentage || 0
    const genreF = (stats.genreData || []).find((g) => g.name === 'Féminin')?.percentage || 0
    const ecartGenre = Math.abs(genreM - genreF)

    return {
      topFiliere,
      bestFiliere,
      ecartPerf,
      couvertureNotes,
      chargeParClasse,
      ecartGenre
    }
  }, [synthèseFilières, stats, agrégatsRéussite.totalInscrits])

  const barCompareData = useMemo(() => {
    return synthèseFilières.map((r) => ({
      filiere: r.filiere,
      effectif: r.effectif,
      taux: r.taux
    }))
  }, [synthèseFilières])

  const handleExportSynthèse = () => {
    try {
      if (synthèseFilières.length === 0) {
        showAlert('Aucune donnée à exporter', 'warning')
        return
      }
      const rows = synthèseFilières.map((r) => ({
        Filière: r.filiere,
        'Effectif (inscrits)': r.effectif,
        'Part du département (%)': r.partDept,
        'Inscrits (classes)': r.inscritsClasses,
        'Étudiants avec notes': r.avecNotes,
        Réussis: r.reussis,
        'Taux de réussite (%)': r.taux
      }))
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = [
        { wch: 12 },
        { wch: 18 },
        { wch: 22 },
        { wch: 18 },
        { wch: 22 },
        { wch: 10 },
        { wch: 22 }
      ]
      XLSX.utils.book_append_sheet(wb, ws, 'Synthèse par filière')
      const date = new Date().toISOString().split('T')[0]
      XLSX.writeFile(wb, `Statistiques_departement_synthese_${date}.xlsx`)
      showAlert('Export Excel généré', 'success')
    } catch (e) {
      console.error(e)
      showAlert("Erreur lors de l'export", 'error')
    }
  }

  const KpiCard = ({ label, value, sub, icon, accentClass, iconWrapClass }) => (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${accentClass || ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconWrapClass || 'bg-slate-100 text-slate-600'}`}
        >
          <FontAwesomeIcon icon={icon} className="text-lg" />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f9]">
        <AdminSidebar />
        <div className="flex min-h-screen flex-col lg:ml-64">
          <AdminHeader />
          <main className="flex flex-1 items-center justify-center p-4 pt-32 lg:pt-32">
            <div className="text-center">
              <FontAwesomeIcon icon={faSpinner} className="mb-4 text-4xl text-[#0f2744] animate-spin" />
              <p className="text-slate-600">Chargement des statistiques…</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <AdminSidebar />
      <div className="flex min-h-screen flex-col lg:ml-64">
        <AdminHeader />
        <main className="flex-1 p-4 pt-28 sm:p-6 sm:pt-28 lg:p-8 lg:pt-32">
          <header className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Statistiques détaillées
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Tableau de bord et synthèse croisée des indicateurs du département (effectifs, répartition et
              réussite).
            </p>
          </header>

          {/* KPIs */}
          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Classes"
              value={stats.totalClasses}
              sub="Groupes pédagogiques actifs"
              icon={faUsers}
              iconWrapClass="bg-sky-50 text-sky-600"
            />
            <KpiCard
              label="Enseignants"
              value={stats.totalEnseignants}
              sub="Corps enseignant actif"
              icon={faGraduationCap}
              iconWrapClass="bg-violet-50 text-violet-600"
            />
            <KpiCard
              label="Étudiants"
              value={stats.totalEtudiants}
              sub="Inscriptions actives"
              icon={faUserGraduate}
              iconWrapClass="bg-emerald-50 text-emerald-600"
            />
            <KpiCard
              label="Taux de réussite"
              value={`${agrégatsRéussite.tauxSurEffectif}%`}
              sub={
                agrégatsRéussite.totalInscrits > 0
                  ? `${agrégatsRéussite.sumReussis} réussis / ${agrégatsRéussite.totalInscrits} inscrits (effectif département)`
                  : 'Pas encore de données'
              }
              icon={faChartLine}
              iconWrapClass="bg-rose-50 text-rose-600"
            />
          </section>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Répartition filières — gauche (~42 %), graphique barres plus large à droite */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5">
              <h2 className="mb-1 text-base font-bold text-slate-900">Répartition des étudiants par filière</h2>
              <p className="mb-4 text-xs text-slate-500">Répartition des inscriptions actives</p>
              <div className="h-[300px] w-full min-h-[280px]">
                {stats.studentsData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.studentsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={108}
                        dataKey="value"
                      >
                        {stats.studentsData.map((entry, index) => (
                          <Cell key={`c-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v} étudiant(s)`, 'Effectif']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Aucune répartition à afficher
                  </div>
                )}
              </div>
            </div>

            {/* Effectif et taux (barres bleues) */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
              <h2 className="mb-1 text-base font-bold text-slate-900">Effectif et taux par filière</h2>
              <p className="mb-4 text-xs text-slate-500">Lecture rapide des volumes et des performances</p>
              <div className="h-[300px] w-full min-h-[260px]">
                {barCompareData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={barCompareData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="filiere" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#e2e8f0' }} />
                      <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 100]}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        axisLine={false}
                        unit="%"
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar yAxisId="left" dataKey="effectif" name="Effectif" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="taux"
                        name="Taux réussite"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#10b981' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">Pas de données</div>
                )}
              </div>
            </div>
          </div>

          {/* Tableau croisé synthétique */}
          <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0f2744] text-white"
                  aria-hidden
                >
                  <FontAwesomeIcon icon={faTable} />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Vue synthèse par filière</h2>
                  <p className="text-xs text-slate-500">
                    Indicateurs croisés : effectifs, part du département, suivi des notes et taux de réussite
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportSynthèse}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <FontAwesomeIcon icon={faDownload} className="text-slate-500" />
                Exporter Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <th className="whitespace-nowrap px-4 py-3">Filière</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right">Effectif</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right">% dépt.</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right">Inscrits (classes)</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right">Réussis</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right">Taux réussite</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right">Taux échec</th>
                    <th className="min-w-[140px] px-4 py-3">Barème</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {synthèseFilières.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                        Aucune filière à afficher
                      </td>
                    </tr>
                  ) : (
                    synthèseFilières.map((r) => (
                      <tr key={r.filiere} className="bg-white hover:bg-slate-50/80">
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">{r.filiere}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-800">
                          {r.effectif}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600">
                          {r.partDept}%
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600">
                          {r.inscritsClasses}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600">
                          {r.reussis}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <span
                            className={`font-bold tabular-nums ${
                              r.taux >= 70
                                ? 'text-emerald-600'
                                : r.taux >= 50
                                  ? 'text-amber-600'
                                  : 'text-rose-600'
                            }`}
                          >
                            {r.taux}%
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-semibold text-rose-600">
                          {Math.max(0, 100 - (r.taux || 0))}%
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-2 w-full max-w-[160px] overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={`h-2 rounded-full ${
                                r.taux >= 80
                                  ? 'bg-emerald-500'
                                  : r.taux >= 60
                                    ? 'bg-lime-500'
                                    : r.taux >= 40
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(r.taux, 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>


          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">
                <FontAwesomeIcon icon={faLayerGroup} className="text-indigo-500" />
                Étudiants par niveau
              </h2>
              <p className="mb-4 text-xs text-slate-500">Effectifs regroupés par code niveau</p>
              <div className="h-[300px] w-full">
                {stats.levelData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.levelData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="niveau" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="etudiants"
                        name="Étudiants"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#6366f1' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">Aucune donnée</div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-slate-900">
                <FontAwesomeIcon icon={faPercent} className="text-pink-500" />
                Répartition par genre
              </h2>
              <p className="mb-4 text-xs text-slate-500">Parmi les inscriptions avec sexe renseigné</p>
              <div className="h-[300px] w-full">
                {stats.genreData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.genreData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} · ${percentage}%`}
                        outerRadius={105}
                        dataKey="value"
                      >
                        {stats.genreData.map((entry, index) => (
                          <Cell key={`g-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">Aucune donnée</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default StatistiquesView
