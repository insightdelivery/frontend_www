'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ChevronRight, Bookmark, Share2, Star } from 'lucide-react'
import { fetchArticleDetail, fetchArticleList, resolveArticlesByRanking } from '@/services/article'
import { fetchArticleRankingRecommended } from '@/services/libraryRanking'
import { fetchHomepageDocPublic } from '@/services/homepageDoc'
import { HOMEPAGE_DOC_DEFAULT_TITLES } from '@/constants/homepageDoc'
import { sanitizeHomepageHtml } from '@/lib/sanitizeHomepageHtml'
import type { HomepageDocPayload } from '@/types/homepageDoc'
import { fetchContentQuestions, submitQuestionAnswer, type ContentQuestionItem } from '@/services/contentQuestion'
import { postView, postRating, postBookmark, deleteBookmark } from '@/services/libraryUseractivity'
import ArticleShareModal from '@/components/article/detail/ArticleShareModal'
import ArticleGuestShareModal from '@/components/article/detail/ArticleGuestShareModal'
import ArticleEntitlementShareModal from '@/components/article/detail/ArticleEntitlementShareModal'
import { useAuth } from '@/contexts/AuthContext'
import type { ArticleDetail, ArticleListItem } from '@/types/article'
import { getSysCodeName, getSysCodeFromCache } from '@/lib/syscode'
import { formatArticleTagLabel } from '@/lib/articleTags'
import { resolveArticleThumbnailUrl } from '@/lib/articleThumbnailUrl'
import { fetchWeeklyCrossRanking, resolveWeeklyCrossCards, type WeeklyCrossCardData } from '@/services/weeklyCrossRanking'
import { HighlightProvider, useHighlight, HighlightRenderer, HighlightButton, selectionToPayloads } from '@/components/highlight'

/** 아티클 상세 페이지 전체(GNB 제외) 가로 폭 */
const DETAIL_MAX = 'max-w-[720px] mx-auto'
const COLORS = {
  text: 'text-[#0f172a]',
  textSecondary: 'text-[#64748b]',
  border: 'border-[#e2e8f0]',
  bgLight: 'bg-[#f8fafc]',
  accent: 'bg-[#e1f800]',
  quoteBorder: 'border-l-[#e1f800]',
} as const

/** 날짜 포맷 (YYYY.MM.DD) */
function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')
  } catch {
    return ''
  }
}

/** 썸네일 없을 때 카드 배경 (ArticleListContent와 동일 계열) */
const PLACEHOLDER_GRADIENTS = [
  'bg-gradient-to-br from-emerald-200 via-emerald-400 to-emerald-700',
  'bg-gradient-to-br from-sky-200 via-sky-300 to-sky-600',
  'bg-gradient-to-br from-violet-200 via-violet-400 to-violet-700',
]

function shufflePick<T>(items: T[], count: number): T[] {
  if (count <= 0 || items.length === 0) return []
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = copy[i]!
    copy[i] = copy[j]!
    copy[j] = t
  }
  return copy.slice(0, Math.min(count, copy.length))
}

function detailUrl(id: string) {
  return `/article/detail?id=${encodeURIComponent(id)}`
}

function getCategoryName(categorySid: string): string {
  const categoryCodes = getSysCodeFromCache('SYS26209B002')
  if (categoryCodes) {
    const name = getSysCodeName(categoryCodes, categorySid)
    if (name !== categorySid) return name
  }
  return categorySid
}

/**
 * 본문 HTML을 관리자 상세 모달과 동일하게 줄바꿈이 보이도록 변환.
 * - \r\n, \r, \n → <br />
 * - </p><p> (TipTap 단락) 사이에 <br /> 삽입 → 웹 상세에서도 단락 구분 표시
 */
function contentWithLineBreaks(html: string): string {
  if (!html || typeof html !== 'string') return html
  return html
    .replace(/\r\n|\r|\n/g, '<br />')
    .replace(/<\/p>\s*<p>/gi, '</p><br /><p>')
}

export interface ArticleDetailContentProps {
  id: string
  /** `/s/{code}` 만료 후 리다이렉트 시 안내 (contentShareLinkCopy.md §6) */
  shareExpired?: boolean
}

const ARTICLE_DETAIL_PROSE_CLASS = `prose prose-lg max-w-none text-[18px] leading-[1.625] ${COLORS.text} py-4 [&_p]:!block [&_p]:!mb-2 [&_br]:block [&_blockquote]:border-l-[5px] [&_blockquote]:border-l-[#03c75a] [&_blockquote]:py-3 [&_blockquote]:px-4 [&_blockquote]:my-5 [&_blockquote]:bg-[#f6fff8] [&_blockquote]:text-[#222] [&_blockquote]:text-[15px]`

function DetailBottomWeeklyCard({ item }: { item: WeeklyCrossCardData }) {
  const grad = PLACEHOLDER_GRADIENTS[item.gradientIndex % PLACEHOLDER_GRADIENTS.length]
  const thumbSrc = item.thumbSrc
  return (
    <Link href={item.href} className="block group">
      <div
        className={`aspect-[4/3] rounded-xl overflow-hidden mb-4 relative ${
          thumbSrc ? 'bg-slate-100 border border-slate-100' : grad
        }`}
      >
        {thumbSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbSrc} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <p className={`font-bold text-[16px] leading-6 ${COLORS.text} group-hover:underline line-clamp-2`}>
        {item.title}
      </p>
      <p className={`text-[14px] leading-5 ${COLORS.textSecondary} mt-1 line-clamp-1`}>{item.line2}</p>
    </Link>
  )
}

function DetailBottomArticleCard({ item, index }: { item: ArticleListItem; index: number }) {
  const grad = PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length]
  const thumbSrc = resolveArticleThumbnailUrl(item.thumbnail)
  return (
    <Link href={detailUrl(String(item.id))} className="block group">
      <div
        className={`aspect-[3/2] rounded-xl overflow-hidden mb-4 relative ${
          thumbSrc ? 'bg-slate-100 border border-slate-100' : grad
        }`}
      >
        {thumbSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbSrc} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <p className={`font-bold text-[16px] leading-6 ${COLORS.text} group-hover:underline line-clamp-2`}>
        {item.title}
      </p>
      <p className={`text-[14px] leading-5 ${COLORS.textSecondary} mt-1`}>{item.author}</p>
    </Link>
  )
}

function ArticleDetailContentInner({ id, shareExpired }: ArticleDetailContentProps) {
  const { status } = useAuth()
  const authenticated = status === 'authenticated'
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contentQuestions, setContentQuestions] = useState<ContentQuestionItem[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState<number | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [shareToast, setShareToast] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [entitlementShareModalOpen, setEntitlementShareModalOpen] = useState(false)
  const [guestShareModalOpen, setGuestShareModalOpen] = useState(false)
  /** 인증 status가 loading일 때 공유 클릭 → 인증 확정 후 모달 자동 오픈 */
  const openShareWhenAuthReady = useRef(false)
  const [ratingValue, setRatingValue] = useState<number | null>(null)
  /** undefined 로딩, null 미노출(404 등), 있으면 표시 */
  const [articleCopyright, setArticleCopyright] = useState<HomepageDocPayload | null | undefined>(undefined)
  const contentRootRef = useRef<HTMLDivElement>(null)
  const lastFetchedId = useRef<string | null>(null)
  /** Strict Mode 재마운트 시 첫 요청 결과 재사용 (중복 호출 없이 화면 갱신) */
  const articlePromiseRef = useRef<{ id: string; promise: Promise<ArticleDetail> } | null>(null)
  const highlightContext = useHighlight()
  /** detail.md §3.5.1 — 관련(동일 카테고리 최신 30 중 랜덤 3)·추천(RECOMMENDED 캐시) */
  const [relatedArticles, setRelatedArticles] = useState<ArticleListItem[]>([])
  const [recommendedArticles, setRecommendedArticles] = useState<ArticleListItem[]>([])
  const [weeklyCards, setWeeklyCards] = useState<WeeklyCrossCardData[]>([])
  const [detailBlocksLoading, setDetailBlocksLoading] = useState(false)

  const numId = id ? parseInt(id, 10) : NaN
  const idValid = id !== '' && !Number.isNaN(numId) && numId > 0
  /** 공유 entitlement로 본문이 회원 동일이면 공유 UI도 회원용(contentShareLinkCopy.md §10.9) */
  const shareAsMember = authenticated || article?.shareEntitlement === true
  const authenticatedMember = authenticated
  const shareEntitlementOnly = !authenticated && article?.shareEntitlement === true

  useEffect(() => {
    if (!idValid) {
      setArticleCopyright(undefined)
      return
    }
    let cancelled = false
    fetchHomepageDocPublic('article_copyright')
      .then((doc) => {
        if (!cancelled) setArticleCopyright(doc ?? null)
      })
      .catch(() => {
        if (!cancelled) setArticleCopyright(null)
      })
    return () => {
      cancelled = true
    }
  }, [idValid])

  // 사용자 활동 로그 VIEW — id 기준 1회, 클라이언트만, fire-and-forget (detail.md §4.1, userAuthPlan)
  const calledMap = useRef(new Set<string>())
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!id || !idValid) return
    if (calledMap.current.has(id)) return

    calledMap.current.add(id)
    postView('ARTICLE', id).catch(() => {})
  }, [id, idValid])

  useEffect(() => {
    if (!id) return
    if (!idValid) {
      setLoading(false)
      setError('id가 필요합니다.')
      setArticle(null)
      return () => {}
    }

    let cancelled = false

    // 재마운트(Strict Mode) 시 이미 진행 중인 요청이 있으면 그 결과만 사용 (1회 호출 유지)
    const inFlight = articlePromiseRef.current
    if (inFlight?.id === id) {
      inFlight.promise
        .then((data) => {
          if (!cancelled) setArticle(data)
        })
        .catch((e) => {
          if (!cancelled) setError(e instanceof Error ? e.message : '아티클을 불러오지 못했습니다.')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
      return () => {
        cancelled = true
      }
    }

    // 중복 호출 방지 (Strict Mode 대응, article_detail_duplicate_api_analysis Part II)
    if (lastFetchedId.current === id) return
    lastFetchedId.current = id

    setLoading(true)
    setError(null)
    const promise = fetchArticleDetail(id)
    articlePromiseRef.current = { id, promise }
    promise
      .then((data) => {
        if (!cancelled) setArticle(data)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '아티클을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
        articlePromiseRef.current = null
      })
    return () => {
      cancelled = true
    }
  }, [id, idValid])

  useEffect(() => {
    if (!article?.id) return
    let cancelled = false
    fetchContentQuestions('ARTICLE', article.id)
      .then((list) => {
        if (!cancelled) setContentQuestions(list)
      })
      .catch(() => {
        if (!cancelled) setContentQuestions([])
      })
    return () => { cancelled = true }
  }, [article?.id])

  useEffect(() => {
    if (!article?.id) return
    const category = article.category?.trim()
    let cancelled = false
    setDetailBlocksLoading(true)
    ;(async () => {
      try {
        const byId = new Map<string, ArticleListItem>()
        const [recRes, weeklyRes, listRes] = await Promise.all([
          fetchArticleRankingRecommended().catch(() => ({ list: [] as { contentCode: string; rankOrder: number }[] })),
          fetchWeeklyCrossRanking().catch(() => ({ list: [] })),
          category
            ? fetchArticleList({ category, sort: 'latest', pageSize: 30, page: 1 })
            : Promise.resolve({ articles: [] as ArticleListItem[] }),
        ])
        if (cancelled) return
        for (const a of listRes.articles ?? []) {
          byId.set(String(a.id), a)
        }
        const rec = await resolveArticlesByRanking(recRes.list ?? [], byId)
        const weeklyResolved = await resolveWeeklyCrossCards(weeklyRes.list ?? [])
        if (cancelled) return
        setRecommendedArticles(rec)
        setWeeklyCards(weeklyResolved)
        const candidates = (listRes.articles ?? []).filter((a) => a.id !== article.id)
        setRelatedArticles(shufflePick(candidates, Math.min(3, candidates.length)))
      } catch {
        if (!cancelled) {
          setRecommendedArticles([])
          setRelatedArticles([])
          setWeeklyCards([])
        }
      } finally {
        if (!cancelled) setDetailBlocksLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [article?.id, article?.category])

  // §6 SEO: title, description (detail.md)
  useEffect(() => {
    if (!article) return
    const prevTitle = document.title
    document.title = article.title ? `${article.title} | InDe` : 'InDe'
    const desc = (article as { summary?: string }).summary ?? article.subtitle ?? ''
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc && desc) metaDesc.setAttribute('content', desc)
    return () => {
      document.title = prevTitle
    }
  }, [article])

  const handleAnswerChange = useCallback((questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    setSubmitError(null)
  }, [])

  const handleSubmitAnswer = useCallback(
    async (q: ContentQuestionItem) => {
      if (!article) return
      const text = (answers[q.question_id] ?? '').trim()
      if (!text) return
      setSubmitting(q.question_id)
      setSubmitError(null)
      try {
        await submitQuestionAnswer({
          question_id: q.question_id,
          content_type: 'ARTICLE',
          content_id: article.id,
          answer_text: text,
        })
        setAnswers((prev) => {
          const next = { ...prev }
          delete next[q.question_id]
          return next
        })
      } catch (e: unknown) {
        const msg = e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { IndeAPIResponse?: { Message?: string } } } }).response?.data?.IndeAPIResponse?.Message
          : null
        setSubmitError(msg || '답변 등록에 실패했습니다. 로그인 후 다시 시도해 주세요.')
      } finally {
        setSubmitting(null)
      }
    },
    [article, answers]
  )

  const handleBookmarkClick = useCallback(async () => {
    if (!idValid || !article) return
    if (!authenticated) return
    try {
      if (isBookmarked) {
        await deleteBookmark('ARTICLE', id)
        setIsBookmarked(false)
      } else {
        await postBookmark('ARTICLE', id)
        setIsBookmarked(true)
      }
    } catch {
      // ignore
    }
  }, [id, idValid, article, status, isBookmarked])

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

  const handleRatingClick = useCallback(
    async (value: number) => {
      if (!idValid || !authenticated) return
      try {
        await postRating('ARTICLE', id, value)
        setRatingValue(value)
      } catch {
        // ignore
      }
    },
    [id, idValid, status]
  )

  // §2.2 id 없으면/숫자 검증 실패 시 Not Found (detail.md)
  if (!idValid) {
    return (
      <div className={`${DETAIL_MAX} px-4 sm:px-6 md:px-[54px] pt-6 pb-20`}>
        <nav className="flex items-center gap-2 mb-6" aria-label="Breadcrumb">
          <Link href="/article" className={`text-[14px] leading-5 ${COLORS.textSecondary} hover:underline`}>
            아티클
          </Link>
        </nav>
        <div className="py-12 text-center">
          <p className={`text-[18px] ${COLORS.text} mb-4`}>잘못된 접근입니다.</p>
          <Link href="/article" className="text-[16px] font-medium text-[#0f172a] underline hover:no-underline">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  // §2.3 로딩 상태 → Skeleton UI (detail.md)
  if (loading) {
    return (
      <div className={`${DETAIL_MAX} px-4 sm:px-6 md:px-[54px] pt-6 pb-20`}>
        <nav className="flex items-center gap-2 mb-6">
          <div className="h-5 w-24 bg-[#e2e8f0] rounded animate-pulse" />
        </nav>
        <div className="h-10 w-3/4 bg-[#e2e8f0] rounded mb-4 animate-pulse" />
        <div className="h-5 w-full max-w-[480px] bg-[#e2e8f0] rounded mb-6 animate-pulse" />
        <div className="flex gap-2 mb-6">
          <div className="h-6 w-16 bg-[#e2e8f0] rounded-full animate-pulse" />
          <div className="h-6 w-20 bg-[#e2e8f0] rounded-full animate-pulse" />
        </div>
        <div className="flex items-center justify-between py-[25px] border-t border-b border-[#e2e8f0]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#e2e8f0] animate-pulse" />
            <div className="h-5 w-32 bg-[#e2e8f0] rounded animate-pulse" />
          </div>
        </div>
        <div className="mt-8 space-y-3">
          <div className="h-4 w-full bg-[#e2e8f0] rounded animate-pulse" />
          <div className="h-4 w-full bg-[#e2e8f0] rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-[#e2e8f0] rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className={`${DETAIL_MAX} px-4 sm:px-6 md:px-[54px] pt-6 pb-20`}>
        <nav className="flex items-center gap-2 mb-6" aria-label="Breadcrumb">
          <Link href="/article" className={`text-[14px] leading-5 ${COLORS.textSecondary} hover:underline`}>
            아티클
          </Link>
        </nav>
        <div className="py-12 text-center">
          <p className={`text-[18px] ${COLORS.text} mb-4`}>{error ?? '아티클을 찾을 수 없습니다.'}</p>
          <Link href="/article" className="text-[16px] font-medium text-[#0f172a] underline hover:no-underline">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const categoryLabel = getCategoryName(article.category)
  const displayTags = (article.tags ?? []).map((t) => formatArticleTagLabel(t)).filter(Boolean)
  const authorAvatarSrc =
    (article.authorProfileImage && article.authorProfileImage.trim()) || '/editorDefault.png'

  return (
    <div className={`${DETAIL_MAX} px-4 sm:px-6 md:px-[54px] pt-6 pb-20`}>
      <nav className="flex items-center gap-2 mb-6" aria-label="Breadcrumb">
        <Link href="/article" className={`text-[14px] leading-5 ${COLORS.textSecondary} hover:underline`}>
          아티클
        </Link>
        <ChevronRight className="h-5 w-4 text-[#64748b] flex-shrink-0" aria-hidden />
        <span className={`text-[14px] leading-5 font-semibold ${COLORS.text}`}>{categoryLabel}</span>
      </nav>

      {shareExpired ? (
        <div
          className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50/90 text-[14px] leading-snug text-[#0f172a]"
          role="status"
        >
          공유 링크 유효 시간이 만료되었습니다. 전체 열람은 회원·새 공유 링크 발급을 이용해 주세요.
        </div>
      ) : null}

      <header className="mb-8">
        <h1 className={`font-extrabold text-[32px] sm:text-[32px] md:text-[40px] leading-[1.1] tracking-[-0.025em] ${COLORS.text} mb-4`}>
          {article.title}
        </h1>
        {article.subtitle ? (
          <p
            className={`text-[18px] sm:text-[20px] leading-[1.4] ${COLORS.textSecondary} ${
              displayTags.length > 0 ? 'mb-3' : 'mb-4'
            }`}
          >
            {article.subtitle}
          </p>
        ) : null}
        {displayTags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-6" aria-label="태그">
            {displayTags.map((label, i) => (
              <span
                key={`${label}-${i}`}
                className="rounded-full bg-[#e8edf2] px-3 py-1 text-[12px] font-medium leading-snug text-[#475569]"
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}
        <div className={`flex items-center justify-between py-[25px] border-t border-b ${COLORS.border}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-slate-200/90 bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={authorAvatarSrc}
                alt=""
                className="h-full w-full object-cover"
                width={48}
                height={48}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-bold text-[16px] leading-6 ${COLORS.text}`}>{article.author}</span>
                {article.authorAffiliation?.trim() ? (
                  <span className={`text-[14px] leading-6 font-medium ${COLORS.textSecondary}`}>
                    {article.authorAffiliation.trim()}
                  </span>
                ) : null}
                {article.author_id != null && Number(article.author_id) > 0 ? (
                  <Link
                    href={`/article/editor?author_id=${encodeURIComponent(String(article.author_id))}`}
                    className={`text-[12px] ${COLORS.textSecondary} underline hover:no-underline`}
                  >
                    에디터의 글 더보기
                  </Link>
                ) : null}
              </div>
              <p className={`text-[14px] leading-5 ${COLORS.textSecondary} mt-0.5`}>
                {formatDate(article.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="p-1.5 rounded hover:bg-gray-100"
              aria-label="북마크"
              onClick={handleBookmarkClick}
            >
              <Bookmark
                className={`h-5 w-5 ${isBookmarked ? 'fill-[#0f172a] text-[#0f172a]' : 'text-[#0f172a]'}`}
              />
            </button>
            <button type="button" className="p-1.5 rounded hover:bg-gray-100" aria-label="공유" onClick={handleShareClick}>
              <Share2 className="h-5 w-5 text-[#0f172a]" />
            </button>
          </div>
        </div>
      </header>

      <div ref={contentRootRef} className="relative">
        <HighlightRenderer
          contentHtml={contentWithLineBreaks(article.content || '')}
          className={ARTICLE_DETAIL_PROSE_CLASS}
        />
        <HighlightButton
          contentRootRef={contentRootRef}
          onSave={async () => {
            if (!highlightContext) return
            const sel = typeof window !== 'undefined' ? window.getSelection() : null
            const root = contentRootRef.current?.firstElementChild as HTMLElement | null
            if (!sel || !root || !article?.id) return
            const payloads = selectionToPayloads(
              root,
              Number(article.id),
              sel,
              highlightContext.constants.colors[0] ?? 'yellow'
            )
            if (payloads.length) await highlightContext.create(payloads)
          }}
        />
      </div>

      {article.contentTruncated && !shareAsMember && (
        <div className="mt-4 mb-2 p-4 rounded-xl border border-amber-200 bg-amber-50/90 text-[14px] leading-snug text-[#0f172a]">
          미리보기만 표시 중입니다. 회원 로그인 시{' '}
          <span className="font-semibold">전체 본문</span>을 읽을 수 있습니다.{' '}
          <Link href="/login" className="font-bold text-[#0f172a] underline underline-offset-2">
            로그인
          </Link>
          후 페이지를 새로고침해 주세요.
        </div>
      )}

      {articleCopyright != null && (
        <section className="my-10 p-6 rounded-xl bg-blue-50/50 border-2 border-blue-200">
          <p className="font-bold text-[12px] text-[#0f172a] mb-2">
            {articleCopyright.title?.trim() || HOMEPAGE_DOC_DEFAULT_TITLES.article_copyright}
          </p>
          {(() => {
            const safeHtml = sanitizeHomepageHtml(articleCopyright.bodyHtml || '')
            return safeHtml.trim() ? (
              <div
                className="text-[12px] leading-[19.5px] text-[#475569] [&_p]:mb-2 [&_p:last-child]:mb-0 [&_a]:text-[#2563eb] [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: safeHtml }}
              />
            ) : null
          })()}
        </section>
      )}

      <section className={`${COLORS.accent} rounded-2xl p-8 flex flex-wrap items-center justify-between gap-4 mb-12`}>
        <div>
          <h3 className="font-black text-[24px] leading-8 text-black mb-1">인사이트 확장하기!</h3>
          <p className="text-[16px] text-black/70">24시간 공유 링크로 인사이트와 복음을 나눠보세요!</p>
        </div>
        <button
          type="button"
          className="bg-black text-white text-[16px] font-bold px-8 py-3 rounded-xl hover:opacity-90"
          onClick={handleShareClick}
        >
          링크 복사하기
        </button>
      </section>
      {shareToast && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#0f172a] text-white text-[14px] font-medium px-6 py-3 rounded-xl shadow-lg z-50"
          role="status"
        >
          링크가 복사되었습니다
        </div>
      )}

      <ArticleShareModal open={shareModalOpen} onClose={() => setShareModalOpen(false)} contentCode={id} />
      <ArticleEntitlementShareModal
        open={entitlementShareModalOpen}
        onClose={() => setEntitlementShareModalOpen(false)}
        contentCode={id}
        onCopied={() => {
          setShareToast(true)
          setTimeout(() => setShareToast(false), 2000)
        }}
      />
      <ArticleGuestShareModal
        open={guestShareModalOpen}
        onClose={() => setGuestShareModalOpen(false)}
        contentCode={id}
        onCopied={() => {
          setShareToast(true)
          setTimeout(() => setShareToast(false), 2000)
        }}
      />

      <section className={`${COLORS.bgLight} border ${COLORS.border} rounded-2xl p-8 mb-12`}>
        <h3 className={`font-bold text-[20px] ${COLORS.text} mb-6`}>적용 질문</h3>
        {submitError && (
          <p className="text-sm text-red-600 mb-4">{submitError}</p>
        )}
        <div className="space-y-6">
          {contentQuestions.length > 0 ? (
            contentQuestions.map((q, i) => (
              <div key={q.question_id}>
                <label className={`block font-semibold text-[14px] leading-5 ${COLORS.text} mb-2`}>
                  Q{i + 1}. {q.question_text}
                </label>
                <textarea
                  value={answers[q.question_id] ?? ''}
                  onChange={(e) => handleAnswerChange(q.question_id, e.target.value)}
                  placeholder="나만의 생각을 정리해보세요."
                  className="w-full min-h-[120px] p-4 rounded-xl border border-[#e2e8f0] bg-white text-[16px] text-gray-500 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  disabled={submitting === q.question_id || !(answers[q.question_id] ?? '').trim()}
                  onClick={() => handleSubmitAnswer(q)}
                  className="mt-2 bg-black text-white text-[14px] font-bold px-6 py-2 rounded-xl disabled:opacity-50"
                >
                  {submitting === q.question_id ? '저장 중...' : '저장하기'}
                </button>
              </div>
            ))
          ) : (
            <p className={`text-[14px] ${COLORS.textSecondary}`}>등록된 적용 질문이 없습니다.</p>
          )}
        </div>
        <div className="border-t border-[#e2e8f0] pt-10 mt-8 text-center">
          <p className={`font-bold text-[16px] ${COLORS.text} mb-3`}>콘텐츠가 도움이 되었나요?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="p-1 hover:opacity-70"
                aria-label={`${n}점`}
                onClick={() => handleRatingClick(n)}
              >
                <Star
                  className={`h-6 w-6 ${
                    ratingValue !== null && n <= ratingValue ? 'fill-amber-400 text-amber-400' : 'text-[#e2e8f0] hover:text-amber-400'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {detailBlocksLoading ? (
        <>
          <section className="pt-16 mb-12" aria-busy="true">
            <h2 className={`font-bold text-[24px] tracking-[-0.6px] ${COLORS.text} mb-8`}>관련 아티클</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/2] rounded-xl bg-[#e2e8f0] mb-4" />
                  <div className="h-4 w-4/5 bg-[#e2e8f0] rounded mb-2" />
                  <div className="h-3 w-1/2 bg-[#e2e8f0] rounded" />
                </div>
              ))}
            </div>
          </section>
          <section className="pt-16 mb-12" aria-busy="true">
            <h2 className={`font-bold text-[24px] tracking-[-0.6px] ${COLORS.text} mb-8`}>추천 아티클</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/2] rounded-xl bg-[#e2e8f0] mb-4" />
                  <div className="h-4 w-4/5 bg-[#e2e8f0] rounded mb-2" />
                  <div className="h-3 w-1/2 bg-[#e2e8f0] rounded" />
                </div>
              ))}
            </div>
          </section>
          <section className="pt-16 mb-12" aria-busy="true">
            <h2 className={`font-bold text-[24px] tracking-[-0.6px] ${COLORS.text} mb-8`}>주간 인기 콘텐츠</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/3] rounded-xl bg-[#e2e8f0] mb-4" />
                  <div className="h-4 w-4/5 bg-[#e2e8f0] rounded mb-2" />
                  <div className="h-3 w-1/2 bg-[#e2e8f0] rounded" />
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          {relatedArticles.length > 0 ? (
            <section className="pt-16 mb-12">
              <h2 className={`font-bold text-[24px] tracking-[-0.6px] ${COLORS.text} mb-8`}>관련 아티클</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {relatedArticles.map((item, i) => (
                  <DetailBottomArticleCard key={item.id} item={item} index={i} />
                ))}
              </div>
            </section>
          ) : null}

          {recommendedArticles.length > 0 ? (
            <section className="pt-16 mb-12">
              <h2 className={`font-bold text-[24px] tracking-[-0.6px] ${COLORS.text} mb-8`}>추천 아티클</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {recommendedArticles.map((item, i) => (
                  <DetailBottomArticleCard key={item.id} item={item} index={i} />
                ))}
              </div>
            </section>
          ) : null}

          {weeklyCards.length > 0 ? (
            <section className="pt-16 mb-12">
              <h2 className={`font-bold text-[24px] tracking-[-0.6px] ${COLORS.text} mb-8`}>주간 인기 콘텐츠</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {weeklyCards.map((item) => (
                  <DetailBottomWeeklyCard key={item.href} item={item} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}

export default function ArticleDetailContent(props: ArticleDetailContentProps) {
  return (
    <HighlightProvider articleId={props.id}>
      <ArticleDetailContentInner {...props} />
    </HighlightProvider>
  )
}
