export type PublicContentRouteType = 'ARTICLE' | 'VIDEO' | 'SEMINAR' | 'article' | 'video' | 'seminar'

export function articleDetailPath(id: string | number): string {
  return `/article/detail?id=${encodeURIComponent(String(id))}`
}

export function videoDetailPath(id: string | number): string {
  return `/video/detail?id=${encodeURIComponent(String(id))}`
}

export function seminarDetailPath(id: string | number): string {
  return `/seminar/detail?id=${encodeURIComponent(String(id))}`
}

export function publicContentDetailPath(type: PublicContentRouteType, id: string | number): string {
  const normalized = String(type).toUpperCase()
  if (normalized === 'ARTICLE') return articleDetailPath(id)
  if (normalized === 'VIDEO') return videoDetailPath(id)
  if (normalized === 'SEMINAR') return seminarDetailPath(id)
  return '/'
}
