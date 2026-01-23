import { DashboardViewModel } from '../viewModels/DashboardViewModel'

// Contrôleur pour le tableau de bord
export class DashboardController {
  constructor(initialCourses = []) {
    this.viewModel = new DashboardViewModel(initialCourses)
  }

  setCourses(courses) {
    this.viewModel.setCourses(courses)
  }

  getWeekLabel() {
    return this.viewModel.getWeekLabel()
  }

  getDaysOfWeek() {
    return this.viewModel.getDaysOfWeek()
  }

  getCoursesForDay(day) {
    return this.viewModel.getCoursesForDay(day)
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

