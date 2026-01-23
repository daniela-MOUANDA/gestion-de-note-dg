import { CourseModel } from '../models/CourseModel'

// ViewModel pour le tableau de bord
export class DashboardViewModel {
  constructor(initialCourses = []) {
    this.currentWeek = new Date()
    this.courses = initialCourses
  }

  setCourses(courses) {
    this.courses = (courses || []).map(c => c instanceof CourseModel ? c : new CourseModel(c))
  }

  getWeekRange() {
    const startOfWeek = new Date(this.currentWeek)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    return { start: startOfWeek, end: endOfWeek }
  }

  getWeekLabel() {
    const { start, end } = this.getWeekRange()
    const options = { day: 'numeric', month: 'long', year: 'numeric' }
    return `Semaine du ${start.getDate()} au ${end.getDate()} ${end.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
  }

  getCoursesForDay(day) {
    if (!day || !day.date) return []

    // Helper pour obtenir YYYY-MM-DD local
    const toLocalISO = (d) => {
      const date = new Date(d)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

    const targetDateStr = toLocalISO(day.date)

    return this.courses.filter(course => {
      // Un devoir est TOUJOURS ponctuel (même si la BD dit le contraire pour de vieilles données)
      const isDevoir = (course.type || '').toUpperCase() === 'DEVOIR'
      const isPonctuel = !course.isRecurrent || isDevoir

      if (isPonctuel) {
        // Pour un ponctuel (ou devoir), on exige une correspondance de DATE exacte
        if (!course.date) return false // Un ponctuel sans date ne s'affiche pas

        const courseDateStr = typeof course.date === 'string'
          ? course.date.split('T')[0]
          : toLocalISO(course.date)

        return courseDateStr === targetDateStr
      }

      // Pour les cours récurrents normaux, on utilise le nom du jour
      return (course.jour || '').toUpperCase() === day.name.toUpperCase()
    })
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
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    const result = []

    for (let i = 0; i < 6; i++) {
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

