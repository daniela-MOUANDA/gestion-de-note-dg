import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faFileAlt, faCalendar, faArrowLeft, faGraduationCap, faBook,
  faDownload, faEye, faCheckCircle, faHourglassHalf, faAward, faArchive
} from '@fortawesome/free-solid-svg-icons'
import SidebarScolarite from '../../components/common/SidebarScolarite'
import HeaderScolarite from '../../components/common/HeaderScolarite'
import SidebarChef from '../../components/common/SidebarChef'
import HeaderChef from '../../components/common/HeaderChef'

const ProcesVerbauxView = () => {
  const location = useLocation()
  const isChefView = location.pathname.startsWith('/chef-scolarite')
  const Sidebar = isChefView ? SidebarChef : SidebarScolarite
  const Header = isChefView ? HeaderChef : HeaderScolarite
  const [selectedPromotion, setSelectedPromotion] = useState('') // '2024-2025', '2023-2024', etc.
  const [selectedFiliere, setSelectedFiliere] = useState('') // 'RT', 'GI', 'MTIC', 'AV'
  const [selectedNiveau, setSelectedNiveau] = useState('') // 'L1', 'L2', 'L3'
  const [selectedClasse, setSelectedClasse] = useState('') // 'RT-1A', 'GI-2B', etc.
  const [selectedTypeRattrapage, setSelectedTypeRattrapage] = useState('') // 'avant' ou 'apres'
  const [selectedTypePV, setSelectedTypePV] = useState('') // 'S1', 'S2', 'annuel'
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [pvArchived, setPvArchived] = useState(false)

  // Promotions disponibles
  const promotions = [
    { id: '2024-2025', nom: '2024-2025', statut: 'en_cours', nbPV: 12 },
    { id: '2023-2024', nom: '2023-2024', statut: 'archive', nbPV: 24 },
    { id: '2022-2023', nom: '2022-2023', statut: 'archive', nbPV: 24 },
    { id: '2021-2022', nom: '2021-2022', statut: 'archive', nbPV: 24 }
  ]

  const filieres = [
    { id: 'RT', nom: 'Réseau et Télécom' },
    { id: 'GI', nom: 'Génie Informatique' },
    { id: 'MTIC', nom: 'Métiers des TIC' },
    { id: 'AV', nom: 'Audiovisuel' }
  ]

  const niveaux = ['L1', 'L2', 'L3']

  // Classes par filière et niveau
  const getClasses = (filiere, niveau) => {
    const niveauNum = niveau.replace('L', '')
    return [
      { id: `${filiere}-${niveauNum}A`, nom: `${filiere}-${niveauNum}A`, effectif: 35 },
      { id: `${filiere}-${niveauNum}B`, nom: `${filiere}-${niveauNum}B`, effectif: 32 },
      { id: `${filiere}-${niveauNum}C`, nom: `${filiere}-${niveauNum}C`, effectif: 28 }
    ]
  }

  // Données d'exemple pour les PV (envoyés par la Direction des Études)
  // Structure: promotion -> filière -> niveau -> avant/après -> S1/S2/annuel
  const pvData = {
    '2024-2025': {
      'RT': {
        'L1': {
          'avant': {
            'S1': {
              effectif: 35,
              presents: 33,
              admis: 28,
              ajourne: 5,
              tauxReussite: 84.8,
              datePV: '2025-01-20',
              dateReception: '2025-01-22',
              president: 'Dr. NKOGHE Jean',
              rapporteur: 'Pr. OBAME Marie',
              statut: 'nouveau',
              envoyePar: 'Direction des Études Pédagogiques'
            },
            'S2': {
              effectif: 35,
              presents: 34,
              admis: 29,
              ajourne: 5,
              tauxReussite: 85.3,
              datePV: '2025-06-20',
              dateReception: '2025-06-22',
              president: 'Dr. NKOGHE Jean',
              rapporteur: 'Pr. OBAME Marie',
              statut: 'nouveau',
              envoyePar: 'Direction des Études Pédagogiques'
            },
            'annuel': {
              effectif: 35,
              presents: 33,
              admis: 27,
              ajourne: 6,
              tauxReussite: 81.8,
              datePV: '2025-06-25',
              dateReception: '2025-06-27',
              president: 'Dr. NKOGHE Jean',
              rapporteur: 'Pr. OBAME Marie',
              statut: 'nouveau',
              envoyePar: 'Direction des Études Pédagogiques'
            }
          },
          'apres': {
            'S1': {
              effectif: 35,
              presents: 33,
              admis: 31,
              ajourne: 2,
              tauxReussite: 93.9,
              datePV: '2025-02-15',
              dateReception: '2025-02-16',
              president: 'Dr. NKOGHE Jean',
              rapporteur: 'Pr. OBAME Marie',
              statut: 'nouveau',
              envoyePar: 'Direction des Études Pédagogiques'
            },
            'S2': {
              effectif: 35,
              presents: 34,
              admis: 33,
              ajourne: 1,
              tauxReussite: 97.1,
              datePV: '2025-07-10',
              dateReception: '2025-07-11',
              president: 'Dr. NKOGHE Jean',
              rapporteur: 'Pr. OBAME Marie',
              statut: 'vu',
              envoyePar: 'Direction des Études Pédagogiques'
            },
            'annuel': {
              effectif: 35,
              presents: 33,
              admis: 32,
              ajourne: 1,
              tauxReussite: 97,
              datePV: '2025-07-15',
              dateReception: '2025-07-16',
              president: 'Dr. NKOGHE Jean',
              rapporteur: 'Pr. OBAME Marie',
              statut: 'vu',
              envoyePar: 'Direction des Études Pédagogiques'
            }
          }
        },
        'L2': {
          'avant': {
            'S1': {
              effectif: 32,
              presents: 30,
              admis: 26,
              ajourne: 4,
              tauxReussite: 86.7,
              datePV: '2025-01-20',
              dateReception: '2025-01-22',
              president: 'Dr. MVOU Patrick',
              rapporteur: 'Pr. EBANG Sophie',
              statut: 'nouveau',
              envoyePar: 'Direction des Études Pédagogiques'
            },
            'S2': {
              effectif: 32,
              presents: 31,
              admis: 27,
              ajourne: 4,
              tauxReussite: 87.1,
              datePV: '2025-06-20',
              dateReception: '2025-06-22',
              president: 'Dr. MVOU Patrick',
              rapporteur: 'Pr. EBANG Sophie',
              statut: 'vu',
              envoyePar: 'Direction des Études Pédagogiques'
            },
            'annuel': {
              effectif: 32,
              presents: 30,
              admis: 25,
              ajourne: 5,
              tauxReussite: 83.3,
              datePV: '2025-06-25',
              dateReception: '2025-06-27',
              president: 'Dr. MVOU Patrick',
              rapporteur: 'Pr. EBANG Sophie',
              statut: 'vu',
              envoyePar: 'Direction des Études Pédagogiques'
            }
          },
          'apres': {
            'S1': {
              effectif: 32,
              presents: 30,
              admis: 29,
              ajourne: 1,
              tauxReussite: 96.7,
              datePV: '2025-02-15',
              dateReception: '2025-02-16',
              president: 'Dr. MVOU Patrick',
              rapporteur: 'Pr. EBANG Sophie',
              statut: 'vu',
              envoyePar: 'Direction des Études Pédagogiques'
            },
            'S2': {
              effectif: 32,
              presents: 31,
              admis: 30,
              ajourne: 1,
              tauxReussite: 96.8,
              datePV: '2025-07-10',
              dateReception: '2025-07-11',
              president: 'Dr. MVOU Patrick',
              rapporteur: 'Pr. EBANG Sophie',
              statut: 'archivé',
              envoyePar: 'Direction des Études Pédagogiques'
            },
            'annuel': {
              effectif: 32,
              presents: 30,
              admis: 29,
              ajourne: 1,
              tauxReussite: 96.7,
              datePV: '2025-07-15',
              dateReception: '2025-07-16',
              president: 'Dr. MVOU Patrick',
              rapporteur: 'Pr. EBANG Sophie',
              statut: 'archivé',
              envoyePar: 'Direction des Études Pédagogiques'
            }
          }
        },
        'L3': {
          'avant': {
            'S1': {
              effectif: 28,
              presents: 27,
              admis: 24,
              ajourne: 3,
              tauxReussite: 88.9,
              datePV: '2025-01-20',
              dateReception: '2025-01-22',
              president: 'Pr. ANGO Joseph',
              rapporteur: 'Dr. NDONG Claire',
              statut: 'nouveau',
              envoyePar: 'Direction des Études Pédagogiques'
            },
            'S2': {
              effectif: 28,
              presents: 28,
              admis: 25,
              ajourne: 3,
              tauxReussite: 89.3,
              datePV: '2025-06-20',
              dateReception: '2025-06-22',
              president: 'Pr. ANGO Joseph',
              rapporteur: 'Dr. NDONG Claire',
              statut: 'vu',
              envoyePar: 'Direction des Études Pédagogiques'
            },
            'annuel': {
              effectif: 28,
              presents: 27,
              admis: 23,
              ajourne: 4,
              tauxReussite: 85.2,
              datePV: '2025-06-25',
              dateReception: '2025-06-27',
              president: 'Pr. ANGO Joseph',
              rapporteur: 'Dr. NDONG Claire',
              statut: 'vu',
              envoyePar: 'Direction des Études Pédagogiques'
            }
          },
          'apres': {
            'S1': {
              effectif: 28,
              presents: 27,
              admis: 26,
              ajourne: 1,
              tauxReussite: 96.3,
              datePV: '2025-02-15',
              dateReception: '2025-02-16',
              president: 'Pr. ANGO Joseph',
              rapporteur: 'Dr. NDONG Claire',
              statut: 'vu',
              envoyePar: 'Direction des Études Pédagogiques'
            },
            'S2': {
              effectif: 28,
              presents: 28,
              admis: 27,
              ajourne: 1,
              tauxReussite: 96.4,
              datePV: '2025-07-10',
              dateReception: '2025-07-11',
              president: 'Pr. ANGO Joseph',
              rapporteur: 'Dr. NDONG Claire',
              statut: 'archivé',
              envoyePar: 'Direction des Études Pédagogiques'
            },
            'annuel': {
              effectif: 28,
              presents: 27,
              admis: 26,
              ajourne: 1,
              tauxReussite: 96.3,
              datePV: '2025-07-15',
              dateReception: '2025-07-16',
              president: 'Pr. ANGO Joseph',
              rapporteur: 'Dr. NDONG Claire',
              statut: 'archivé',
              envoyePar: 'Direction des Études Pédagogiques'
            }
          }
        }
      },
      'GI': {
        'L1': {
          'avant': {
            'S1': {
              effectif: 35,
              presents: 33,
              admis: 28,
              ajourne: 5,
              tauxReussite: 84.8,
              datePV: '2025-01-20',
              dateReception: '2025-01-22',
              president: 'Dr. NKOGHE Jean',
              rapporteur: 'Pr. OBAME Marie',
              statut: 'nouveau',
              envoyePar: 'Direction des Études Pédagogiques'
            },
            'S2': {
              effectif: 35,
              presents: 34,
              admis: 29,
              ajourne: 5,
              tauxReussite: 85.3,
              datePV: '2025-06-20',
              dateReception: '2025-06-22',
              president: 'Dr. NKOGHE Jean',
              rapporteur: 'Pr. OBAME Marie',
              statut: 'nouveau',
              envoyePar: 'Direction des Études Pédagogiques'
            },
            'annuel': {
              effectif: 35,
              presents: 33,
              admis: 27,
              ajourne: 6,
              tauxReussite: 81.8,
              datePV: '2025-06-25',
              dateReception: '2025-06-27',
              president: 'Dr. NKOGHE Jean',
              rapporteur: 'Pr. OBAME Marie',
              statut: 'nouveau',
              envoyePar: 'Direction des Études Pédagogiques'
            }
          },
          'apres': {
            'S1': {
              effectif: 35,
              presents: 33,
              admis: 31,
              ajourne: 2,
              tauxReussite: 93.9,
              datePV: '2025-02-15',
              dateReception: '2025-02-16',
              president: 'Dr. NKOGHE Jean',
              rapporteur: 'Pr. OBAME Marie',
              statut: 'nouveau',
              envoyePar: 'Direction des Études Pédagogiques'
            },
            'S2': {
              effectif: 35,
              presents: 34,
              admis: 33,
              ajourne: 1,
              tauxReussite: 97.1,
              datePV: '2025-07-10',
              dateReception: '2025-07-11',
              president: 'Dr. NKOGHE Jean',
              rapporteur: 'Pr. OBAME Marie',
              statut: 'vu',
              envoyePar: 'Direction des Études Pédagogiques'
            },
            'annuel': {
              effectif: 35,
              presents: 33,
              admis: 32,
              ajourne: 1,
              tauxReussite: 97,
              datePV: '2025-07-15',
              dateReception: '2025-07-16',
              president: 'Dr. NKOGHE Jean',
              rapporteur: 'Pr. OBAME Marie',
              statut: 'vu',
              envoyePar: 'Direction des Études Pédagogiques'
            }
          }
        },
        'L2': {
          'avant': {
            'S1': { effectif: 28, presents: 27, admis: 24, ajourne: 3, tauxReussite: 88.9, datePV: '2025-01-20', dateReception: '2025-01-22', president: 'Dr. NKOGHE Jean', rapporteur: 'Pr. OBAME Marie', statut: 'vu', envoyePar: 'Direction des Études Pédagogiques' },
            'S2': null,
            'annuel': null
          },
          'apres': {
            'S1': { effectif: 28, presents: 27, admis: 26, ajourne: 1, tauxReussite: 96.3, datePV: '2025-02-15', dateReception: '2025-02-16', president: 'Dr. NKOGHE Jean', rapporteur: 'Pr. OBAME Marie', statut: 'vu', envoyePar: 'Direction des Études Pédagogiques' },
            'S2': null,
            'annuel': null
          }
        },
        'L3': {
          'avant': {
            'S1': { effectif: 22, presents: 22, admis: 20, ajourne: 2, tauxReussite: 90.9, datePV: '2025-01-20', dateReception: '2025-01-22', president: 'Dr. NKOGHE Jean', rapporteur: 'Pr. OBAME Marie', statut: 'archive', envoyePar: 'Direction des Études Pédagogiques' },
            'S2': null,
            'annuel': null
          },
          'apres': {
            'S1': { effectif: 22, presents: 22, admis: 22, ajourne: 0, tauxReussite: 100, datePV: '2025-02-15', dateReception: '2025-02-16', president: 'Dr. NKOGHE Jean', rapporteur: 'Pr. OBAME Marie', statut: 'archive', envoyePar: 'Direction des Études Pédagogiques' },
            'S2': null,
            'annuel': null
          }
        }
      },
      'MTIC': {
        'L1': {
          'avant': {
            'S1': { effectif: 30, presents: 29, admis: 25, ajourne: 4, tauxReussite: 86.2, datePV: '2025-01-20', dateReception: '2025-01-22', president: 'Dr. EKOMY Paul', rapporteur: 'Pr. MINTSA Claire', statut: 'nouveau', envoyePar: 'Direction des Études Pédagogiques' },
            'S2': { effectif: 30, presents: 30, admis: 26, ajourne: 4, tauxReussite: 86.7, datePV: '2025-06-20', dateReception: '2025-06-22', president: 'Dr. EKOMY Paul', rapporteur: 'Pr. MINTSA Claire', statut: 'nouveau', envoyePar: 'Direction des Études Pédagogiques' },
            'annuel': { effectif: 30, presents: 29, admis: 24, ajourne: 5, tauxReussite: 82.8, datePV: '2025-06-25', dateReception: '2025-06-27', president: 'Dr. EKOMY Paul', rapporteur: 'Pr. MINTSA Claire', statut: 'nouveau', envoyePar: 'Direction des Études Pédagogiques' }
          },
          'apres': {
            'S1': { effectif: 30, presents: 29, admis: 28, ajourne: 1, tauxReussite: 96.6, datePV: '2025-02-15', dateReception: '2025-02-16', president: 'Dr. EKOMY Paul', rapporteur: 'Pr. MINTSA Claire', statut: 'vu', envoyePar: 'Direction des Études Pédagogiques' },
            'S2': { effectif: 30, presents: 30, admis: 29, ajourne: 1, tauxReussite: 96.7, datePV: '2025-07-10', dateReception: '2025-07-11', president: 'Dr. EKOMY Paul', rapporteur: 'Pr. MINTSA Claire', statut: 'vu', envoyePar: 'Direction des Études Pédagogiques' },
            'annuel': { effectif: 30, presents: 29, admis: 28, ajourne: 1, tauxReussite: 96.6, datePV: '2025-07-15', dateReception: '2025-07-16', president: 'Dr. EKOMY Paul', rapporteur: 'Pr. MINTSA Claire', statut: 'vu', envoyePar: 'Direction des Études Pédagogiques' }
          }
        },
        'L2': {
          'avant': {
            'S1': { effectif: 26, presents: 25, admis: 22, ajourne: 3, tauxReussite: 88.0, datePV: '2025-01-20', dateReception: '2025-01-22', president: 'Pr. ONANGA Marc', rapporteur: 'Dr. BITEGUE Anne', statut: 'vu', envoyePar: 'Direction des Études Pédagogiques' },
            'S2': { effectif: 26, presents: 26, admis: 23, ajourne: 3, tauxReussite: 88.5, datePV: '2025-06-20', dateReception: '2025-06-22', president: 'Pr. ONANGA Marc', rapporteur: 'Dr. BITEGUE Anne', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' },
            'annuel': { effectif: 26, presents: 25, admis: 21, ajourne: 4, tauxReussite: 84.0, datePV: '2025-06-25', dateReception: '2025-06-27', president: 'Pr. ONANGA Marc', rapporteur: 'Dr. BITEGUE Anne', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' }
          },
          'apres': {
            'S1': { effectif: 26, presents: 25, admis: 24, ajourne: 1, tauxReussite: 96.0, datePV: '2025-02-15', dateReception: '2025-02-16', president: 'Pr. ONANGA Marc', rapporteur: 'Dr. BITEGUE Anne', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' },
            'S2': { effectif: 26, presents: 26, admis: 25, ajourne: 1, tauxReussite: 96.2, datePV: '2025-07-10', dateReception: '2025-07-11', president: 'Pr. ONANGA Marc', rapporteur: 'Dr. BITEGUE Anne', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' },
            'annuel': { effectif: 26, presents: 25, admis: 24, ajourne: 1, tauxReussite: 96.0, datePV: '2025-07-15', dateReception: '2025-07-16', president: 'Pr. ONANGA Marc', rapporteur: 'Dr. BITEGUE Anne', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' }
          }
        },
        'L3': {
          'avant': {
            'S1': { effectif: 24, presents: 24, admis: 21, ajourne: 3, tauxReussite: 87.5, datePV: '2025-01-20', dateReception: '2025-01-22', president: 'Dr. OMBILA Luc', rapporteur: 'Pr. KOUMBA Rose', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' },
            'S2': { effectif: 24, presents: 23, admis: 20, ajourne: 3, tauxReussite: 87.0, datePV: '2025-06-20', dateReception: '2025-06-22', president: 'Dr. OMBILA Luc', rapporteur: 'Pr. KOUMBA Rose', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' },
            'annuel': { effectif: 24, presents: 24, admis: 19, ajourne: 5, tauxReussite: 79.2, datePV: '2025-06-25', dateReception: '2025-06-27', president: 'Dr. OMBILA Luc', rapporteur: 'Pr. KOUMBA Rose', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' }
          },
          'apres': {
            'S1': { effectif: 24, presents: 24, admis: 23, ajourne: 1, tauxReussite: 95.8, datePV: '2025-02-15', dateReception: '2025-02-16', president: 'Dr. OMBILA Luc', rapporteur: 'Pr. KOUMBA Rose', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' },
            'S2': { effectif: 24, presents: 23, admis: 22, ajourne: 1, tauxReussite: 95.7, datePV: '2025-07-10', dateReception: '2025-07-11', president: 'Dr. OMBILA Luc', rapporteur: 'Pr. KOUMBA Rose', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' },
            'annuel': { effectif: 24, presents: 24, admis: 23, ajourne: 1, tauxReussite: 95.8, datePV: '2025-07-15', dateReception: '2025-07-16', president: 'Dr. OMBILA Luc', rapporteur: 'Pr. KOUMBA Rose', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' }
          }
        }
      },
      'AV': {
        'L1': {
          'avant': {
            'S1': { effectif: 28, presents: 27, admis: 23, ajourne: 4, tauxReussite: 85.2, datePV: '2025-01-20', dateReception: '2025-01-22', president: 'Pr. EYENE Louis', rapporteur: 'Dr. MAKAYA Sophie', statut: 'nouveau', envoyePar: 'Direction des Études Pédagogiques' },
            'S2': { effectif: 28, presents: 28, admis: 24, ajourne: 4, tauxReussite: 85.7, datePV: '2025-06-20', dateReception: '2025-06-22', president: 'Pr. EYENE Louis', rapporteur: 'Dr. MAKAYA Sophie', statut: 'nouveau', envoyePar: 'Direction des Études Pédagogiques' },
            'annuel': { effectif: 28, presents: 27, admis: 22, ajourne: 5, tauxReussite: 81.5, datePV: '2025-06-25', dateReception: '2025-06-27', president: 'Pr. EYENE Louis', rapporteur: 'Dr. MAKAYA Sophie', statut: 'nouveau', envoyePar: 'Direction des Études Pédagogiques' }
          },
          'apres': {
            'S1': { effectif: 28, presents: 27, admis: 26, ajourne: 1, tauxReussite: 96.3, datePV: '2025-02-15', dateReception: '2025-02-16', president: 'Pr. EYENE Louis', rapporteur: 'Dr. MAKAYA Sophie', statut: 'vu', envoyePar: 'Direction des Études Pédagogiques' },
            'S2': { effectif: 28, presents: 28, admis: 27, ajourne: 1, tauxReussite: 96.4, datePV: '2025-07-10', dateReception: '2025-07-11', president: 'Pr. EYENE Louis', rapporteur: 'Dr. MAKAYA Sophie', statut: 'vu', envoyePar: 'Direction des Études Pédagogiques' },
            'annuel': { effectif: 28, presents: 27, admis: 26, ajourne: 1, tauxReussite: 96.3, datePV: '2025-07-15', dateReception: '2025-07-16', president: 'Pr. EYENE Louis', rapporteur: 'Dr. MAKAYA Sophie', statut: 'vu', envoyePar: 'Direction des Études Pédagogiques' }
          }
        },
        'L2': {
          'avant': {
            'S1': { effectif: 25, presents: 24, admis: 21, ajourne: 3, tauxReussite: 87.5, datePV: '2025-01-20', dateReception: '2025-01-22', president: 'Dr. MABIKA Pierre', rapporteur: 'Pr. OKENVE Julie', statut: 'vu', envoyePar: 'Direction des Études Pédagogiques' },
            'S2': { effectif: 25, presents: 25, admis: 22, ajourne: 3, tauxReussite: 88.0, datePV: '2025-06-20', dateReception: '2025-06-22', president: 'Dr. MABIKA Pierre', rapporteur: 'Pr. OKENVE Julie', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' },
            'annuel': { effectif: 25, presents: 24, admis: 20, ajourne: 4, tauxReussite: 83.3, datePV: '2025-06-25', dateReception: '2025-06-27', president: 'Dr. MABIKA Pierre', rapporteur: 'Pr. OKENVE Julie', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' }
          },
          'apres': {
            'S1': { effectif: 25, presents: 24, admis: 23, ajourne: 1, tauxReussite: 95.8, datePV: '2025-02-15', dateReception: '2025-02-16', president: 'Dr. MABIKA Pierre', rapporteur: 'Pr. OKENVE Julie', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' },
            'S2': { effectif: 25, presents: 25, admis: 24, ajourne: 1, tauxReussite: 96.0, datePV: '2025-07-10', dateReception: '2025-07-11', president: 'Dr. MABIKA Pierre', rapporteur: 'Pr. OKENVE Julie', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' },
            'annuel': { effectif: 25, presents: 24, admis: 23, ajourne: 1, tauxReussite: 95.8, datePV: '2025-07-15', dateReception: '2025-07-16', president: 'Dr. MABIKA Pierre', rapporteur: 'Pr. OKENVE Julie', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' }
          }
        },
        'L3': {
          'avant': {
            'S1': { effectif: 22, presents: 22, admis: 19, ajourne: 3, tauxReussite: 86.4, datePV: '2025-01-20', dateReception: '2025-01-22', president: 'Pr. ABOGHE François', rapporteur: 'Dr. NZAMBA Elise', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' },
            'S2': { effectif: 22, presents: 21, admis: 18, ajourne: 3, tauxReussite: 85.7, datePV: '2025-06-20', dateReception: '2025-06-22', president: 'Pr. ABOGHE François', rapporteur: 'Dr. NZAMBA Elise', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' },
            'annuel': { effectif: 22, presents: 22, admis: 17, ajourne: 5, tauxReussite: 77.3, datePV: '2025-06-25', dateReception: '2025-06-27', president: 'Pr. ABOGHE François', rapporteur: 'Dr. NZAMBA Elise', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' }
          },
          'apres': {
            'S1': { effectif: 22, presents: 22, admis: 21, ajourne: 1, tauxReussite: 95.5, datePV: '2025-02-15', dateReception: '2025-02-16', president: 'Pr. ABOGHE François', rapporteur: 'Dr. NZAMBA Elise', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' },
            'S2': { effectif: 22, presents: 21, admis: 20, ajourne: 1, tauxReussite: 95.2, datePV: '2025-07-10', dateReception: '2025-07-11', president: 'Pr. ABOGHE François', rapporteur: 'Dr. NZAMBA Elise', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' },
            'annuel': { effectif: 22, presents: 22, admis: 21, ajourne: 1, tauxReussite: 95.5, datePV: '2025-07-15', dateReception: '2025-07-16', president: 'Pr. ABOGHE François', rapporteur: 'Dr. NZAMBA Elise', statut: 'archivé', envoyePar: 'Direction des Études Pédagogiques' }
          }
        }
      }
    }
  }

  const handleBack = () => {
    if (selectedTypePV) setSelectedTypePV('')
    else if (selectedTypeRattrapage) setSelectedTypeRattrapage('')
    else if (selectedClasse) setSelectedClasse('')
    else if (selectedNiveau) setSelectedNiveau('')
    else if (selectedFiliere) setSelectedFiliere('')
    else if (selectedPromotion) setSelectedPromotion('')
  }

  const handleGeneratePDF = () => {
    alert('Génération du PDF en cours...')
  }

  const handleArchivePV = () => {
    setShowArchiveConfirm(false)
    setPvArchived(true)
    setTimeout(() => {
      alert(`PV archivé avec succès!\n\nLe PV de la classe ${selectedClasse} (${selectedTypeRattrapage === 'avant' ? 'Avant' : 'Après'} rattrapages - ${selectedTypePV === 'S1' ? 'Semestre 1' : selectedTypePV === 'S2' ? 'Semestre 2' : 'Annuel'}) a été transféré vers la section Archivage de la promotion ${selectedPromotion}.`)
    }, 100)
  }

  // Compter les nouveaux PV
  const countNouveauxPV = () => {
    let count = 0
    Object.values(pvData).forEach(promotion => {
      Object.values(promotion).forEach(filiere => {
        Object.values(filiere).forEach(niveau => {
          Object.values(niveau).forEach(rattrapage => {
            Object.values(rattrapage).forEach(pv => {
              if (pv && pv.statut === 'nouveau') count++
            })
          })
        })
      })
    })
    return count
  }

  const nouveauxPV = countNouveauxPV()

  // Vue 1: Choix de la promotion
  if (!selectedPromotion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
            {/* Notification des nouveaux PV */}
            {nouveauxPV > 0 && (
              <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4 shadow-md animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faFileAlt} className="text-2xl text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-red-800 text-lg">
                      🆕 {nouveauxPV} Nouveau{nouveauxPV > 1 ? 'x' : ''} PV disponible{nouveauxPV > 1 ? 's' : ''}
                    </h3>
                    <p className="text-red-700 text-sm">
                      La Direction des Études Pédagogiques a envoyé de nouveaux procès-verbaux. Consultez-les et archivez-les.
                    </p>
                  </div>
                  <div className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-xl">
                    {nouveauxPV}
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <FontAwesomeIcon icon={faFileAlt} className="text-indigo-600" />
                Procès-Verbaux
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez une promotion pour consulter les PV
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez une promotion</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {promotions.map((promo) => (
                  <button key={promo.id} onClick={() => setSelectedPromotion(promo.id)}
                    className={`p-6 border-2 rounded-xl hover:shadow-lg transition-all duration-200 group ${
                      promo.statut === 'en_cours' 
                        ? 'border-green-300 bg-green-50 hover:border-green-500' 
                        : 'border-slate-200 hover:border-indigo-500 hover:bg-indigo-50'
                    }`}>
                    <div className="text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        promo.statut === 'en_cours' 
                          ? 'bg-green-100 group-hover:bg-green-200' 
                          : 'bg-indigo-100 group-hover:bg-indigo-200'
                      }`}>
                        <FontAwesomeIcon icon={faCalendar} className={`text-3xl ${
                          promo.statut === 'en_cours' ? 'text-green-600' : 'text-indigo-600'
                        }`} />
                      </div>
                      <div className={`text-2xl font-bold mb-2 ${
                        promo.statut === 'en_cours' 
                          ? 'text-green-800 group-hover:text-green-600' 
                          : 'text-slate-800 group-hover:text-indigo-600'
                      }`}>
                        {promo.nom}
                      </div>
                      <div className="space-y-1 mb-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          promo.statut === 'en_cours' 
                            ? 'bg-green-200 text-green-800' 
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {promo.statut === 'en_cours' ? '✓ En cours' : '📦 Archivé'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">
                        {promo.nbPV} PV disponibles
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 2: Choix de la filière
  if (!selectedFiliere) {
    const promo = promotions.find(p => p.id === selectedPromotion)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                PV - Promotion {promo?.nom}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez une filière
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez la filière</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {filieres.map((filiere) => (
                  <button key={filiere.id} onClick={() => setSelectedFiliere(filiere.id)}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 group">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200">
                        <FontAwesomeIcon icon={faGraduationCap} className="text-3xl text-indigo-600" />
                      </div>
                      <div className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 mb-2">{filiere.id}</div>
                      <div className="text-sm text-slate-600">{filiere.nom}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 3: Choix du niveau
  if (!selectedNiveau) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                PV - {selectedFiliere} • Promotion {selectedPromotion}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez le niveau
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez le niveau</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {niveaux.map((niveau) => (
                  <button key={niveau} onClick={() => setSelectedNiveau(niveau)}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 group">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-slate-800 group-hover:text-indigo-600 mb-2">{niveau}</div>
                      <div className="text-sm text-slate-600">
                        {niveau === 'L1' ? 'Première année' : niveau === 'L2' ? 'Deuxième année' : 'Troisième année'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 4: Choix de la classe
  if (selectedNiveau && !selectedClasse) {
    const classes = getClasses(selectedFiliere, selectedNiveau)
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                PV - {selectedFiliere} {selectedNiveau} • Promotion {selectedPromotion}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez la classe
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Choisissez la classe</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {classes.map((classe) => (
                  <button key={classe.id} onClick={() => setSelectedClasse(classe.id)}
                    className="p-6 border-2 border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 group">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200">
                        <FontAwesomeIcon icon={faGraduationCap} className="text-3xl text-indigo-600" />
                      </div>
                      <div className="text-2xl font-bold text-slate-800 group-hover:text-indigo-600 mb-2">{classe.nom}</div>
                      <div className="text-sm text-slate-600 mb-2">
                        Effectif: {classe.effectif} étudiants
                      </div>
                      <div className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full inline-block">
                        5 PV disponibles
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 5: Choix avant/après rattrapages
  if (!selectedTypeRattrapage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                PV - Classe {selectedClasse}
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Choisissez le type de résultats
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <button onClick={() => setSelectedTypeRattrapage('avant')}
                className="bg-white p-8 border-2 border-slate-200 rounded-xl hover:border-orange-500 hover:shadow-lg transition-all duration-200 group">
                <div className="text-center">
                  <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200">
                    <FontAwesomeIcon icon={faHourglassHalf} className="text-5xl text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 group-hover:text-orange-600 mb-2">Avant Rattrapages</h3>
                  <p className="text-slate-600">Résultats avant session de rattrapage</p>
                </div>
              </button>

              <button onClick={() => setSelectedTypeRattrapage('apres')}
                className="bg-white p-8 border-2 border-slate-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all duration-200 group">
                <div className="text-center">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-5xl text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 group-hover:text-green-600 mb-2">Après Rattrapages</h3>
                  <p className="text-slate-600">Résultats après session de rattrapage</p>
                </div>
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 6: Liste des PV (S1, S2, Annuel)
  if (!selectedTypePV) {
    // Les données PV sont les mêmes pour toutes les classes d'un niveau
    // On utilise les données de base et on ajuste l'effectif selon la classe
    const pvDisponibles = pvData[selectedPromotion]?.[selectedFiliere]?.[selectedNiveau]?.[selectedTypeRattrapage] || {}
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
        <Sidebar />
        <div className="flex flex-col lg:ml-64 min-h-screen">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
            <div className="mb-6">
              <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
              </button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
                PV - Classe {selectedClasse} • {selectedTypeRattrapage === 'avant' ? 'Avant' : 'Après'} Rattrapages
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Sélectionnez le PV à consulter
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">PV disponibles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {['S1', 'S2', 'annuel'].map((typePV) => {
                  const pv = pvDisponibles[typePV]
                  const isDisponible = pv !== null && pv !== undefined
                  
                  return (
                    <button
                      key={typePV}
                      onClick={() => isDisponible && setSelectedTypePV(typePV)}
                      disabled={!isDisponible}
                      className={`p-8 border-2 rounded-xl transition-all duration-200 group ${
                        isDisponible 
                          ? 'border-slate-200 hover:border-indigo-500 hover:shadow-lg cursor-pointer' 
                          : 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-50'
                      }`}>
                      <div className="text-center">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                          isDisponible ? 'bg-indigo-100 group-hover:bg-indigo-200' : 'bg-slate-200'
                        }`}>
                          <FontAwesomeIcon icon={faFileAlt} className={`text-4xl ${
                            isDisponible ? 'text-indigo-600' : 'text-slate-400'
                          }`} />
                        </div>
                        <h3 className={`text-2xl font-bold mb-2 ${
                          isDisponible ? 'text-slate-800 group-hover:text-indigo-600' : 'text-slate-400'
                        }`}>
                          {typePV === 'S1' ? 'Semestre 1' : typePV === 'S2' ? 'Semestre 2' : 'Annuel'}
                        </h3>
                        {isDisponible && pv.statut && (
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            pv.statut === 'nouveau' ? 'bg-red-100 text-red-700' :
                            pv.statut === 'vu' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {pv.statut === 'nouveau' ? '🆕 Nouveau' :
                             pv.statut === 'vu' ? '👁️ Vu' :
                             '📦 Archivé'}
                          </span>
                        )}
                        {!isDisponible && (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-600">
                            Non disponible
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Vue 7: Affichage du PV
  const pvInfo = pvData[selectedPromotion]?.[selectedFiliere]?.[selectedNiveau]?.[selectedTypeRattrapage]?.[selectedTypePV]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
      <Sidebar />
      <div className="flex flex-col lg:ml-64 min-h-screen">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-24">
          <div className="mb-6">
            <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />Retour
            </button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              Procès-Verbal - Classe {selectedClasse}
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              {selectedTypePV === 'S1' ? 'Semestre 1' : selectedTypePV === 'S2' ? 'Semestre 2' : 'Annuel'} • {selectedTypeRattrapage === 'avant' ? 'Avant' : 'Après'} rattrapages • Promotion {selectedPromotion}
            </p>
          </div>

          {!pvInfo ? (
            <div className="bg-white rounded-xl shadow-md p-12 border border-slate-200 text-center">
              <FontAwesomeIcon icon={faFileAlt} className="text-6xl text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg mb-2">Aucun PV disponible</p>
              <p className="text-slate-400 text-sm">Ce procès-verbal n'a pas encore été généré pour cette classe.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-200 overflow-hidden">
              {/* Badge de statut */}
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1 rounded-full text-xs font-bold ${
                    pvArchived || pvInfo.statut === 'archive' ? 'bg-slate-200 text-slate-700' :
                    pvInfo.statut === 'nouveau' ? 'bg-red-100 text-red-700 animate-pulse' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {pvArchived || pvInfo.statut === 'archive' ? '📦 Archivé' :
                     pvInfo.statut === 'nouveau' ? '🆕 Nouveau' : '👁️ Vu'}
                  </span>
                  <span className="text-sm text-slate-600">
                    Reçu le: <span className="font-semibold text-slate-800">{pvInfo.dateReception}</span>
                  </span>
                </div>
                <span className="text-xs text-slate-500">Envoyé par: {pvInfo.envoyePar}</span>
              </div>

              {/* En-tête du PV */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">PROCÈS-VERBAL DES DÉLIBÉRATIONS</h2>
                  <p className="text-indigo-100">
                    {selectedTypePV === 'S1' ? 'Semestre 1' : selectedTypePV === 'S2' ? 'Semestre 2' : 'Résultats Annuels'} - 
                    {selectedTypeRattrapage === 'avant' ? ' Session Normale' : ' Après Rattrapages'}
                  </p>
                </div>
              </div>

              {/* Informations générales */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <FontAwesomeIcon icon={faGraduationCap} className="text-indigo-600" />
                      Informations de la classe
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Promotion:</span>
                        <span className="font-semibold text-slate-800">{selectedPromotion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Classe:</span>
                        <span className="font-semibold text-slate-800">{selectedClasse}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Filière:</span>
                        <span className="font-semibold text-slate-800">{filieres.find(f => f.id === selectedFiliere)?.nom}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Période:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedTypePV === 'S1' ? 'Semestre 1' : selectedTypePV === 'S2' ? 'Semestre 2' : 'Année complète'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <FontAwesomeIcon icon={faCalendar} className="text-indigo-600" />
                      Délibération
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Date du PV:</span>
                        <span className="font-semibold text-slate-800">{pvInfo.datePV}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Président:</span>
                        <span className="font-semibold text-slate-800">{pvInfo.president}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Rapporteur:</span>
                        <span className="font-semibold text-slate-800">{pvInfo.rapporteur}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistiques */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Statistiques des résultats</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                      <div className="text-3xl font-bold text-blue-600 mb-1">{pvInfo.effectif}</div>
                      <div className="text-xs text-slate-600">Effectif total</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                      <div className="text-3xl font-bold text-indigo-600 mb-1">{pvInfo.presents}</div>
                      <div className="text-xs text-slate-600">Présents</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                      <div className="text-3xl font-bold text-green-600 mb-1">{pvInfo.admis}</div>
                      <div className="text-xs text-slate-600">Admis</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                      <div className="text-3xl font-bold text-red-600 mb-1">{pvInfo.ajourne}</div>
                      <div className="text-xs text-slate-600">Ajournés</div>
                    </div>
                  </div>
                  <div className="mt-4 bg-white rounded-lg p-4 text-center shadow-sm">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-slate-600">Taux de réussite:</span>
                      <span className="text-3xl font-bold text-green-600">{pvInfo.tauxReussite}%</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={handleGeneratePDF}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors">
                      <FontAwesomeIcon icon={faDownload} />
                      Télécharger le PV (PDF)
                    </button>
                    <button
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors">
                      <FontAwesomeIcon icon={faEye} />
                      Voir les détails
                    </button>
                  </div>
                  
                  {/* Bouton Archiver */}
                  {!pvArchived && pvInfo.statut !== 'archive' && (
                    <button onClick={() => setShowArchiveConfirm(true)}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors">
                      <FontAwesomeIcon icon={faArchive} />
                      Archiver ce PV
                    </button>
                  )}

                  {/* Message d'archivage réussi */}
                  {pvArchived && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-2xl mb-2" />
                      <p className="text-green-800 font-semibold">PV archivé avec succès !</p>
                      <p className="text-green-600 text-sm mt-1">Ce PV est maintenant disponible dans la section Archivage.</p>
                    </div>
                  )}

                  {/* Message si déjà archivé */}
                  {!pvArchived && pvInfo.statut === 'archive' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                      <FontAwesomeIcon icon={faArchive} className="text-slate-600 text-2xl mb-2" />
                      <p className="text-slate-700 font-semibold">PV déjà archivé</p>
                      <p className="text-slate-600 text-sm mt-1">Consultez la section Archivage pour retrouver ce PV.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal de confirmation d'archivage */}
          {showArchiveConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon icon={faArchive} className="text-3xl text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Archiver ce PV ?</h3>
                  <p className="text-slate-600 text-sm">
                    Ce procès-verbal sera transféré vers la section Archivage et classé dans la promotion {selectedPromotion}.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 mb-6 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Classe:</span>
                      <span className="font-semibold text-slate-800">{selectedClasse}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Type:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedTypePV === 'S1' ? 'Semestre 1' : selectedTypePV === 'S2' ? 'Semestre 2' : 'Annuel'} - {selectedTypeRattrapage === 'avant' ? 'Avant' : 'Après'} rattrapages
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowArchiveConfirm(false)}
                    className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors">
                    Annuler
                  </button>
                  <button onClick={handleArchivePV}
                    className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors">
                    Confirmer l'archivage
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default ProcesVerbauxView

