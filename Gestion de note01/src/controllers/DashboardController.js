import { DashboardViewModel } from '../viewModels/DashboardViewModel'

// Contrôleur pour le tableau de bord
export class DashboardController {
  constructor() {
    this.viewModel = new DashboardViewModel()
  }

  getWeekLabel() {
    return this.viewModel.getWeekLabel()
  }

  getDaysOfWeek() {
    return this.viewModel.getDaysOfWeek()
  }

  getCoursesForDay(dayName) {
    return this.viewModel.getCoursesForDay(dayName)
  }

  previousWeek() {
    this.viewModel.previousWeek()
    return this.viewModel
  }

  nextWeek() {
    this.viewModel.nextWeek()
    return this.viewModel
  }
}

