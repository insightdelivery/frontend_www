'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Bookmark, Share2 } from 'lucide-react'
import VideoPlayer from '@/components/video/VideoPlayer'
import { fetchPublicVideoDetail, fetchPublicVideoList } from '@/services/video'
import type { PublicVideoDetail, PublicVideoListItem, VideoAttachment } from '@/types/video'
import { getApiBaseURL } from '@/lib/axios'

const CONTAINER = 'max-w-[1220px] mx-auto'
const COLORS = {
  text: 'text-[#0f172a]',
  textSecondary: 'text-[#64748b]',
  body: 'text-[#334155]',
  border: 'border-[#e2e8f0]',
  bgLight: 'bg-[#f8fafc]',
  tagBg: 'bg-[#f1f5f9]',
  accent: 'bg-[#e1f800]',
} as const

export type ContentDetailType = 'video' | 'seminar'

function getDetailUrl(type: ContentDetailType, rid: string) {
  return type === 'video' ? `/video/detail?id=${encodeURIComponent(rid)}` : `/seminar/detail?id=${encodeURIComponent(rid)}`
}

function getListUrl(type: ContentDetailType) {
  return type === 'video' ? '/video' : '/seminar'
}

function getListLabel(type: ContentDetailType) {
  return type === 'video' ? '비디오' : '세미나'
}

function resolveThumbnailUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  const u = url.trim()
  if (/^https?:\/\//i.test(u)) return u
  if (u.startsWith('//')) return u
  if (u.startsWith('/')) {
    const base = getApiBaseURL().replace(/\/$/, '')
    return `${base}${u}`
  }
  return u
}

function formatListedAt(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function attachmentLabel(a: VideoAttachment) {
  return a.name ?? a.filename ?? '다운로드'
}

const RELATED_PLACEHOLDERS = [
  'bg-gradient-to-br from-emerald-200 to-emerald-700',
  'bg-gradient-to-br from-violet-200 to-violet-700',
  'bg-gradient-to-br from-amber-200 to-amber-600',
]

export interface VideoSeminarDetailContentProps {
  type: ContentDetailType
  id: string
}

export default function VideoSeminarDetailContent({ type, id }: VideoSeminarDetailContentProps) {
  const [detail, setDetail] = useState<PublicVideoDetail | null>(null)
  const [related, setRelated] = useState<PublicVideoListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const trimmed = id.trim()
    const numericId = Number(trimmed)
    if (!trimmed || Number.isNaN(numericId) || numericId < 1) {
      setLoading(false)
      setError('요청이 올바르지 않습니다')
      setDetail(null)
      setRelated([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const d = await fetchPublicVideoDetail(numericId)

      if (type === 'seminar' && d.contentType !== 'seminar') {
        setError('해당 세미나를 찾을 수 없습니다')
        setDetail(null)
        setRelated([])
        return
      }
      if (type === 'video' && d.contentType !== 'video') {
        setError('해당 비디오를 찾을 수 없습니다')
        setDetail(null)
        setRelated([])
        return
      }

      setDetail(d)

      const ct: 'video' | 'seminar' = type === 'seminar' ? 'seminar' : 'video'
      try {
        const rel = await fetchPublicVideoList({
          page: 1,
          pageSize: 24,
          sort: 'popular',
          contentType: ct,
        })
        const filtered = (rel.videos ?? []).filter((v) => v.id !== d.id)
        setRelated(filtered.slice(0, 3))
      } catch {
        setRelated([])
      }
    } catch {
      setError('데이터를 불러올 수 없습니다')
      setDetail(null)
      setRelated([])
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const copyPageLink = () => {
    if (typeof window === 'undefined') return
    void navigator.clipboard.writeText(window.location.href)
  }

  if (loading) {
    return (
      <div className={`${CONTAINER} flex justify-center px-4 pb-20 pt-6 sm:px-6 md:px-8`}>
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className={`${CONTAINER} flex justify-center px-4 pb-20 pt-6 sm:px-6 md:px-8`}>
        <p className="text-gray-600">{error ?? '데이터가 없습니다'}</p>
      </div>
    )
  }

  const listLabel = getListLabel(type)
  const listUrl = getListUrl(type)
  const editorLine = detail.editor?.trim() || detail.speaker?.trim() || '—'
  const metaDate = formatListedAt(detail.createdAt)
  const tags = Array.isArray(detail.tags) ? detail.tags.filter((t): t is string => Boolean(t && String(t).trim())) : []
  const questions = Array.isArray(detail.questions) ? detail.questions.filter((q): q is string => Boolean(q && String(q).trim())) : []
  const attachments = Array.isArray(detail.attachments) ? detail.attachments.filter((a) => a?.url?.trim()) : []
  const bodyHtml = (detail.body ?? '').trim()

  return (
    <div className={`${CONTAINER} px-4 pb-20 pt-6 sm:px-6 md:px-8`}>
      <section className="mb-10 flex flex-col gap-8">
        <div className="aspect-video w-full overflow-hidden rounded-[12px] bg-black">
          <VideoPlayer
            sourceType={detail.sourceType}
            videoStreamId={detail.videoStreamId}
            videoUrl={detail.videoUrl}
          />
        </div>

        <div className="flex flex-col gap-8">
          <nav className="flex items-center gap-2" aria-label="Breadcrumb">
            <Link href={listUrl} className={`text-[14px] leading-5 ${COLORS.textSecondary} hover:underline`}>
              {listLabel}
            </Link>
            <ChevronRight className="h-5 w-4 flex-shrink-0 text-[#64748b]" aria-hidden />
            <span className={`text-[14px] font-bold leading-5 ${COLORS.text}`}>{detail.category ?? '—'}</span>
          </nav>

          <div className="flex flex-col gap-8">
            <h1 className={`text-[32px] font-bold tracking-[-1.2px] sm:text-[40px] md:text-[48px] md:leading-[48px] ${COLORS.text}`}>
              {detail.title}
            </h1>

            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className={`${COLORS.tagBg} rounded-full px-3 py-1 text-[12px] text-[#0f172a]`}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className={`flex flex-wrap items-center justify-between gap-4 border-y py-6 ${COLORS.border}`}>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 flex-shrink-0 rounded-full bg-[#cbd5e1]" />
                <div>
                  <div className={`text-[16px] font-bold ${COLORS.text}`}>{editorLine}</div>
                  <div className={`mt-0.5 text-sm ${COLORS.textSecondary}`}>{metaDate || '—'}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {attachments.map((file, i) => (
                  <a
                    key={`${file.url}-${i}`}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-lg border px-4 py-2 text-[14px] font-bold ${COLORS.border} ${COLORS.text} hover:bg-gray-50`}
                  >
                    {attachmentLabel(file)}
                  </a>
                ))}
                <button type="button" className="rounded-lg p-2 hover:bg-gray-100" aria-label="공유">
                  <Share2 className="h-5 w-5 text-[#0f172a]" />
                </button>
                <button type="button" className="rounded-lg p-2 hover:bg-gray-100" aria-label="북마크">
                  <Bookmark className="h-5 w-5 text-[#0f172a]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-10 flex flex-col gap-6">
        {bodyHtml ? (
          <div
            className={`text-[18px] leading-[29px] text-[#334155]`}
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        ) : (
          <p className={`text-[18px] leading-[29px] ${COLORS.body}`}>본문이 없습니다.</p>
        )}
      </div>

      <section className={`${COLORS.accent} mb-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-8`}>
        <div>
          <h2 className="text-xl font-bold text-black">인사이트 확장하기!</h2>
          <p className="mt-1 text-[16px] leading-6 text-black/70">24시간 공유 링크로 인사이트와 복음을 나눠보세요!</p>
        </div>
        <button
          type="button"
          onClick={copyPageLink}
          className="rounded-xl bg-black px-6 py-3 text-[16px] font-bold text-white hover:opacity-90"
        >
          링크 복사하기
        </button>
      </section>

      <section className={`${COLORS.bgLight} mb-12 rounded-2xl border p-8 ${COLORS.border}`}>
        <h3 className={`mb-6 text-[20px] font-bold ${COLORS.text}`}>적용 질문</h3>
        {questions.length > 0 ? (
          <div className="space-y-6">
            {questions.map((q, i) => (
              <div key={`${i}-${q.slice(0, 20)}`}>
                <div className={`font-semibold ${COLORS.text}`}>Q{i + 1}</div>
                <textarea
                  className={`mt-2 w-full rounded-xl border p-4 ${COLORS.border}`}
                  placeholder={q}
                  rows={4}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm ${COLORS.textSecondary}`}>등록된 적용 질문이 없습니다.</p>
        )}
        <div className={`mt-8 border-t pt-10 text-center ${COLORS.border}`}>
          <p className={`mb-3 text-[16px] font-bold ${COLORS.text}`}>콘텐츠가 도움이 되었나요?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className="p-1 hover:opacity-70" aria-label={`${n}점`}>
                <span className="text-2xl text-[#e2e8f0] hover:text-amber-400">★</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-8">
        <h2 className={`mb-8 text-[24px] font-bold tracking-[-0.6px] ${COLORS.text}`}>추천 콘텐츠</h2>
        {related.length === 0 ? (
          <p className={`text-sm ${COLORS.textSecondary}`}>추천할 콘텐츠가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {related.map((item, i) => {
              const thumb = resolveThumbnailUrl(item.thumbnail)
              return (
                <Link key={item.id} href={getDetailUrl(type, String(item.id))} className="group block">
                  <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-xl border border-slate-100 bg-[#f3f4f6]">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className={`h-full w-full ${RELATED_PLACEHOLDERS[i % RELATED_PLACEHOLDERS.length]}`} />
                    )}
                  </div>
                  <p className={`line-clamp-2 text-[16px] font-bold leading-6 group-hover:underline ${COLORS.text}`}>{item.title}</p>
                  <p className={`mt-1 text-[14px] leading-5 ${COLORS.textSecondary}`}>{item.speaker ?? '—'}</p>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
