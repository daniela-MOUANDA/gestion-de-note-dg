import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEnvelope,
  faLock,
  faArrowRight,
  faSpinner,
  faEye,
  faEyeSlash,
  faCircleExclamation
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../contexts/AuthContext'
import { useAlert } from '../contexts/AlertContext'
import Modal from '../components/common/Modal'

/** Illustration : unDraw « Remotely ». */
const UNDRAW_ILLUSTRATION = '/illustrations/undraw-remotely.svg'

const LoginView = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { success, error: showError } = useAlert()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    document.title = 'E-Notes — Connexion'
  }, [])

  const redirectByRole = (user) => {
    console.log('Redirection pour l\'utilisateur:', user)

    const roleCode = user.role || 'UNKNOWN'
    console.log('Redirection par code de rôle:', roleCode)

    const criticalRoles = ['CHEF_DEPARTEMENT', 'COORD_PEDAGOGIQUE', 'CHEF_SERVICE_SCOLARITE', 'DEP', 'SP_SCOLARITE', 'DIRECTEUR_SCOLARITE', 'ADMIN_SYSTEME']
    const useRouteDashboard = !criticalRoles.includes(roleCode) && user.roleDetails && user.roleDetails.routeDashboard

    if (useRouteDashboard) {
      console.log('✅ Redirection vers:', user.roleDetails.routeDashboard)
      navigate(user.roleDetails.routeDashboard, { replace: true })
      return
    }

    switch (roleCode) {
      case 'ETUDIANT':
        navigate('/dashboard', { replace: true })
        break
      case 'CHEF_SERVICE_SCOLARITE':
        console.log('✅ Redirection vers /chef-scolarite/dashboard pour CHEF_SERVICE_SCOLARITE')
        navigate('/chef-scolarite/dashboard', { replace: true })
        break
      case 'AGENT_SCOLARITE':
        navigate('/scolarite/dashboard', { replace: true })
        break
      case 'SP_SCOLARITE':
        console.log('✅ Redirection vers /sp-scolarite/dashboard pour SP_SCOLARITE')
        navigate('/sp-scolarite/dashboard', { replace: true })
        break
      case 'CHEF_DEPARTEMENT':
      case 'COORD_PEDAGOGIQUE':
        console.log('✅ Redirection espace département (chef ou coordinateur)')
        navigate('/chef/departement/dashboard', { replace: true })
        break
      case 'DEP':
        console.log('✅ Redirection vers /dep/dashboard pour DEP')
        navigate('/dep/dashboard', { replace: true })
        break
      case 'ADMIN_SYSTEME':
        console.log('✅ Redirection vers /admin-systeme/dashboard pour ADMIN_SYSTEME')
        navigate('/admin-systeme/dashboard', { replace: true })
        break
      case 'DIRECTEUR_SCOLARITE':
        console.log('✅ Redirection vers /directeur-scolarite/dashboard pour DIRECTEUR_SCOLARITE')
        navigate('/directeur-scolarite/dashboard', { replace: true })
        break
      default:
        console.warn('⚠️ Rôle non reconnu:', roleCode)
        if (user.roleDetails && user.roleDetails.routeDashboard) {
          navigate(user.roleDetails.routeDashboard, { replace: true })
        } else {
          navigate('/login', { replace: true })
        }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await login(email, password)
      console.log('Résultat de la connexion:', result)

      if (result.success && result.user) {
        console.log('Utilisateur connecté:', result.user)
        console.log('Rôle de l\'utilisateur:', result.user.role)

        const userName = `${result.user.nom} ${result.user.prenom}`
        setSuccessMessage(`Bienvenue ${userName} ! Connexion réussie.`)
        setShowSuccessModal(true)
        success(`Connexion réussie ! Bienvenue ${userName}`)

        setTimeout(() => {
          setShowSuccessModal(false)
          redirectByRole(result.user)
        }, 1500)
      } else {
        const errorMsg = result.error || 'Erreur lors de la connexion'
        setError(errorMsg)
        setShowErrorModal(true)
        showError(errorMsg)
        setIsLoading(false)
      }
    } catch (err) {
      console.error('Erreur lors de la connexion:', err)
      const errorMsg = err.message || 'Une erreur est survenue'
      setError(errorMsg)
      setShowErrorModal(true)
      showError(errorMsg)
      setIsLoading(false)
    }
  }

  const inputLineClass =
    'w-full border-0 border-b-2 border-slate-200 bg-transparent py-2.5 pl-9 pr-2 text-[15px] text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-b-[#0f2744] focus:ring-0'

  return (
    <div
      className="flex min-h-[100dvh] flex-col antialiased lg:flex-row"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Gauche — bleu marine (charte d’origine), illustration unDraw */}
      <aside className="relative order-1 flex min-h-[220px] flex-[0_0_auto] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f2744] to-[#061018] px-6 py-8 lg:order-none lg:min-h-[100dvh] lg:w-[48%] lg:max-w-none lg:flex-[0_0_48%] lg:px-12 lg:py-16">
        <div
          className="pointer-events-none absolute -left-[20%] top-1/2 h-[140%] w-[85%] -translate-y-1/2 rounded-[45%] bg-white/[0.07] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 right-[-10%] h-[70%] w-[75%] rounded-[50%] bg-sky-400/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-8 top-12 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl"
          aria-hidden
        />

        <div className="relative z-[1] flex w-full max-w-lg flex-col items-center">
          <img
            src={UNDRAW_ILLUSTRATION}
            alt=""
            className="h-auto w-full max-w-[min(100%,420px)] drop-shadow-[0_12px_40px_rgba(0,0,0,0.2)]"
            width={882}
            height={779}
            decoding="async"
          />
          <p className="mt-6 max-w-sm text-center text-[14px] font-medium leading-relaxed text-white/90 lg:text-[15px]">
            Bienvenue sur le portail de connexion E-Notes.
          </p>
        </div>
      </aside>

      {/* Droite — formulaire remonté (aligné haut, marges resserrées) */}
      <main className="relative order-2 flex flex-1 flex-col justify-start bg-white px-6 pb-6 pt-4 sm:px-10 lg:min-h-[100dvh] lg:px-16 lg:pb-8 lg:pt-6">
        <div className="mx-auto w-full max-w-[460px]">
          <div className="mt-20 flex justify-center leading-none sm:mt-24 lg:mt-28">
            <img
              src="/images/logo-connexion.png"
              alt="E-Notes"
              className="h-auto w-full max-w-[min(100%,320px)] object-contain sm:max-w-[min(100%,380px)] lg:max-w-[min(100%,420px)]"
              width={420}
              height={195}
            />
          </div>

          <header className="mt-2 text-center">
            <h1 className="text-[1.4rem] font-semibold tracking-tight text-slate-800 sm:text-[1.55rem]">
              Connexion
            </h1>
            <p className="mx-auto mt-1 max-w-sm text-[13px] leading-snug text-slate-500 sm:text-[14px]">
              Saisissez votre e-mail et votre mot de passe pour vous connecter.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="mt-4 space-y-5">
            <div>
              <label htmlFor="email" className="mb-1 block text-left text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                Adresse e-mail
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute bottom-2.5 left-0 text-slate-400">
                  <FontAwesomeIcon icon={faEnvelope} className="text-[15px]" />
                </span>
                <input
                  type="email"
                  id="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@etablissement.fr"
                  required
                  className={inputLineClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-left text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                Mot de passe
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute bottom-2.5 left-0 text-slate-400">
                  <FontAwesomeIcon icon={faLock} className="text-[15px]" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`${inputLineClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute bottom-2.5 right-0 p-1 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus-visible:text-[#0f2744]"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex gap-2.5 rounded-xl border border-red-100 bg-red-50/90 px-3 py-2.5 text-left text-[13px] leading-snug text-red-800"
              >
                <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group flex h-[52px] w-full overflow-hidden rounded-full shadow-lg shadow-slate-300/50 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex w-[52px] shrink-0 items-center justify-center bg-[#166534] text-white transition group-hover:bg-[#14532d]">
                {isLoading ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-lg" />
                ) : (
                  <FontAwesomeIcon icon={faArrowRight} className="text-lg" />
                )}
              </span>
              <span className="flex flex-1 items-center justify-center bg-[#0f2744] text-[14px] font-bold uppercase tracking-[0.12em] text-white transition group-hover:bg-[#0c2038]">
                {isLoading ? 'Connexion…' : 'Se connecter'}
              </span>
            </button>
          </form>

          <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400 sm:text-[12px]">
            © {new Date().getFullYear()} E-Notes — Tous droits réservés — by MMD
          </p>
        </div>
      </main>

      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        type="success"
        title="Connexion réussie"
        message={successMessage}
      />

      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        type="error"
        title="Connexion impossible"
        message={error}
      />
    </div>
  )
}

export default LoginView
