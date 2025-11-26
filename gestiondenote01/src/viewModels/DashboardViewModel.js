import { CourseModel } from '../models/CourseModel'

// ViewModel pour le tableau de bord
export class DashboardViewModel {
  constructor() {
    this.currentWeek = new Date()
    this.courses = []
    this.loadCourses()
  }

  loadCourses() {
    // Données simulées pour le développement
    // TODO: Remplacer par un vrai appel API
    this.courses = [
      new CourseModel({
        id: 1,
        type: 'Cours',
        heureDebut: '08:00',
        heureFin: '10:00',
        matiere: 'Programmation web',
        professeur: 'Mr Maty',
        salle: 'Salle INFO 2',
        jour: 'Lundi',
        date: '2025-11-17'
      }),
      new CourseModel({
        id: 2,
        type: 'TP',
        heureDebut: '10:15',
        heureFin: '12:15',
        matiere: 'Base de données',
        professeur: '',
        salle: '',
        jour: 'Lundi',
        date: '2025-11-17'
      }),
      new CourseModel({
        id: 3,
        type: 'Cours',
        heureDebut: '08:00',
        heureFin: '10:00',
        matiere: 'Réseaux',
        professeur: 'Mr Ossene',
        salle: 'Salle INFO 2',
        jour: 'Mardi',
        date: '2025-11-18'
      }),
      new CourseModel({
        id: 4,
        type: 'Cours',
        heureDebut: '08:00',
        heureFin: '10:00',
        matiere: 'Réseaux',
        professeur: 'Mr Ossene',
        salle: 'Salle INFO 2',
        jour: 'Mercredi',
        date: '2025-11-19'
      })
    ]
  }

  getWeekRange() {
    const startOfWeek = new Date(this.currentWeek)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    return { start: startOfWeek, end: endOfWeek }
  }

  getWeekLabel() {
    const { start, end } = this.getWeekRange()
    const options = { day: 'numeric', month: 'long', year: 'numeric' }
    return `Semaine du ${start.getDate()} au ${end.getDate()} ${end.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
  }

  getCoursesForDay(dayName) {
    return this.courses.filter(course => course.jour === dayName)
  }

  previousWeek() {
    const newDate = new Date(this.currentWeek)
    newDate.setDate(newDate.getDate() - 7)
    this.currentWeek = newDate
  }

  nextWeek() {
    const newDate = new Date(this.currentWeek)
    newDate.setDate(newDate.getDate() + 7)
    this.currentWeek = newDate
  }

  getDaysOfWeek() {
    const { start } = this.getWeekRange()
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
    const result = []
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      result.push({
        name: days[i],
        date: date,
        dateStr: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      })
    }
    
    return result
  }
}

