import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { supabaseAdmin } from '../src/lib/supabase.js'
import { getClassesForConseil } from '../src/services/chefDepartement/conseilService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })
dotenv.config({ path: path.join(__dirname, '..', 'server', '.env') })

const { data: deps } = await supabaseAdmin.from('departements').select('id, code')
const dep = (deps || []).find((d) => d.code === 'MTIC') || deps?.[0]
const { data: promo } = await supabaseAdmin
  .from('promotions')
  .select('id, annee')
  .eq('annee', '2024-2025')
  .maybeSingle()
const { data: fo } = await supabaseAdmin.from('formations').select('id, code').eq('code', 'INITIAL_2').single()
const { data: nv } = await supabaseAdmin.from('niveaux').select('id, code').eq('code', 'L2').single()
const { data: fi } = await supabaseAdmin.from('filieres').select('id, code').eq('code', 'MMI').maybeSingle()

console.log({ dep: dep?.code, promo, fo, nv, fi })

if (dep && promo && fo && nv && fi) {
  const r = await getClassesForConseil(dep.id, {
    promotionId: promo.id,
    promotionAnnee: '2024-2025',
    formationId: fo.id,
    formationCode: 'INITIAL_2',
    filiereId: fi.id,
    niveauId: nv.id,
    niveauCode: 'L2'
  })
  console.log('classes found:', r.classes?.length, r.classes?.map((c) => c.code))
}
