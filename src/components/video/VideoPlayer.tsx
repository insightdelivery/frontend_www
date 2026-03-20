'use client'

type VideoSourceType = 'FILE_UPLOAD' | 'VIMEO' | 'YOUTUBE'

export interface VideoPlayerProps {
  sourceType: VideoSourceType | string | undefined | null
  videoStreamId?: string | null
  videoUrl?: string | null
}

function canonicalSourceType(st: VideoPlayerProps['sourceType']): VideoSourceType | null {
  const s = (st || '').toString().trim().toUpperCase()
  if (s === 'VIMEO' || s === 'YOUTUBE' || s === 'FILE_UPLOAD') {
    return s as VideoSourceType
  }
  return null
}

function extractYouTubeVideoId(raw: string): string | null {
  const u = raw.trim()
  if (!u) return null
  try {
    const url = u.startsWith('http') ? new URL(u) : new URL(`https://${u}`)
    const host = url.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').split('/')[0]?.split('?')[0]
      if (id && /^[\w-]+$/.test(id) && id.length >= 6) return id
      return null
    }
    if (host.includes('youtube.com')) {
      const v = url.searchParams.get('v')
      if (v && /^[\w-]+$/.test(v) && v.length >= 6) return v
      const paths = ['embed', 'shorts', 'live']
      for (const p of paths) {
        const m = url.pathname.match(new RegExp(`/${p}/([\\w-]+)`))
        if (m?.[1] && m[1].length >= 6) return m[1]
      }
    }
  } catch {
    /* ignore */
  }
  const watch = u.match(/[?&]v=([\w-]+)/)
  if (watch?.[1] && watch[1].length >= 6) return watch[1]
  const short = u.match(/youtu\.be\/([\w-]+)/)
  if (short?.[1] && short[1].length >= 6) return short[1]
  return null
}

function extractVimeoId(raw: string): string | null {
  const u = raw.trim()
  if (!u) return null
  const m = u.match(/vimeo\.com\/(?:.*\/)?(\d+)/)
  return m ? m[1] : null
}

function inferExternalFromUrl(url: string): 'YOUTUBE' | 'VIMEO' | null {
  const lower = url.toLowerCase()
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YOUTUBE'
  if (lower.includes('vimeo.com')) return 'VIMEO'
  return null
}

function effectivePlayerMode(
  st: VideoSourceType | null,
  sid: string,
  url: string
): 'CLOUDFLARE' | 'YOUTUBE' | 'VIMEO' | 'NONE' {
  if (st === 'FILE_UPLOAD' && sid) return 'CLOUDFLARE'
  if (st === 'YOUTUBE' && url) return 'YOUTUBE'
  if (st === 'VIMEO' && url) return 'VIMEO'
  if (st === 'FILE_UPLOAD' && !sid && url) {
    const inferred = inferExternalFromUrl(url)
    if (inferred === 'YOUTUBE' && extractYouTubeVideoId(url)) return 'YOUTUBE'
    if (inferred === 'VIMEO' && extractVimeoId(url)) return 'VIMEO'
  }
  return 'NONE'
}

export default function VideoPlayer({ sourceType, videoStreamId, videoUrl }: VideoPlayerProps) {
  const sid = (videoStreamId || '').trim()
  const url = (videoUrl || '').trim()
  const st = canonicalSourceType(sourceType) ?? 'FILE_UPLOAD'
  const mode = effectivePlayerMode(st, sid, url)

  const fallback = (msg: string) => (
    <div className="flex h-full min-h-[200px] w-full items-center justify-center bg-black/90 px-4 text-center text-sm text-white/80">
      {msg}
    </div>
  )

  if (mode === 'CLOUDFLARE') {
    return (
      <iframe
        src={`https://iframe.videodelivery.net/${sid}`}
        className="h-full w-full min-h-[200px]"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        title="Cloudflare Stream"
      />
    )
  }

  if (mode === 'YOUTUBE') {
    const id = extractYouTubeVideoId(url)
    if (!id) return fallback('유효한 YouTube 주소가 아닙니다')
    return (
      <iframe
        src={`https://www.youtube.com/embed/${id}?rel=0`}
        className="h-full w-full min-h-[200px]"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        title="YouTube"
      />
    )
  }

  if (mode === 'VIMEO') {
    const vid = extractVimeoId(url)
    if (!vid) return fallback('유효한 Vimeo 주소가 아닙니다')
    return (
      <iframe
        src={`https://player.vimeo.com/video/${vid}`}
        className="h-full w-full min-h-[200px]"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Vimeo"
      />
    )
  }

  return fallback('영상 정보가 없습니다')
}
