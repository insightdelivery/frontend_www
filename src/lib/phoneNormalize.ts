/** 백엔드 `phone_normalize.normalize_phone_kr` 와 동일 규칙 (wwwMypage_userInfo §5.2) */

export function normalizePhoneKr(raw: string): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  let d = digits
  if (d.startsWith('82') && d.length >= 11) {
    d = `0${d.slice(2)}`
  }
  if (d.length === 10 && d.startsWith('10')) {
    d = `0${d}`
  }
  return d
}

export function isValidKrMobile(normalized: string): boolean {
  if (!normalized) return false
  if (normalized.length < 10 || normalized.length > 11) return false
  return normalized.startsWith('01')
}
