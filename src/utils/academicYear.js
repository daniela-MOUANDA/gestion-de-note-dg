/**
 * Année académique « en cours » au sens du calendrier (ex. en mars 2026 → 2025-2026).
 *
 * Règle : rentrée en septembre. Septembre–décembre de l’année Y → année scolaire Y-(Y+1) ;
 * janvier–août → année (Y-1)-Y.
 *
 * À ne pas confondre avec la promotion choisie pour une cohorte à l’inscription : celle-ci
 * reste un choix explicite en base : ici on ne fait que dériver l’étiquette d’année depuis la date du jour.
 */

export function normalizeAcademicYearLabel (value) {
  if (value == null || value === '') return ''
  return String(value).trim().replace(/\s+/g, '').replace(/\//g, '-')
}

export function getCurrentAcademicYearLabel (referenceDate = new Date()) {
  const y = referenceDate.getFullYear()
  const m = referenceDate.getMonth()
  if (m >= 8) {
    return `${y}-${y + 1}`
  }
  return `${y - 1}-${y}`
}

/**
 * Choisit la promotion à considérer comme « année en cours » dans une liste déjà chargée.
 * 1) Ligne dont promotions.annee correspond à l’année dérivée du calendrier (après normalisation).
 * 2) Sinon première avec statut EN_COURS.
 * 3) Sinon la promotion la plus récente par libellé d’année.
 */
export function pickPromotionForCurrentAcademicYear (promotions) {
  if (!promotions?.length) return null
  const label = normalizeAcademicYearLabel(getCurrentAcademicYearLabel())

  const byYear = promotions.find(
    (p) => normalizeAcademicYearLabel(p.annee) === label
  )
  if (byYear) return byYear

  const byStatut = promotions.find((p) => p.statut === 'EN_COURS')
  if (byStatut) return byStatut

  return [...promotions].sort((a, b) =>
    normalizeAcademicYearLabel(b.annee).localeCompare(
      normalizeAcademicYearLabel(a.annee),
      undefined,
      { numeric: true }
    )
  )[0]
}

/**
 * Même logique que pickPromotionForCurrentAcademicYear, mais lecture en base.
 */
export async function fetchPromotionForCurrentAcademicYear (supabaseAdmin) {
  const { data: all, error } = await supabaseAdmin
    .from('promotions')
    .select('id, annee, statut')
    .order('annee', { ascending: false })

  if (error) throw error
  return pickPromotionForCurrentAcademicYear(all || [])
}
