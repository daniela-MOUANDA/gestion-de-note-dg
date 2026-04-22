import jwt from 'jsonwebtoken'

function getSecret() {
  return process.env.BULLETIN_VERIFY_SECRET || process.env.JWT_SECRET || 'dev-bulletin-verify-change-me'
}

/**
 * @param {string} bulletinId - UUID du bulletin
 */
export function signBulletinVerificationToken(bulletinId) {
  if (!bulletinId) return null
  return jwt.sign({ bid: bulletinId }, getSecret(), { expiresIn: '3650d' })
}

export function verifyBulletinVerificationToken(token) {
  if (!token || typeof token !== 'string') return null
  try {
    return jwt.verify(token, getSecret())
  } catch {
    return null
  }
}

/**
 * URL absolue encodée dans le QR (application front).
 */
export function buildBulletinVerificationPublicUrl(bulletinId) {
  const token = signBulletinVerificationToken(bulletinId)
  if (!token) return null
  const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
  return `${base}/verifier-bulletin?t=${encodeURIComponent(token)}`
}
