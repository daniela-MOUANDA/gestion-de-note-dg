# Application de Gestion de Notes - Espace Étudiant

Application React pour la gestion de notes avec architecture MVCV (Model-View-Controller-ViewModel).

## Structure du projet

```
src/
├── models/           # Modèles de données
├── viewModels/       # ViewModels pour la logique métier
├── controllers/      # Contrôleurs pour gérer les interactions
├── views/           # Vues (composants React)
│   └── student/     # Vues spécifiques aux étudiants
└── components/      # Composants réutilisables
    └── common/      # Composants communs
```

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Lancer le serveur de développement :
```bash
npm run dev
```

3. Ouvrir le navigateur à l'adresse indiquée (généralement http://localhost:5173)

## Technologies utilisées

- React 18
- React Router DOM
- Tailwind CSS
- Vite

## Architecture MVCV

- **Models** : Représentent les structures de données (StudentModel, CourseModel)
- **ViewModels** : Contiennent la logique métier et l'état de la vue
- **Controllers** : Gèrent les interactions entre les vues et les ViewModels
- **Views** : Composants React qui affichent l'interface utilisateur

## Interfaces disponibles

- `/login` : Page de connexion
- `/dashboard` : Tableau de bord étudiant

