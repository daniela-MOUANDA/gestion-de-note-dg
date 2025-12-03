// Modèle de données pour un cours
export class CourseModel {
  constructor(data = {}) {
    this.id = data.id || null
    this.type = data.type || '' // 'Cours' ou 'TP'
    this.heureDebut = data.heureDebut || ''
    this.heureFin = data.heureFin || ''
    this.matiere = data.matiere || ''
    this.professeur = data.professeur || ''
    this.salle = data.salle || ''
    this.jour = data.jour || ''
    this.date = data.date || ''
  }

  get horaire() {
    return `${this.heureDebut}/${this.heureFin}`
  }
}

