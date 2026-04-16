'use client'

import { useState, useEffect, useCallback, useRef, useId } from 'react'
import Link from 'next/link'
import { ChevronRight, Bookmark, Share2, Search, Link2 } from 'lucide-react'
import { fetchArticleDetail, fetchArticleList, resolveArticlesByRanking } from '@/services/article'
import { fetchArticleRankingRecommended } from '@/services/libraryRanking'
import { fetchHomepageDocPublic } from '@/services/homepageDoc'
import { HOMEPAGE_DOC_DEFAULT_TITLES } from '@/constants/homepageDoc'
import { sanitizeHomepageHtml } from '@/lib/sanitizeHomepageHtml'
import type { HomepageDocPayload } from '@/types/homepageDoc'
import AppliedQuestionsSection from '@/components/content-detail/AppliedQuestionsSection'
import ArticleRatingCommentSection from '@/components/article/detail/ArticleRatingCommentSection'
import {
  postView,
  postBookmark,
  deleteBookmark,
  getMeRatings,
  getBookmarkStatus,
} from '@/services/libraryUseractivity'
import ArticleShareModal from '@/components/article/detail/ArticleShareModal'
import ArticleGuestShareModal from '@/components/article/detail/ArticleGuestShareModal'
import ArticleEntitlementShareModal from '@/components/article/detail/ArticleEntitlementShareModal'
import { useAuth } from '@/contexts/AuthContext'
import type { ArticleDetail, ArticleListItem } from '@/types/article'
import { getSysCodeName, getSysCodeFromCache } from '@/lib/syscode'
import { formatArticleTagLabel } from '@/lib/articleTags'
import { resolveArticleThumbnailUrl } from '@/lib/articleThumbnailUrl'
import { fetchWeeklyCrossRanking, resolveWeeklyCrossCards, type WeeklyCrossCardData } from '@/services/weeklyCrossRanking'
import { useLoginHref } from '@/hooks/useLoginHref'
import {
  HighlightProvider,
  useHighlight,
  HighlightRenderer,
  HighlightButton,
  HighlightMarkInteraction,
  payloadsFromRange,
} from '@/components/highlight'
import { getHighlightApiErrorMessage } from '@/services/highlight'

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

/** 말씀 돋보기 — 빈 줄로 구절 구분, 없으면 한 블록 */
function SermonHighlightVerses({ text }: { text: string }) {
  const blocks = text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  const bodyClass =
    'whitespace-pre-wrap break-words text-[16px] leading-7 text-[#475569]'
  if (blocks.length <= 1) {
    return (
      <p className={bodyClass}>{blocks[0] ?? text.trim()}</p>
    )
  }
  return (
    <div className="space-y-4">
      {blocks.map((para, i) => (
        <p key={i} className={bodyClass}>
          {para}
        </p>
      ))}
    </div>
  )
}

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
 * 본문 HTML을 상세에서 줄바꿈 문자가 보이도록 변환.
 * - \r\n, \r, \n → <br />
 * - TipTap 단락(`</p><p>`) 사이에는 추가 치환하지 않음 — 저장 HTML과 동일 구조 유지.
 */
function contentWithLineBreaks(html: string): string {
  if (!html || typeof html !== 'string') return html
  return html.replace(/\r\n|\r|\n/g, '<br />')
}

export interface ArticleDetailContentProps {
  id: string
  /** `/s/{code}` 만료 후 리다이렉트 시 안내 (contentShareLinkCopy.md §6) */
  shareExpired?: boolean
  /** `/s?code=` resolve 후 `/article/detail?...&from_share=1` — 공유 유입 문구·비회원 가입 CTA(전체 본문 열람 시에도) */
  fromShareLink?: boolean
}

const ARTICLE_DETAIL_PROSE_CLASS = `prose prose-lg max-w-none text-[18px] leading-[1.625] ${COLORS.text} py-4 [&_p]:!block [&_p:empty]:min-h-[1.5em] [&_p]:!mb-2 [&_br]:block [&_hr]:my-8 [&_hr]:block [&_hr]:w-full [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-solid [&_hr]:border-[#e2e8f0] [&_blockquote]:border-l-[5px] [&_blockquote]:border-l-[#03c75a] [&_blockquote]:py-3 [&_blockquote]:px-4 [&_blockquote]:my-5 [&_blockquote]:bg-[#f6fff8] [&_blockquote]:text-[#222] [&_blockquote]:text-[15px] [&_mark]:!bg-[#F8EDFF] [&_mark]:rounded [&_mark]:px-1 [&_mark]:py-0.5 [&_mark[data-highlight-id]]:cursor-pointer [&_img]:max-w-full [&_img]:h-auto [&_figure]:my-6 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-[#64748b]`

function DetailBottomWeeklyCard({ item }: { item: WeeklyCrossCardData }) {
  const grad = PLACEHOLDER_GRADIENTS[item.gradientIndex % PLACEHOLDER_GRADIENTS.length]
  const thumbSrc = item.thumbSrc
  const subtitleLine = item.line2?.trim() ?? ''
  return (
    <Link href={item.href} className="block group">
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
      <p className={`text-[16px] font-medium leading-6 text-[#202020] group-hover:underline line-clamp-2`}>
        {item.title}
      </p>
      {subtitleLine ? (
        <p className={`text-[14px] leading-5 ${COLORS.textSecondary} mt-1 line-clamp-2`}>{subtitleLine}</p>
      ) : null}
    </Link>
  )
}

function DetailBottomArticleCard({ item, index }: { item: ArticleListItem; index: number }) {
  const grad = PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length]
  const thumbSrc = resolveArticleThumbnailUrl(item.thumbnail)
  const subtitleLine = item.subtitle?.trim() ?? ''
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
      <p className={`text-[16px] font-medium leading-6 text-[#202020] group-hover:underline line-clamp-2`}>
        {item.title}
      </p>
      {subtitleLine ? (
        <p className={`text-[14px] leading-5 ${COLORS.textSecondary} mt-1 line-clamp-2`}>{subtitleLine}</p>
      ) : null}
    </Link>
  )
}

function ArticleDetailContentInner({ id, shareExpired, fromShareLink }: ArticleDetailContentProps) {
  const loginHref = useLoginHref()
  const { status } = useAuth()
  const authenticated = status === 'authenticated'
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkTooltip, setBookmarkTooltip] = useState<string | null>(null)
  const bookmarkTooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bookmarkTooltipId = useId()
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

  /** 재방문 시 북마크 아이콘 동기화 */
  useEffect(() => {
    if (!authenticated) {
      setIsBookmarked(false)
      return
    }
    if (!idValid || !article) return
    let cancelled = false
    ;(async () => {
      try {
        const bookmarked = await getBookmarkStatus('ARTICLE', id)
        if (!cancelled) setIsBookmarked(bookmarked)
      } catch {
        if (!cancelled) setIsBookmarked(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [authenticated, idValid, id, article?.id])

  const handleBookmarkClick = useCallback(async () => {
    if (!idValid || !article) return
    if (!authenticated) {
      showBookmarkTooltip('로그인 후 이용 가능합니다.')
      return
    }
    try {
      if (isBookmarked) {
        await deleteBookmark('ARTICLE', id)
        setIsBookmarked(false)
        showBookmarkTooltip('북마크가 해제되었습니다.')
      } else {
        await postBookmark('ARTICLE', id)
        setIsBookmarked(true)
        showBookmarkTooltip('북마크가 저장되었습니다.')
      }
    } catch {
      // ignore
    }
  }, [id, idValid, article, authenticated, isBookmarked, showBookmarkTooltip])

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

  useEffect(() => {
    if (!idValid || !authenticated) {
      setRatingValue(null)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const pageSize = 50
        let page = 1
        let matched: number | null = null

        while (page <= 20) {
          const result = await getMeRatings({
            page,
            page_size: pageSize,
            sort: 'regDateTime_desc',
          })
          const found = (result.list ?? []).find(
            (item) =>
              item.contentType === 'ARTICLE' &&
              String(item.contentCode) === id &&
              typeof item.ratingValue === 'number'
          )
          if (found) {
            matched = found.ratingValue ?? null
            break
          }
          if (!result.list?.length || page * pageSize >= (result.total ?? 0)) break
          page += 1
        }

        if (!cancelled) setRatingValue(matched)
      } catch {
        if (!cancelled) setRatingValue(null)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id, idValid, authenticated])

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
  /** 미리보기 본문 하단 페이드 — 실제로 잘렸을 때만 */
  const showPreviewFade = article.contentTruncated && !shareAsMember
  /**
   * 가입 유도 블록: 잘린 미리보기일 때 + 비회원이 공유 랜딩(`from_share=1`)으로 전체 본문을 읽는 경우에도 노출
   * (회원·`shareAsMember` 전제의 로그인 사용자에게는 비노출)
   */
  const showGuestSignupCta = !authenticatedMember && (showPreviewFade || fromShareLink)
  const sermonHighlightText = article.sermonHighlight?.trim() ?? ''

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
                className="p-1.5 rounded hover:bg-gray-100"
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
            <button type="button" className="p-1.5 rounded hover:bg-gray-100" aria-label="공유" onClick={handleShareClick}>
              <Share2 className="h-5 w-5 text-[#0f172a]" />
            </button>
          </div>
        </div>
      </header>

      <div ref={contentRootRef} className={`relative ${showPreviewFade ? 'overflow-hidden' : ''}`}>
        <HighlightRenderer
          contentHtml={contentWithLineBreaks(article.content || '')}
          className={ARTICLE_DETAIL_PROSE_CLASS}
        />
        <HighlightButton
          contentRootRef={contentRootRef}
          onSave={async (range: Range) => {
            if (!highlightContext) return
            const root = contentRootRef.current?.firstElementChild as HTMLElement | null
            if (!root || !article?.id) return
            let anchorRect: DOMRect | null = null
            try {
              anchorRect = range.getBoundingClientRect()
            } catch {
              anchorRect = null
            }
            const maxLen = highlightContext.constants.maxLength
            const rawLen = range.toString().length
            if (rawLen > maxLen) {
              highlightContext.showHighlightTooltip(`하이라이트는 ${maxLen}자 까지 가능합니다.`, anchorRect)
              return
            }
            const payloads = payloadsFromRange(
              root,
              Number(article.id),
              range,
              highlightContext.constants.colors[0] ?? 'yellow'
            )
            if (!payloads.length) {
              highlightContext.showHighlightTooltip(
                '하이라이트할 텍스트를 만들 수 없습니다. 문단을 다시 선택해 주세요.',
                anchorRect
              )
              return
            }
            for (const p of payloads) {
              if (p.highlightText.length > maxLen) {
                highlightContext.showHighlightTooltip(`하이라이트는 ${maxLen}자 까지 가능합니다.`, anchorRect)
                return
              }
            }
            try {
              await highlightContext.create(payloads)
              highlightContext.showHighlightTooltip(
                <>
                  하이라이트 되었습니다.
                  <br />
                  저장된 문장은 마이페이지에서도 확인이 가능합니다.
                </>,
                anchorRect
              )
            } catch (e) {
              highlightContext.showHighlightTooltip(getHighlightApiErrorMessage(e), anchorRect)
            }
          }}
        />
        <HighlightMarkInteraction contentRootRef={contentRootRef} />
        {showPreviewFade ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/80 to-transparent"
          />
        ) : null}
      </div>

      {sermonHighlightText ? (
        <section className="mt-8" aria-labelledby="sermon-highlight-heading">
          <div className="mb-4 flex items-center gap-2">
            <Search
              className="h-5 w-5 shrink-0 text-[#e1f800]"
              strokeWidth={2.25}
              aria-hidden
            />
            <h2
              id="sermon-highlight-heading"
              className="text-[15px] font-bold leading-tight text-[#0f172a]"
            >
              말씀 돋보기
            </h2>
          </div>
          <div className="border-l-4 border-[#e1f800] pl-5">
            <SermonHighlightVerses text={sermonHighlightText} />
          </div>
        </section>
      ) : null}

      {showGuestSignupCta ? (
        <section className="mt-8 mb-2 border-t border-[#e2e8f0] pt-10 text-center">
          <p className="text-[18px] sm:text-[19px] leading-[1.45] font-bold tracking-[-0.015em] text-[#0f172a]">
            {fromShareLink ? (
              <>
                다른 콘텐츠가 궁금하신가요?
                <br />
                지금 인디에 가입하시고 콘텐츠를 무료로 읽어보세요.
              </>
            ) : (
              <>
                지금 인디에 가입하시고
                <br />
                이 글을 무료로 읽어보세요.
              </>
            )}
          </p>
          <div className="mt-6 mx-auto w-full max-w-[480px] space-y-2.5">
            <Link
              href="/register"
              className="flex h-12 w-full items-center justify-center rounded-lg border border-[#d1d5db] bg-white text-[15px] font-bold text-[#111827] transition hover:bg-[#f8fafc]"
            >
              무료 계정 만들기
            </Link>
            <Link
              href="/register"
              className="flex h-12 w-full items-center justify-center rounded-lg bg-[#fee500] text-[15px] font-bold text-[#111827] transition hover:brightness-95"
            >
              카카오로 무료 계정 만들기
            </Link>
          </div>
          <p className={`mt-6 text-[14px] leading-6 ${COLORS.textSecondary}`}>
            이미 계정이 있으신가요?{' '}
            <Link href={loginHref} className={`font-semibold ${COLORS.text} underline underline-offset-2`}>
              로그인하기
            </Link>
          </p>
        </section>
      ) : null}

      {articleCopyright != null && (
        <section className="my-10">
          {(() => {
            const safeHtml = sanitizeHomepageHtml(articleCopyright.bodyHtml || '')
            if (!safeHtml.trim()) return null
            return (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-5">
                <span className="shrink-0 text-[15px] font-bold leading-snug text-[#0f172a]">
                  {articleCopyright.title?.trim() || HOMEPAGE_DOC_DEFAULT_TITLES.article_copyright}
                </span>
                <div
                  className="min-w-0 flex-1 text-[12px] leading-[1.65] text-[#64748b] [&_p]:mb-2 [&_p:last-child]:mb-0 [&_a]:text-[#2563eb] [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: safeHtml }}
                />
              </div>
            )
          })()}
        </section>
      )}

      <section className={`${COLORS.accent} mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-8`}>
        <div>
          <h3 className="font-black text-[24px] leading-8 text-black mb-1">인사이트 확장하기!</h3>
          <p className="text-[16px] text-black/70">24시간 공유 링크로 인사이트와 복음을 나눠보세요!</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 bg-black text-white text-[16px] font-bold px-8 py-3 rounded-full hover:opacity-90"
          onClick={handleShareClick}
        >
          <Link2 className="h-5 w-5 shrink-0 text-white" strokeWidth={2.25} aria-hidden />
          링크 복사하기
        </button>
      </section>
      {shareToast && (
        <div
          className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#0f172a] px-6 py-3 text-[14px] font-medium text-white shadow-lg"
          role="status"
        >
          복사 되었습니다.
        </div>
      )}

      <ArticleShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        contentCode={id}
        onCopied={() => {
          setShareToast(true)
          setTimeout(() => setShareToast(false), 2000)
        }}
      />
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

      <AppliedQuestionsSection contentType="ARTICLE" contentId={article.id} className="mb-0" />

      <ArticleRatingCommentSection
        className="mb-0 mt-5"
        contentCode={id}
        articleId={article.id}
        allowComment={Boolean((article as unknown as { allowComment?: boolean }).allowComment)}
        ratingValue={ratingValue}
        setRatingValue={setRatingValue}
      />

      {detailBlocksLoading ? (
        <>
          <section className="mt-10 mb-12" aria-busy="true">
            <h2 className={`mb-[22px] font-bold text-[24px] tracking-[-0.6px] ${COLORS.text}`}>관련 아티클</h2>
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
          <section className="mt-10 mb-12" aria-busy="true">
            <h2 className={`mb-[22px] font-bold text-[24px] tracking-[-0.6px] ${COLORS.text}`}>추천 아티클</h2>
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
          <section className="mt-10 mb-12" aria-busy="true">
            <h2 className={`mb-[22px] font-bold text-[24px] tracking-[-0.6px] ${COLORS.text}`}>주간 인기 콘텐츠</h2>
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
            <section className="mt-10 mb-12">
              <h2 className={`mb-[22px] font-bold text-[24px] tracking-[-0.6px] ${COLORS.text}`}>관련 아티클</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {relatedArticles.map((item, i) => (
                  <DetailBottomArticleCard key={item.id} item={item} index={i} />
                ))}
              </div>
            </section>
          ) : null}

          {recommendedArticles.length > 0 ? (
            <section className="mt-10 mb-12">
              <h2 className={`mb-[22px] font-bold text-[24px] tracking-[-0.6px] ${COLORS.text}`}>추천 아티클</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {recommendedArticles.map((item, i) => (
                  <DetailBottomArticleCard key={item.id} item={item} index={i} />
                ))}
              </div>
            </section>
          ) : null}

          {weeklyCards.length > 0 ? (
            <section className="mt-10 mb-12">
              <h2 className={`mb-[22px] font-bold text-[24px] tracking-[-0.6px] ${COLORS.text}`}>주간 인기 콘텐츠</h2>
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
