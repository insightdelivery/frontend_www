'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Bookmark, Share2, Star } from 'lucide-react'
import VideoPlayer from '@/components/video/VideoPlayer'
import { fetchPublicVideoDetail, fetchPublicVideoList } from '@/services/video'
import type { PublicVideoDetail, PublicVideoListItem, VideoAttachment } from '@/types/video'
import { getApiBaseURL } from '@/lib/axios'
import { useAuth } from '@/contexts/AuthContext'
import { postView, postRating, postBookmark, deleteBookmark } from '@/services/libraryUseractivity'
import type { ContentType } from '@/services/libraryUseractivity'
import ArticleShareModal from '@/components/article/detail/ArticleShareModal'
import ArticleGuestShareModal from '@/components/article/detail/ArticleGuestShareModal'
import ArticleEntitlementShareModal from '@/components/article/detail/ArticleEntitlementShareModal'
import AppliedQuestionsSection from '@/components/content-detail/AppliedQuestionsSection'
import CommentSection from '@/components/comments/CommentSection'
import type { SysCodeItem } from '@/lib/syscode'
import {
  getSysCode,
  getSysCodeName,
  SEMINAR_CATEGORY_PARENT,
  VIDEO_CATEGORY_PARENT,
} from '@/lib/syscode'
import { fetchHomepageDocPublic } from '@/services/homepageDoc'
import { HOMEPAGE_DOC_DEFAULT_TITLES } from '@/constants/homepageDoc'
import type { HomepageDocPayload } from '@/types/homepageDoc'
import { sanitizeHomepageHtml } from '@/lib/sanitizeHomepageHtml'

const CONTAINER = 'max-w-[900px] mx-auto'
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
  /** `/s` 만료 후 리다이렉트 시 (contentShareLinkCopy.md §6) */
  shareExpired?: boolean
}

function toApiContentType(t: ContentDetailType): ContentType {
  return t === 'seminar' ? 'SEMINAR' : 'VIDEO'
}

export default function VideoSeminarDetailContent({ type, id, shareExpired }: VideoSeminarDetailContentProps) {
  const { status } = useAuth()
  const authenticated = status === 'authenticated'
  const authenticatedMember = authenticated
  const [detail, setDetail] = useState<PublicVideoDetail | null>(null)
  const [related, setRelated] = useState<PublicVideoListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoryCodes, setCategoryCodes] = useState<SysCodeItem[]>([])
  const [shareToast, setShareToast] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [guestShareModalOpen, setGuestShareModalOpen] = useState(false)
  const [entitlementShareModalOpen, setEntitlementShareModalOpen] = useState(false)
  const openShareWhenAuthReady = useRef(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  /** 로그인 후 별점 제출 시만 설정 (article/detail과 동일 — 서버 개인 별점 조회 없음) */
  const [ratingValue, setRatingValue] = useState<number | null>(null)
  /** wwwDocEtc.md §8.2 — 비디오/세미나 상세 각각 `video_copyright` / `seminar_copyright` */
  const [copyrightDoc, setCopyrightDoc] = useState<HomepageDocPayload | null | undefined>(undefined)

  const apiContentType = useMemo(() => toApiContentType(type), [type])

  const categoryParent = useMemo(
    () => (type === 'seminar' ? SEMINAR_CATEGORY_PARENT : VIDEO_CATEGORY_PARENT),
    [type],
  )

  useEffect(() => {
    void getSysCode(categoryParent).then(setCategoryCodes)
  }, [categoryParent])

  const copyrightDocType = type === 'video' ? 'video_copyright' : 'seminar_copyright'
  const idValidForCopyright = useMemo(() => {
    const trimmed = id.trim()
    const n = Number(trimmed)
    return Boolean(trimmed && !Number.isNaN(n) && n > 0)
  }, [id])

  useEffect(() => {
    if (!idValidForCopyright) {
      setCopyrightDoc(undefined)
      return
    }
    let cancelled = false
    fetchHomepageDocPublic(copyrightDocType)
      .then((doc) => {
        if (!cancelled) setCopyrightDoc(doc ?? null)
      })
      .catch(() => {
        if (!cancelled) setCopyrightDoc(null)
      })
    return () => {
      cancelled = true
    }
  }, [idValidForCopyright, copyrightDocType])

  const shareEntitlementOnly = detail ? !authenticated && detail.shareEntitlement === true : false

  const viewCalled = useRef(new Set<string>())
  useEffect(() => {
    if (typeof window === 'undefined') return
    const trimmed = id.trim()
    if (!trimmed) return
    if (viewCalled.current.has(trimmed)) return
    viewCalled.current.add(trimmed)
    void postView(apiContentType, trimmed).catch(() => {})
  }, [id, apiContentType])

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
      setRatingValue(null)

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
  }, [id, type])

  useEffect(() => {
    void load()
  }, [load])

  const contentCode = detail ? String(detail.id) : ''

  const handleShareClick = useCallback(() => {
    if (status === 'loading' || loading) {
      openShareWhenAuthReady.current = true
      return
    }
    if (authenticatedMember) {
      setShareModalOpen(true)
    } else if (shareEntitlementOnly) {
      setEntitlementShareModalOpen(true)
    } else {
      setGuestShareModalOpen(true)
    }
  }, [status, loading, authenticatedMember, shareEntitlementOnly])

  useEffect(() => {
    if (!openShareWhenAuthReady.current) return
    if (status === 'loading' || loading) return
    openShareWhenAuthReady.current = false
    if (authenticatedMember) {
      setShareModalOpen(true)
    } else if (shareEntitlementOnly) {
      setEntitlementShareModalOpen(true)
    } else {
      setGuestShareModalOpen(true)
    }
  }, [status, loading, authenticatedMember, shareEntitlementOnly])

  const handleBookmarkClick = useCallback(async () => {
    if (!detail) return
    const cid = String(detail.id)
    if (!authenticated) return
    try {
      if (isBookmarked) {
        await deleteBookmark(apiContentType, cid)
        setIsBookmarked(false)
      } else {
        await postBookmark(apiContentType, cid)
        setIsBookmarked(true)
      }
    } catch {
      // ignore
    }
  }, [detail, authenticated, isBookmarked, apiContentType])

  const handleRatingClick = useCallback(
    async (value: number) => {
      if (!detail || !authenticated) return
      const cid = String(detail.id)
      try {
        await postRating(apiContentType, cid, value)
        setRatingValue(value)
      } catch {
        // ignore
      }
    },
    [detail, authenticated, apiContentType]
  )

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
  const attachments = Array.isArray(detail.attachments) ? detail.attachments.filter((a) => a?.url?.trim()) : []
  const bodyHtml = (detail.body ?? '').trim()
  const categoryBreadcrumbLabel = (() => {
    const c = detail.category?.trim()
    if (!c) return '—'
    return getSysCodeName(categoryCodes, c) || c
  })()

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
            <span className={`text-[14px] font-bold leading-5 ${COLORS.text}`}>{categoryBreadcrumbLabel}</span>
          </nav>

          {shareExpired ? (
            <div
              className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-[14px] leading-snug text-[#0f172a]"
              role="status"
            >
              공유 링크 유효 시간이 만료되었습니다. 전체 열람은 회원·새 공유 링크 발급을 이용해 주세요.
            </div>
          ) : null}

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
                <button
                  type="button"
                  className="rounded-lg p-2 hover:bg-gray-100"
                  aria-label="공유"
                  onClick={handleShareClick}
                >
                  <Share2 className="h-5 w-5 text-[#0f172a]" />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 hover:bg-gray-100"
                  aria-label="북마크"
                  onClick={handleBookmarkClick}
                >
                  <Bookmark
                    className={`h-5 w-5 ${isBookmarked ? 'fill-[#0f172a] text-[#0f172a]' : 'text-[#0f172a]'}`}
                  />
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

      {copyrightDoc != null && (
        <section className="my-10 rounded-xl border-2 border-blue-200 bg-blue-50/50 p-6">
          <p className="mb-2 text-[12px] font-bold text-[#0f172a]">
            {copyrightDoc.title?.trim() || HOMEPAGE_DOC_DEFAULT_TITLES[copyrightDocType]}
          </p>
          {(() => {
            const safeHtml = sanitizeHomepageHtml(copyrightDoc.bodyHtml || '')
            return safeHtml.trim() ? (
              <div
                className="text-[12px] leading-[19.5px] text-[#475569] [&_p]:mb-2 [&_p:last-child]:mb-0 [&_a]:text-[#2563eb] [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: safeHtml }}
              />
            ) : null
          })()}
        </section>
      )}

      <section className={`${COLORS.accent} mb-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-8`}>
        <div>
          <h2 className="text-xl font-bold text-black">인사이트 확장하기!</h2>
          <p className="mt-1 text-[16px] leading-6 text-black/70">24시간 공유 링크로 인사이트와 복음을 나눠보세요!</p>
        </div>
        <button
          type="button"
          onClick={handleShareClick}
          className="rounded-xl bg-black px-6 py-3 text-[16px] font-bold text-white hover:opacity-90"
        >
          링크 복사하기
        </button>
      </section>

      {shareToast ? (
        <div
          className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#0f172a] px-6 py-3 text-[14px] font-medium text-white shadow-lg"
          role="status"
        >
          링크가 복사되었습니다
        </div>
      ) : null}

      <ArticleShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        contentCode={contentCode}
        contentType={apiContentType}
      />
      <ArticleEntitlementShareModal
        open={entitlementShareModalOpen}
        onClose={() => setEntitlementShareModalOpen(false)}
        contentCode={contentCode}
        contentType={apiContentType}
        onCopied={() => {
          setShareToast(true)
          setTimeout(() => setShareToast(false), 2000)
        }}
      />
      <ArticleGuestShareModal
        open={guestShareModalOpen}
        onClose={() => setGuestShareModalOpen(false)}
        contentCode={contentCode}
        contentType={apiContentType}
        onCopied={() => {
          setShareToast(true)
          setTimeout(() => setShareToast(false), 2000)
        }}
      />

      <AppliedQuestionsSection contentType={apiContentType} contentId={detail.id} className="mb-12" />

      <section className={`${COLORS.bgLight} mb-12 rounded-2xl border p-8 text-center ${COLORS.border}`}>
        <h3 className={`mb-3 text-[20px] font-bold ${COLORS.text}`}>별점</h3>
        <p className={`mb-3 text-[16px] font-bold ${COLORS.text}`}>콘텐츠가 도움이 되었나요?</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className="p-1 hover:opacity-70"
              aria-label={`${n}점`}
              onClick={() => void handleRatingClick(n)}
            >
              <Star
                className={`h-6 w-6 ${
                  ratingValue !== null && n <= ratingValue
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-[#e2e8f0] hover:text-amber-400'
                }`}
              />
            </button>
          ))}
        </div>
      </section>

      <CommentSection
        className="mb-12"
        contentType={apiContentType}
        contentId={detail.id}
        allowComment={Boolean((detail as unknown as { allowComment?: boolean }).allowComment)}
      />

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
                  <div className="relative mb-4 aspect-[16/9] overflow-hidden rounded-xl border border-slate-100 bg-[#f3f4f6]">
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
