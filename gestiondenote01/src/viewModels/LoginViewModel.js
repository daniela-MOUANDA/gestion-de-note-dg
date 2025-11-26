// ViewModel pour la gestion de la connexion
export class LoginViewModel {
  constructor() {
    this.email = ''
    this.matricule = ''
    this.password = ''
    this.errors = {}
    this.isLoading = false
  }

  setEmail(email) {
    this.email = email
    this.validateEmail()
  }

  setMatricule(matricule) {
    this.matricule = matricule
    this.validateMatricule()
  }

  setPassword(password) {
    this.password = password
    this.validatePassword()
  }

  validateEmail() {
    if (!this.email) {
      this.errors.email = 'L\'email est requis'
    } else if (!/\S+@\S+\.\S+/.test(this.email)) {
      this.errors.email = 'L\'email n\'est pas valide'
    } else {
      delete this.errors.email
    }
  }

  validateMatricule() {
    if (!this.matricule) {
      this.errors.matricule = 'Le matricule est requis'
    } else {
      delete this.errors.matricule
    }
  }

  validatePassword() {
    if (!this.password) {
      this.errors.password = 'Le mot de passe est requis'
    } else if (this.password.length < 6) {
      this.errors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    } else {
      delete this.errors.password
    }
  }

  isValid() {
    this.validateEmail()
    this.validateMatricule()
    this.validatePassword()
    return Object.keys(this.errors).length === 0
  }

  async login() {
    if (!this.isValid()) {
      return { success: false, errors: this.errors }
    }

    this.isLoading = true
    try {
      // Simulation d'une requête API
      // TODO: Remplacer par un vrai appel API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Données simulées pour le développement
      const studentData = {
        id: 1,
        email: this.email,
        matricule: this.matricule,
        nom: 'MOMBO',
        prenom: 'Daniel',
        programme: 'GI 2025 Génie Informatique',
        niveau: 'L3',
        moyenneGenerale: 14.5,
        credits: 24,
        totalModules: 15,
        rangClasse: 5,
        estActif: true,
        estBoursier: true,
        semestre: 'Semestre 5',
        derniereConnexion: new Date().toISOString()
      }

      this.isLoading = false
      return { success: true, data: studentData }
    } catch (error) {
      this.isLoading = false
      return { success: false, error: error.message }
    }
  }
}

