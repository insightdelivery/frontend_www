import type { Metadata } from 'next'
import { serverFetchPublicJson } from '@/lib/serverApi'
import type { ArticleDetail } from '@/types/article'
import type { PublicVideoDetail } from '@/types/video'

function getSiteOrigin(): string {
  const raw = (
    process.env.NEXT_PUBLIC_SITE_ORIGIN ||
    process.env.NEXT_PUBLIC_WWW_ORIGIN ||
    'https://www.inde.kr'
  ).trim()
  return (raw.replace(/\/$/, '') || 'https://www.inde.kr')
}

function plainTextExcerpt(html: string | null | undefined, maxLen = 180): string {
  const text = (html ?? '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= maxLen) return text
  return `${text.slice(0, maxLen - 1).trim()}…`
}

function absoluteOgImage(imageUrl: string | null | undefined): string {
  const origin = getSiteOrigin()
  const raw = (imageUrl ?? '').trim()
  if (!raw) return `${origin}/indeOgLogo.jpeg?v=2`
  if (raw.startsWith('//')) return `https:${raw}`
  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('/')) return `${origin}${raw}`
  return raw
}

function buildMetadata(params: {
  title: string
  description: string
  imageUrl: string | null | undefined
  canonicalPath: string
  ogType?: 'article' | 'website'
}): Metadata {
  const origin = getSiteOrigin()
  const title = params.title.trim() || 'InDe'
  const description = params.description.trim() || 'InDe 콘텐츠'
  const canonical = `${origin}${params.canonicalPath}`
  const image = absoluteOgImage(params.imageUrl)

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: params.ogType ?? 'website',
      siteName: 'InDe',
      locale: 'ko_KR',
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

function parsePositiveId(raw: string | undefined): number | null {
  if (!raw?.trim()) return null
  const n = parseInt(raw.trim(), 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

export async function buildArticleDetailMetadata(idParam: string | undefined): Promise<Metadata> {
  const id = parsePositiveId(idParam)
  if (!id) {
    return { title: '아티클' }
  }

  try {
    const article = await serverFetchPublicJson<ArticleDetail>(`/api/articles/${id}`)
    const description =
      (article.subtitle ?? '').trim() || plainTextExcerpt(article.content, 180)
    return buildMetadata({
      title: article.title,
      description,
      imageUrl: article.thumbnail,
      canonicalPath: `/article/detail?id=${id}`,
      ogType: 'article',
    })
  } catch {
    return { title: '아티클' }
  }
}

export async function buildVideoDetailMetadata(idParam: string | undefined): Promise<Metadata> {
  const id = parsePositiveId(idParam)
  if (!id) {
    return { title: '비디오' }
  }

  try {
    const video = await serverFetchPublicJson<PublicVideoDetail>(`/api/videos/${id}`)
    if (video.contentType === 'seminar') {
      return { title: '비디오' }
    }
    const description = (video.subtitle ?? '').trim() || plainTextExcerpt(video.body, 180)
    return buildMetadata({
      title: video.title,
      description,
      imageUrl: video.thumbnail,
      canonicalPath: `/video/detail?id=${id}`,
      ogType: 'website',
    })
  } catch {
    return { title: '비디오' }
  }
}

export async function buildSeminarDetailMetadata(idParam: string | undefined): Promise<Metadata> {
  const id = parsePositiveId(idParam)
  if (!id) {
    return { title: '세미나' }
  }

  try {
    const seminar = await serverFetchPublicJson<PublicVideoDetail>(`/api/videos/${id}`)
    if (seminar.contentType !== 'seminar') {
      return { title: '세미나' }
    }
    const description = (seminar.subtitle ?? '').trim() || plainTextExcerpt(seminar.body, 180)
    return buildMetadata({
      title: seminar.title,
      description,
      imageUrl: seminar.thumbnail,
      canonicalPath: `/seminar/detail?id=${id}`,
      ogType: 'website',
    })
  } catch {
    return { title: '세미나' }
  }
}
