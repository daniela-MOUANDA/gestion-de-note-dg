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
    this.niveauDetail = data.niveauDetail || data.niveauNom || data.niveau || ''
    this.moyenneGenerale = data.moyenneGenerale || 0
    this.credits = data.credits || 0
    this.totalModules = data.totalModules || 0
    this.rangClasse = data.rangClasse || 0
    this.estActif = data.estActif || false
    this.estBoursier = data.estBoursier || false
    this.semestre = data.semestre || ''
    this.totalStudentsInClass = data.totalStudentsInClass || 0
    this.derniereConnexion = data.derniereConnexion || null
    this.telephone = data.telephone || null
    this.adresse = data.adresse || null
    this.photo = data.photo || null
    this.dateNaissance = data.dateNaissance || null
    this.lieuNaissance = data.lieuNaissance || null
    this.filiere = data.filiere || data.filiereCode || ''
    this.filiereCode = data.filiereCode || ''
    this.formation = data.formation || ''
    this.classe = data.classe || ''
    this.anneeInscription = data.anneeInscription || ''
    this.anneeAcademique = data.anneeAcademique || ''
    this.statutInscription = data.statutInscription || 'EN_ATTENTE'
    this.dateInscription = data.dateInscription || null
    this.contactParent = data.contactParent || (data.parents && data.parents.length > 0 ? data.parents[0] : null)
    this.parents = data.parents || []
    this.grades = data.grades || []
    this.timetable = data.timetable || []
  }

  get fullName() {
    return `${this.prenom} ${this.nom}`.toUpperCase()
  }

  get identifiantComplet() {
    return `${this.matricule} ${this.programme} ${this.niveau}`
  }
}

