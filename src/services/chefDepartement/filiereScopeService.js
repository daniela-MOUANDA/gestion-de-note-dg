import { supabaseAdmin } from '../../lib/supabase.js'

const MTIC_COMPAT_CODES = [
  'MTIC',
  'TC',
  'MMI',
  'MMI-WM',
  'MMI-ED',
  'MMI-Web-Mastering',
  'MMI-Ecommerce-Digital',
  'MTIC-TC',
  'MTIC-EMCD'
]

export const getScopedFilieresForDepartement = async (departementId) => {
  const { data: baseFilieres, error } = await supabaseAdmin
    .from('filieres')
    .select('*, departements(code)')
    .eq('departement_id', departementId)
    .order('code', { ascending: true })

  if (error) throw error

  let filieres = Array.isArray(baseFilieres) ? [...baseFilieres] : []
  let depCode = filieres[0]?.departements?.code

  if (!depCode) {
    const { data: dep } = await supabaseAdmin
      .from('departements')
      .select('code')
      .eq('id', departementId)
      .maybeSingle()
    depCode = dep?.code
  }

  if (depCode === 'MTIC') {
    const { data: legacy } = await supabaseAdmin
      .from('filieres')
      .select('*, departements(code)')
      .in('code', MTIC_COMPAT_CODES)
      .order('code', { ascending: true })

    if (Array.isArray(legacy) && legacy.length > 0) {
      const byId = new Map()
      for (const f of filieres) byId.set(f.id, f)
      for (const f of legacy) byId.set(f.id, f)
      filieres = Array.from(byId.values())
    }
  }

  return filieres
}

export const getScopedFiliereIdsForDepartement = async (departementId) => {
  const filieres = await getScopedFilieresForDepartement(departementId)
  return filieres
    .filter((f) => f.type_filiere !== 'groupe')
    .map((f) => f.id)
}

export const isFiliereInDepartementScope = async (departementId, filiereId) => {
  const ids = await getScopedFiliereIdsForDepartement(departementId)
  return ids.includes(filiereId)
}
