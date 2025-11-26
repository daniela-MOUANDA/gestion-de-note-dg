import { LoginViewModel } from '../viewModels/LoginViewModel'

// Contrôleur pour la gestion de la connexion
export class LoginController {
  constructor() {
    this.viewModel = new LoginViewModel()
  }

  handleEmailChange(email) {
    this.viewModel.setEmail(email)
    return this.viewModel
  }

  handleMatriculeChange(matricule) {
    this.viewModel.setMatricule(matricule)
    return this.viewModel
  }

  handlePasswordChange(password) {
    this.viewModel.setPassword(password)
    return this.viewModel
  }

  async handleLogin() {
    return await this.viewModel.login()
  }
}

