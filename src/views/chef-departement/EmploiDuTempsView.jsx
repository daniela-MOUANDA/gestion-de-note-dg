import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarAlt,
  faPlus,
  faTrash,
  faClock,
  faMapMarkerAlt,
  faSpinner,
  faChevronLeft,
  faChevronRight,
  faWarning,
  faRepeat,
  faFilter,
  faHistory,
  faSave
} from '@fortawesome/free-solid-svg-icons'
import AdminSidebar from '../../components/common/AdminSidebar'
import AdminHeader from '../../components/common/AdminHeader'
import Modal from '../../components/common/Modal'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
// Imports API
import {
  getClasses,
  getModules,
  getEnseignants,
  getEmploiDuTempsPeriode,
  createEmploiDuTempsPeriode,
  deleteEmploiDuTempsId,
  deleteGroupeRecurrence,
  updateGroupeRecurrence,
  updateEmploiDuTempsId,
  getHistoriqueEmploisDuTemps,
  deleteEmploiDuTempsPeriode
} from '../../api/chefDepartement.js'

// Utilitaires de dates
const getMonday = (d) => {
  d = new Date(d);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

const addDays = (d, days) => {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

const formatDateShort = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit'
  });
}

const EmploiDuTempsView = () => {
  const { user } = useAuth()
  const { showAlert } = useAlert()

  // États de sélection
  const [selectedClasse, setSelectedClasse] = useState('')
  const [selectedSemestre, setSelectedSemestre] = useState('S1')

  // États de période globale (pour la création)
  const [periodeDebut, setPeriodeDebut] = useState('2025-09-01')
  const [periodeFin, setPeriodeFin] = useState('2026-01-31')

  // État de navigation (semaine affichée)
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()))

  // Données
  const [classes, setClasses] = useState([])
  const [modules, setModules] = useState([])
  const [enseignants, setEnseignants] = useState([])
  const [emploisTemps, setEmploisTemps] = useState([])

  // UI
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historique, setHistorique] = useState([])

  // Formulaire
  const [formData, setFormData] = useState({
    classeId: '',
    moduleId: '',
    enseignantId: '',
    jour: 'LUNDI',
    heureDebut: '08:00',
    heureFin: '10:00',
    salle: '',
    semestre: 'S1',
    anneeAcademique: '2025-2026',
    dateDebut: '',
    dateFin: '',
    typeActivite: 'COURS',
    estRecurrent: true,
    dateSpecifique: ''
  })

  const [editingId, setEditingId] = useState(null)
  const [editingRecurrenceGroup, setEditingRecurrenceGroup] = useState(null)

  const jours = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']
  const heures = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']

  const loadData = async () => {
    try {
      setLoading(true)
      const [classesRes, modulesRes, enseignantsRes] = await Promise.all([
        getClasses(),
        getModules(),
        getEnseignants()
      ])

      if (classesRes.success) setClasses(classesRes.data || classesRes.classes || [])
      if (modulesRes.success) setModules(modulesRes.data || modulesRes.modules || [])
      if (enseignantsRes.success) setEnseignants(enseignantsRes.data || enseignantsRes.enseignants || [])
    } catch (error) {
      console.error('Erreur loading data:', error)
      showAlert('Erreur de chargement des données', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadEmploiDuTemps = async () => {
    if (!selectedClasse) return

    try {
      setLoadingSchedule(true)
      const weekEnd = addDays(currentWeekStart, 6)

      const result = await getEmploiDuTempsPeriode(
        selectedClasse,
        selectedSemestre,
        currentWeekStart.toISOString().split('T')[0],
        weekEnd.toISOString().split('T')[0]
      )

      if (result.success) {
        setEmploisTemps(result.emploisTemps)
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('Erreur de chargement', 'error')
    } finally {
      setLoadingSchedule(false)
    }
  }

  useEffect(() => {
    loadData()
    loadEmploiDuTemps()
  }, [selectedClasse, selectedSemestre, currentWeekStart])

  const navigateWeek = (direction) => {
    const newDate = addDays(currentWeekStart, direction * 7);
    setCurrentWeekStart(newDate);
  }

  const loadHistorique = async () => {
    // On utilise l'ID du département de l'utilisateur stocké dans le user context ou autre
    // Ici on suppose que user object a departement_id, sinon adapter
    // Pour l'instant on passe '1' ou on récupère dynamiquement
    // TODO: Récupérer le département correct
    const deptId = classes[0]?.filiere?.departement_id || 1

    setLoading(true)
    const result = await getHistoriqueEmploisDuTemps(deptId)
    if (result.success) {
      setHistorique(result.historique)
      setShowHistoryModal(true)
    } else {
      showAlert(result.error, 'error')
    }
    setLoading(false)
  }

  const handleHistoriqueSelect = (item) => {
    setSelectedClasse(item.classeId)
    setSelectedSemestre(item.semestre)
    setPeriodeDebut(item.dateDebut)
    setPeriodeFin(item.dateFin)
    setCurrentWeekStart(getMonday(new Date(item.dateDebut)))
    setShowHistoryModal(false)
  }

  const handleDeleteHistorique = async (item) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer tout l'emploi du temps de la classe ${item.classeNom} pour la période du ${formatDateShort(item.dateDebut)} au ${formatDateShort(item.dateFin)} ?\n\nCette action est irréversible.`)) {
      return
    }

    try {
      setLoading(true)
      const result = await deleteEmploiDuTempsPeriode(item.classeId, item.dateDebut, item.dateFin)

      if (result.success) {
        showAlert(result.message, 'success')
        // Recharger l'historique
        loadHistorique()
        // Si la période supprimée était celle affichée, on recharge la vue
        if (selectedClasse === item.classeId && periodeDebut === item.dateDebut) {
          loadEmploiDuTemps()
        }
      } else {
        showAlert(result.error, 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('Erreur lors de la suppression', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingId(null)
    setEditingRecurrenceGroup(null)
    setFormData({
      classeId: selectedClasse,
      moduleId: '',
      enseignantId: '',
      jour: 'LUNDI',
      heureDebut: '08:00',
      heureFin: '10:00',
      salle: '',
      semestre: selectedSemestre,
      anneeAcademique: '2025-2026',
      dateDebut: periodeDebut,
      dateFin: periodeFin,
      typeActivite: 'COURS',
      estRecurrent: true,
      dateSpecifique: new Date().toISOString().split('T')[0]
    })
    setShowModal(true)
  }

  const handleEdit = (cours) => {
    setEditingId(cours.id)
    setEditingRecurrenceGroup(cours.groupeRecurrence)
    setFormData({
      classeId: selectedClasse,
      moduleId: cours.module?.id || '',
      enseignantId: cours.enseignant?.id || '',
      enseignantNom: cours.enseignant ? `${cours.enseignant.prenom} ${cours.enseignant.nom}` : '',
      jour: cours.jour,
      heureDebut: cours.heureDebut,
      heureFin: cours.heureFin,
      salle: cours.salle || '',
      semestre: selectedSemestre,
      anneeAcademique: '2025-2026',
      dateDebut: cours.dateDebut || periodeDebut,
      dateFin: cours.dateFin || periodeFin,
      typeActivite: cours.typeActivite,
      estRecurrent: cours.estRecurrent,
      dateSpecifique: cours.dateSpecifique
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    // Validation
    if (!formData.classeId || !formData.moduleId || !formData.enseignantId || !formData.heureDebut || !formData.heureFin) {
      showAlert('Veuillez remplir les champs obligatoires', 'error')
      return
    }

    if (formData.estRecurrent && (!formData.dateDebut || !formData.dateFin)) {
      showAlert('La période de validité est requise pour les cours récurrents', 'error')
      return
    }

    if (!formData.estRecurrent && !formData.dateSpecifique) {
      showAlert('La date spécifique est requise pour les événements ponctuels', 'error')
      return
    }

    try {
      setSaving(true)
      let result

      if (editingId) {
        // Mode ÉDITION
        if (editingRecurrenceGroup) {
          // Si c'était un cours récurrent, on met à jour toute la série par défaut
          // Note: Pour affiner (série vs occurrence unique), il faudrait un autre modal de confirmation.
          // Ici on simplifie en mettant à jour le groupe.
          result = await updateGroupeRecurrence(editingRecurrenceGroup, formData)
        } else {
          // Mise à jour d'un événement unique
          result = await updateEmploiDuTempsId(editingId, formData)
        }
      } else {
        // Mode CRÉATION
        result = await createEmploiDuTempsPeriode(formData)
      }

      if (result.success) {
        showAlert(result.message || (editingId ? 'Modifié avec succès' : 'Ajouté avec succès'), 'success')
        setShowModal(false)
        setEditingId(null)
        setEditingRecurrenceGroup(null)
        loadEmploiDuTemps()
      } else {
        showAlert(result.error || 'Erreur lors de la sauvegarde', 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('Erreur technique lors de la sauvegarde', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cours) => {
    const isRecurrent = cours.estRecurrent;
    const message = isRecurrent
      ? 'Voulez-vous supprimer TOUTES les occurrences de ce cours sur la période ?'
      : 'Voulez-vous supprimer cet événement ponctuel ?';

    if (!window.confirm(message)) return;

    try {
      let result;
      if (isRecurrent && cours.groupeRecurrence) {
        result = await deleteGroupeRecurrence(cours.groupeRecurrence)
      } else {
        result = await deleteEmploiDuTempsId(cours.id)
      }

      if (result.success) {
        showAlert('Suppression effectuée', 'success')
        loadEmploiDuTemps()
      } else {
        showAlert(result.error, 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showAlert('Erreur lors de la suppression', 'error')
    }
  }

  const getCoursForCell = (jour, heure) => {
    // Filtrer les cours qui correspondent au jour et à l'heure
    return emploisTemps.filter(edt => {
      // Pour l'affichage semainier, on suppose que le backend a déjà filtré par date
      // On doit juste vérifier le jour de la semaine et l'heure
      if (edt.jour !== jour) return false;
      return edt.heureDebut <= heure && edt.heureFin > heure;
    });
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'TP': return 'bg-green-100 text-green-800 border-green-500';
      case 'TD': return 'bg-orange-100 text-orange-800 border-orange-500';
      case 'DEVOIR': return 'bg-red-100 text-red-800 border-red-500';
      default: return 'bg-blue-100 text-blue-800 border-blue-500';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-600 animate-spin mb-4" />
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <AdminHeader />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-32 lg:pt-32">
          {/* Entête */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Gestion des Emplois du Temps</h1>

              <p className="text-slate-600">Planifiez les cours et devoirs par période</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => loadHistorique()}
                disabled={loading}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faHistory} />
                Historique
              </button>
              <button
                onClick={handleAdd}
                disabled={!selectedClasse}
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} />
                Ajouter
              </button>
            </div>
          </div>

          {/* Contrôles Principaux */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Classe</label>
                <select
                  value={selectedClasse}
                  onChange={(e) => setSelectedClasse(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choisir une classe</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Période Globale (Début)</label>
                <input
                  type="date"
                  value={periodeDebut}
                  onChange={(e) => setPeriodeDebut(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Période Globale (Fin)</label>
                <input
                  type="date"
                  value={periodeFin}
                  onChange={(e) => setPeriodeFin(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <button
              onClick={() => showAlert('Modifications enregistrées', 'success')}
              className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              title="Enregistrer / Valider"
            >
              <FontAwesomeIcon icon={faSave} />
            </button>
          </div>

          {/* Navigation Semaine */}
          {selectedClasse && (
            <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow-sm">
              <button
                onClick={() => navigateWeek(-1)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                <FontAwesomeIcon icon={faChevronLeft} /> Semaine préc.
              </button>

              <div className="text-center">
                <h3 className="font-semibold text-lg text-slate-800">
                  Semaine du {formatDate(currentWeekStart)} au {formatDate(addDays(currentWeekStart, 6))}
                </h3>
              </div>

              <button
                onClick={() => navigateWeek(1)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                Semaine suiv. <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          )}

          {/* Grille Emploi du Temps */}
          {selectedClasse ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-[700px] relative">
              {loadingSchedule && (
                <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faSpinner} className="text-3xl text-blue-600 animate-spin" />
                </div>
              )}

              {/* Header Jours */}
              <div className="flex border-b bg-slate-50 sticky top-0 z-10 w-full">
                <div className="w-16 flex-shrink-0 border-r bg-slate-100"></div> {/* Coin vide */}
                {jours.map((jour, index) => {
                  const dateJour = addDays(currentWeekStart, index);
                  const isToday = new Date().toDateString() === dateJour.toDateString();
                  return (
                    <div key={jour} className={`flex-1 px-2 py-3 text-center border-l first:border-l-0 ${isToday ? 'bg-blue-50' : ''}`}>
                      <div className={`font-bold text-xs uppercase ${isToday ? 'text-blue-700' : 'text-slate-500'}`}>{jour}</div>
                      <div className={`text-sm ${isToday ? 'font-bold text-blue-800' : 'text-slate-700'}`}>{formatDateShort(dateJour)}</div>
                    </div>
                  )
                })}
              </div>

              {/* Corps du planning (Scrollable) */}
              <div className="flex-1 overflow-y-auto relative w-full">
                <div className="flex relative min-h-[800px]">

                  {/* Colonne Heures */}
                  <div className="w-16 flex-shrink-0 bg-slate-50 border-r border-slate-200 relative">
                    {Array.from({ length: 11 }).map((_, i) => {
                      const hour = 8 + i; // 08h à 18h
                      return (
                        <div key={hour} className="absolute w-full text-right pr-2 text-xs text-slate-400 -mt-2" style={{ top: `${i * 80}px` }}>
                          {hour}:00
                        </div>
                      )
                    })}
                  </div>

                  {/* Grille Jours */}
                  {jours.map((jour, index) => {
                    const dateJour = addDays(currentWeekStart, index);
                    // Conversion de la date au format YYYY-MM-DD
                    const dateStr = dateJour.toISOString().split('T')[0];

                    // Filtrage des cours pour ce jour précis
                    // Filtrage des cours pour ce jour précis
                    const coursDuJour = emploisTemps.filter(edt => {
                      if (!edt) return false;
                      // Si c'est un cours récurrent, on vérifie juste le JOUR
                      if (edt.estRecurrent) {
                        return edt.jour && edt.jour.toUpperCase() === jour.toUpperCase();
                      }
                      // Si c'est ponctuel, on vérifie la date exacte
                      return edt.dateSpecifique === dateStr;
                    });

                    return (
                      <div key={jour} className="flex-1 relative border-l border-slate-100 bg-white min-w-[150px]">
                        {/* Lignes horizontales pour les heures */}
                        {Array.from({ length: 11 }).map((_, i) => (
                          <div key={i} className="absolute w-full border-b border-slate-50 h-[80px]" style={{ top: `${i * 80}px` }}></div>
                        ))}

                        {/* Rendering des cours */}
                        {coursDuJour.map(cours => {
                          if (!cours.heureDebut || !cours.heureFin) return null;
                          const [hDebut, mDebut] = cours.heureDebut.split(':').map(Number);
                          const [hFin, mFin] = cours.heureFin.split(':').map(Number);

                          // Calcul position : (Heure - 8h) * 80px + (Minutes / 60 * 80px)
                          const startHour = 8;
                          const pixelsPerHour = 80;

                          const top = ((hDebut - startHour) * pixelsPerHour) + ((mDebut / 60) * pixelsPerHour);
                          const durationMinutes = ((hFin - hDebut) * 60) + (mFin - mDebut);
                          const height = (durationMinutes / 60) * pixelsPerHour;

                          return (
                            <div
                              key={cours.id}
                              onClick={() => handleEdit(cours)}
                              className={`absolute mx-1 left-0 right-0 p-2 rounded-lg border-l-4 text-xs shadow-sm overflow-hidden hover:z-20 hover:shadow-md transition-all group cursor-pointer ${getTypeColor(cours.typeActivite)}`}
                              style={{ top: `${top}px`, height: `${height}px`, minHeight: '50px' }}
                            >
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="font-bold truncate text-sm">{cours.module?.code}</span>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-white/50">
                                    {cours.typeActivite}
                                  </span>
                                  {cours.estRecurrent && (
                                    <div className="opacity-50" title="Récurrent">
                                      <FontAwesomeIcon icon={faRepeat} />
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="truncate font-medium mb-1" title={cours.module?.nom}>{cours.module?.nom}</div>

                              <div className="flex items-center gap-1 opacity-80 text-[10px]">
                                <FontAwesomeIcon icon={faClock} className="w-3" />
                                {cours.heureDebut} - {cours.heureFin}
                              </div>
                              <div className="flex items-center gap-1 opacity-80 text-[10px]">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3" />
                                {cours.salle || 'N/A'}
                              </div>

                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(cours); }}
                                className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 text-red-600 bg-white/80 p-1.5 rounded hover:bg-white shadow-sm transition-opacity"
                                title="Supprimer"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-6xl text-slate-300 mb-4" />
              <p className="text-slate-600 text-lg">Sélectionnez une classe pour commencer</p>
            </div>
          )
          }

          {/* Modal Ajout - VERSION LARGE PAYSAGE */}
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title="Ajouter à l'emploi du temps"
            size="4xl"
          >
            <div className="p-6 space-y-6">
              {/* Type d'ajout */}
              <div className="flex gap-4 p-1 bg-slate-100 rounded-lg max-w-md mx-auto">
                <button
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${formData.estRecurrent ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setFormData({ ...formData, estRecurrent: true })}
                >
                  <FontAwesomeIcon icon={faRepeat} className="mr-2" />
                  Cours Récurrent
                </button>
                <button
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${!formData.estRecurrent ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setFormData({ ...formData, estRecurrent: false, typeActivite: 'DEVOIR' })}
                >
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                  Événement Ponctuel
                </button>
              </div>

              {/* Grille principale 3 Colonnes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Colonne 1 : Infos Cours */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div>
                    <h4 className="font-semibold text-slate-700">Le Cours</h4>
                  </div>

                  {/* Logique de sélection Module & Enseignant */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Module *</label>
                    <select
                      value={formData.moduleId}
                      onChange={(e) => {
                        const module = modules.find(m => m.id === e.target.value)
                        // Trouver l'enseignant affecté par défaut
                        const enseignant = module?.enseignants?.[0]
                        const enseignantId = enseignant?.id || ''
                        const enseignantNom = enseignant ? `${enseignant.prenom} ${enseignant.nom}` : ''

                        setFormData({
                          ...formData,
                          moduleId: e.target.value,
                          enseignantId: enseignantId,
                          enseignantNom: enseignantNom
                        })
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner un module</option>
                      {modules.filter(m => {
                        const classe = classes.find(c => c.id === selectedClasse);
                        if (!classe) return false;

                        // On affiche tous les modules de la filière, peu importe le semestre
                        return m.filiereId === classe.filiereId;
                      }).map(m => {
                        const enseignant = m.enseignants?.[0]
                        const profName = enseignant ? `(Pr. ${enseignant.nom})` : '(Sans prof.)'
                        return (
                          <option key={m.id} value={m.id}>{m.code} - {m.nom} {profName}</option>
                        )
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type Activité</label>
                    <select
                      value={formData.typeActivite}
                      onChange={(e) => setFormData({ ...formData, typeActivite: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="COURS">Cours Magistral</option>
                      <option value="TP">Travaux Pratiques (TP)</option>
                      <option value="TD">Travaux Dirigés (TD)</option>
                      <option value="DEVOIR">Devoir / Examen</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Enseignant Responsable</label>
                    {formData.enseignantId ? (
                      <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        {/* On cherche le nom dans la liste si on l'a pas stocké directement, ou on utilise celui stocké */}
                        {enseignants.find(e => e.id === formData.enseignantId)?.prenom} {enseignants.find(e => e.id === formData.enseignantId)?.nom}
                      </div>
                    ) : (
                      <select
                        value={formData.enseignantId}
                        onChange={(e) => setFormData({ ...formData, enseignantId: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="">Sélectionner (si non assigné)</option>
                        {enseignants.map(e => (
                          <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>
                        ))}
                      </select>
                    )}
                    {formData.enseignantId && (
                      <div className="mt-1 text-xs text-slate-500 italic">
                        L'enseignant est automatiquement défini par le module.
                      </div>
                    )}
                  </div>
                </div>

                {/* Colonne 2 : Temps & Lieu */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">2</div>
                    <h4 className="font-semibold text-slate-700">Horaire & Salle</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Heure Début *</label>
                      <input
                        type="time"
                        value={formData.heureDebut}
                        onChange={(e) => setFormData({ ...formData, heureDebut: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Heure Fin *</label>
                      <input
                        type="time"
                        value={formData.heureFin}
                        onChange={(e) => setFormData({ ...formData, heureFin: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Salle</label>
                    <input
                      type="text"
                      value={formData.salle}
                      onChange={(e) => setFormData({ ...formData, salle: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Ex: Salle 101"
                    />
                  </div>
                </div>

                {/* Colonne 3 : Planification */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">3</div>
                    <h4 className="font-semibold text-slate-700">Périodicité</h4>
                  </div>

                  {formData.estRecurrent ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Jour de la semaine *</label>
                        <select
                          value={formData.jour}
                          onChange={(e) => setFormData({ ...formData, jour: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg bg-blue-50 border-blue-200 text-blue-800 font-medium"
                        >
                          {jours.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Validité (Période)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-xs text-slate-500">Du</span>
                            <input
                              type="date"
                              value={formData.dateDebut}
                              onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <span className="text-xs text-slate-500">Au</span>
                            <input
                              type="date"
                              value={formData.dateFin}
                              onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded border border-blue-100 italic mt-2">
                        <FontAwesomeIcon icon={faRepeat} className="mr-1" />
                        Cours répété chaque {formData.jour.toLowerCase()}.
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date de l'événement *</label>
                        <input
                          type="date"
                          value={formData.dateSpecifique}
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            const days = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
                            setFormData({
                              ...formData,
                              dateSpecifique: e.target.value,
                              jour: days[date.getDay()]
                            });
                          }}
                          className="w-full px-3 py-2 border rounded-lg bg-red-50 border-red-200 text-red-800"
                        />
                      </div>
                      <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded italic border">
                        Cet événement n'apparaîtra qu'une seule fois à la date indiquée.
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-lg shadow-blue-200 transition-transform active:scale-95"
                >
                  {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                  {formData.estRecurrent ? 'Créer la série' : 'Créer l\'événement'}
                </button>
              </div>
            </div>
          </Modal >
        </main >
      </div >
      {/* Modal Historique */}
      {
        showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800">Historique des Emplois du Temps</h3>
                <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600">
                  &times;
                </button>
              </div>
              <div className="p-4 overflow-y-auto">
                {historique.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">Aucun historique trouvé.</div>
                ) : (
                  <div className="space-y-2">
                    {historique.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2"
                      >
                        <div
                          onClick={() => handleHistoriqueSelect(item)}
                          className="flex-1 p-3 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors flex justify-between items-center bg-white"
                        >
                          <div>
                            <div className="font-bold text-slate-800">{item.classeNom}</div>
                            <div className="text-sm text-slate-500">
                              Semestre {item.semestre} • Du {formatDateShort(item.dateDebut)} au {formatDateShort(item.dateFin)}
                            </div>
                          </div>
                          <div className="text-blue-600">
                            <FontAwesomeIcon icon={faChevronRight} />
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteHistorique(item)}
                          className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                          title="Supprimer cet historique"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}

export default EmploiDuTempsView
