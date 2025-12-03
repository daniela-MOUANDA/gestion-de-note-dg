import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartBar, faChartLine, faUsers, faGraduationCap } from '@fortawesome/free-solid-svg-icons'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import SidebarDEP from '../../components/common/SidebarDEP'
import HeaderDEP from '../../components/common/HeaderDEP'

const StatistiquesView = () => {
  const inscriptionsParMois = [
    { mois: 'Jan', inscriptions: 45 },
    { mois: 'Fév', inscriptions: 78 },
    { mois: 'Mar', inscriptions: 92 },
    { mois: 'Avr', inscriptions: 120 },
    { mois: 'Mai', inscriptions: 115 }
  ]

  const repartitionParFiliere = [
    { name: 'GI', value: 520, color: '#3b82f6' },
    { name: 'RT', value: 380, color: '#8b5cf6' },
    { name: 'Réseaux', value: 250, color: '#10b981' },
    { name: 'Autres', value: 100, color: '#f59e0b' }
  ]

  const tauxReussiteParNiveau = [
    { niveau: 'L1', taux: 82.5 },
    { niveau: 'L2', taux: 88.3 },
    { niveau: 'L3', taux: 91.7 }
  ]

  const evolutionTauxReussite = [
    { mois: 'Jan', taux: 80 },
    { mois: 'Fév', taux: 82 },
    { mois: 'Mar', taux: 84 },
    { mois: 'Avr', taux: 86 },
    { mois: 'Mai', taux: 87.5 }
  ]

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <SidebarDEP />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <HeaderDEP />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Statistiques</h1>
            <p className="text-sm text-slate-600">Vue d'ensemble des statistiques pédagogiques</p>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Inscriptions par mois */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faChartBar} className="text-blue-600" />
                Inscriptions par mois
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inscriptionsParMois}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="inscriptions" fill="#3b82f6" name="Inscriptions" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Répartition par filière */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faChartLine} className="text-purple-600" />
                Répartition par filière
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={repartitionParFiliere}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {repartitionParFiliere.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Taux de réussite */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faGraduationCap} className="text-emerald-600" />
                Taux de réussite par niveau
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tauxReussiteParNiveau}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="niveau" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="taux" fill="#10b981" name="Taux de réussite (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faChartLine} className="text-amber-600" />
                Évolution du taux de réussite
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={evolutionTauxReussite}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="taux" stroke="#f59e0b" strokeWidth={2} name="Taux de réussite (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default StatistiquesView

