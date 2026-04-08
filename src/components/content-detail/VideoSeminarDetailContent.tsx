'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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

/** 상세 메타 행 — 스크린 기준 `2026. 02. 13.` 형태 */
function formatDetailMetaDate(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}. ${m}. ${day}.`
}

/** 공개 API 필드명이 camelCase / snake_case 혼용될 때 한 곳에서만 보정 */
function getVideoSpeakerDisplayFields(detail: PublicVideoDetail) {
  const r = detail as unknown as Record<string, unknown>
  const affiliation =
    (typeof detail.speakerAffiliation === 'string' ? detail.speakerAffiliation : '') ||
    (typeof r.speaker_affiliation === 'string' ? r.speaker_affiliation : '') ||
    ''
  const profileRaw =
    (typeof detail.speakerProfileImage === 'string' ? detail.speakerProfileImage : '') ||
    (typeof r.speaker_profile_image === 'string' ? r.speaker_profile_image : '') ||
    ''
  const profileResolved = resolveThumbnailUrl(profileRaw) || profileRaw.trim() || null
  const name =
    detail.speaker?.trim() ||
    detail.editor?.trim() ||
    (typeof r.speaker === 'string' ? r.speaker.trim() : '') ||
    '—'
  return {
    name,
    affiliation: affiliation.trim() || undefined,
    profileUrl: profileResolved,
  }
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
  const [bookmarkTooltip, setBookmarkTooltip] = useState<string | null>(null)
  const bookmarkTooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bookmarkTooltipId = useId()
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

  const showBookmarkTooltip = useCallback((message: string) => {
    if (bookmarkTooltipTimerRef.current) clearTimeout(bookmarkTooltipTimerRef.current)
    setBookmarkTooltip(message)
    bookmarkTooltipTimerRef.current = setTimeout(() => {
      setBookmarkTooltip(null)
      bookmarkTooltipTimerRef.current = null
    }, 2000)
  }, [])

  useEffect(
    () => () => {
      if (bookmarkTooltipTimerRef.current) clearTimeout(bookmarkTooltipTimerRef.current)
    },
    []
  )

  const handleBookmarkClick = useCallback(async () => {
    if (!detail) return
    const cid = String(detail.id)
    if (!authenticated) {
      showBookmarkTooltip('로그인 후 이용 가능합니다.')
      return
    }
    try {
      if (isBookmarked) {
        await deleteBookmark(apiContentType, cid)
        setIsBookmarked(false)
        showBookmarkTooltip('북마크가 해제되었습니다.')
      } else {
        await postBookmark(apiContentType, cid)
        setIsBookmarked(true)
        showBookmarkTooltip('북마크가 저장되었습니다.')
      }
    } catch {
      // ignore
    }
  }, [detail, authenticated, isBookmarked, apiContentType, showBookmarkTooltip])

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
  const speakerDisplay = getVideoSpeakerDisplayFields(detail)
  const metaDateLine = formatDetailMetaDate(detail.createdAt)
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
            sourceType={
              type === 'seminar' ? 'FILE_UPLOAD' : (detail.sourceType ?? 'FILE_UPLOAD')
            }
            videoStreamId={detail.videoStreamId}
            videoUrl={type === 'seminar' ? undefined : detail.videoUrl}
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
              <div className="flex min-w-0 items-start gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#cbd5e1]">
                  {speakerDisplay.profileUrl ? (
                    <Image
                      src={speakerDisplay.profileUrl}
                      alt={speakerDisplay.name === '—' ? '' : speakerDisplay.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="min-w-0 leading-tight">
                  <p className={`text-[16px] font-bold leading-6 ${COLORS.text}`}>{speakerDisplay.name}</p>
                  {speakerDisplay.affiliation ? (
                    <p className={`mt-1 text-[14px] font-normal leading-5 ${COLORS.textSecondary}`}>
                      {speakerDisplay.affiliation}
                    </p>
                  ) : null}
                  {metaDateLine ? (
                    <p
                      className={`text-[14px] font-normal leading-5 ${COLORS.textSecondary} ${
                        speakerDisplay.affiliation ? 'mt-0.5' : 'mt-1'
                      }`}
                    >
                      {metaDateLine}
                    </p>
                  ) : null}
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
                <div className="relative shrink-0">
                  {bookmarkTooltip ? (
                    <div
                      id={bookmarkTooltipId}
                      role="tooltip"
                      className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 flex w-max max-w-[min(90vw,22rem)] -translate-x-1/2 flex-col items-center"
                    >
                      <div className="max-w-[min(90vw,22rem)] whitespace-nowrap rounded-lg border border-gray-200/90 bg-gray-100 px-3 py-2 text-center text-[12px] font-medium leading-snug text-gray-800 shadow-sm">
                        {bookmarkTooltip}
                      </div>
                      <span
                        className="h-0 w-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-gray-100"
                        aria-hidden
                      />
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-lg p-2 hover:bg-gray-100"
                    aria-label="북마크"
                    aria-describedby={bookmarkTooltip ? bookmarkTooltipId : undefined}
                    title={
                      authenticated
                        ? isBookmarked
                          ? '북마크 해제'
                          : '북마크 저장'
                        : '로그인 후 이용 가능합니다.'
                    }
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

      {/* 적용 질문: article/detail.md §4.6 — ARTICLE과 동일 AppliedQuestionsSection(질문 0건·로딩 시 미노출, 비회원 잠금 영역 동일) */}
      <AppliedQuestionsSection
        key={`applied-questions-${apiContentType}-${detail.id}`}
        contentType={apiContentType}
        contentId={detail.id}
        className="mb-12"
      />

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
