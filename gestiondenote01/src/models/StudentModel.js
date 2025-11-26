// Modèle de données pour l'étudiant
export class StudentModel {
  constructor(data = {}) {
    this.id = data.id || null
    this.email = data.email || ''
    this.matricule = data.matricule || ''
    this.nom = data.nom || ''
    this.prenom = data.prenom || ''
    this.programme = data.programme || ''
    this.niveau = data.niveau || ''
    this.moyenneGenerale = data.moyenneGenerale || 0
    this.credits = data.credits || 0
    this.totalModules = data.totalModules || 0
    this.rangClasse = data.rangClasse || 0
    this.estActif = data.estActif || false
    this.estBoursier = data.estBoursier || false
    this.semestre = data.semestre || ''
    this.derniereConnexion = data.derniereConnexion || null
  }

  get fullName() {
    return `${this.prenom} ${this.nom}`.toUpperCase()
  }

  get identifiantComplet() {
    return `${this.matricule} ${this.programme} ${this.niveau}`
  }
}

