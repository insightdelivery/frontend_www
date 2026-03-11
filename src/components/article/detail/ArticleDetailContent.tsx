'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Bookmark, Share2, Star } from 'lucide-react'
import { fetchArticleDetail } from '@/services/article'
import { fetchContentQuestions, submitQuestionAnswer, type ContentQuestionItem } from '@/services/contentQuestion'
import type { ArticleDetail } from '@/types/article'
import { getSysCodeName, getSysCodeFromCache } from '@/lib/syscode'

const CONTENT_MAX = 'max-w-[1220px] mx-auto'
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

const RELATED = [
  { id: '1', title: '독립 서점에서 발견한 나만의 취향', editor: '이성민 에디터', imageGradient: 'bg-gradient-to-br from-emerald-200 to-emerald-600' },
  { id: '2', title: '성장을 위한 기록의 기술', editor: '박지수 에디터', imageGradient: 'bg-gradient-to-br from-sky-200 to-sky-600' },
  { id: '3', title: '함께 읽고 토론하는 커뮤니티의 힘', editor: '김현아 에디터', imageGradient: 'bg-gradient-to-br from-violet-200 to-violet-600' },
]

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
}

function ArticleDetailContent({ id }: ArticleDetailContentProps) {
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contentQuestions, setContentQuestions] = useState<ContentQuestionItem[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState<number | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchArticleDetail(id)
      .then((data) => {
        if (!cancelled) setArticle(data)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '아티클을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

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

  if (loading) {
    return (
      <div className={`${CONTENT_MAX} px-4 sm:px-6 md:px-[54px] pt-6 pb-20 flex items-center justify-center min-h-[320px]`}>
        <p className={COLORS.textSecondary}>로딩 중...</p>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className={`${CONTENT_MAX} px-4 sm:px-6 md:px-[54px] pt-6 pb-20`}>
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
  const displayTags = Array.isArray(article.tags) ? article.tags : []

  return (
    <div className={`${CONTENT_MAX} px-4 sm:px-6 md:px-[54px] pt-6 pb-20`}>
      <nav className="flex items-center gap-2 mb-6" aria-label="Breadcrumb">
        <Link href="/article" className={`text-[14px] leading-5 ${COLORS.textSecondary} hover:underline`}>
          아티클
        </Link>
        <ChevronRight className="h-5 w-4 text-[#64748b] flex-shrink-0" aria-hidden />
        <span className={`text-[14px] leading-5 font-semibold ${COLORS.text}`}>{categoryLabel}</span>
      </nav>

      <header className="mb-8">
        <h1 className={`font-extrabold text-[32px] sm:text-[40px] md:text-[48px] leading-[1.1] tracking-[-0.025em] ${COLORS.text} mb-4`}>
          {article.title}
        </h1>
        {article.subtitle ? (
          <p className={`text-[18px] sm:text-[20px] leading-[1.4] ${COLORS.textSecondary} mb-4`}>{article.subtitle}</p>
        ) : null}
        <div className="flex flex-wrap gap-2 mb-6">
          {displayTags.map((tag) => (
            <span
              key={tag}
              className="bg-[#e2e8f0] text-[12px] font-medium text-[#0f172a] px-3 py-1 rounded-full"
            >
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
        <div className={`flex items-center justify-between py-[25px] border-t border-b ${COLORS.border}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#cbd5e1] overflow-hidden flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-bold text-[16px] leading-6 ${COLORS.text}`}>{article.author}</span>
                <button type="button" className={`text-[12px] ${COLORS.textSecondary} underline hover:no-underline`}>
                  에디터의 글 더보기
                </button>
              </div>
              <p className={`text-[14px] leading-5 ${COLORS.textSecondary} mt-0.5`}>
                {article.authorAffiliation ? `${article.authorAffiliation} · ` : ''}{formatDate(article.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" className="p-1.5 rounded hover:bg-gray-100" aria-label="북마크">
              <Bookmark className="h-5 w-5 text-[#0f172a]" />
            </button>
            <button type="button" className="p-1.5 rounded hover:bg-gray-100" aria-label="공유">
              <Share2 className="h-5 w-5 text-[#0f172a]" />
            </button>
          </div>
        </div>
      </header>

      {article.thumbnail ? (
        <div className="aspect-[4/3] rounded-[12px] overflow-hidden mb-10 relative bg-[#e2e8f0]">
          <Image
            src={article.thumbnail}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1220px) 100vw, 1220px"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] rounded-[12px] overflow-hidden bg-gradient-to-br from-slate-200 to-slate-500 mb-10" />
      )}

      <div
        className={`prose prose-lg max-w-none text-[18px] leading-[1.625] ${COLORS.text} py-4 [&_p]:!block [&_p]:!mb-2 [&_br]:block`}
        style={{ whiteSpace: 'pre-wrap' } as React.CSSProperties}
        dangerouslySetInnerHTML={{
          __html: contentWithLineBreaks(article.content || ''),
        }}
      />

      <section className="my-10 p-6 rounded-xl bg-blue-50/50 border-2 border-blue-200">
        <p className="font-bold text-[12px] text-[#0f172a] mb-1">© InDe Content Policy</p>
        <p className="text-[12px] leading-[19.5px] text-[#475569]">
          본 콘텐츠는 인디가 제작한 고유한 자산으로 무단 전재 및 재배포, AI 학습·활용을 금합니다. 원문의 20% 이상 인용할 수 없으며, 일부 인용한 경우 반드시 출처를 표기해야 합니다.
        </p>
      </section>

      <section className={`${COLORS.accent} rounded-2xl p-8 flex flex-wrap items-center justify-between gap-4 mb-12`}>
        <div>
          <h3 className="font-black text-[24px] leading-8 text-black mb-1">인사이트 확장하기!</h3>
          <p className="text-[16px] text-black/70">24시간 공유 링크로 인사이트와 복음을 나눠보세요!</p>
        </div>
        <button type="button" className="bg-black text-white text-[16px] font-bold px-8 py-3 rounded-xl hover:opacity-90">
          링크 복사하기
        </button>
      </section>

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
              <button key={n} type="button" className="p-1 hover:opacity-70" aria-label={`${n}점`}>
                <Star className="h-6 w-6 text-[#e2e8f0] hover:text-amber-400" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-16 mb-12">
        <h2 className={`font-bold text-[24px] tracking-[-0.6px] ${COLORS.text} mb-8`}>관련 아티클</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {RELATED.map((item) => (
            <Link key={item.id} href={detailUrl(item.id)} className="block group">
              <div className={`aspect-[4/3] rounded-xl overflow-hidden ${item.imageGradient} mb-4`} />
              <p className={`font-bold text-[16px] leading-6 ${COLORS.text} group-hover:underline line-clamp-2`}>
                {item.title}
              </p>
              <p className={`text-[14px] leading-5 ${COLORS.textSecondary} mt-1`}>{item.editor}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="pt-16 mb-12">
        <div className="flex items-center gap-2 mb-8">
          <h2 className={`font-bold text-[24px] tracking-[-0.6px] ${COLORS.text}`}>추천 아티클</h2>
          <span className="bg-[#e1f800] text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
            Editor&apos;s Pick
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {RELATED.map((item) => (
            <Link key={item.id} href={detailUrl(item.id)} className="block group">
              <div className={`aspect-[4/3] rounded-xl border border-slate-100 overflow-hidden ${item.imageGradient} mb-4`} />
              <p className={`font-bold text-[16px] leading-6 ${COLORS.text} group-hover:underline line-clamp-2`}>
                {item.title}
              </p>
              <p className={`text-[14px] leading-5 ${COLORS.textSecondary} mt-1`}>{item.editor}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="pt-16">
        <h2 className={`font-bold text-[24px] tracking-[-0.6px] ${COLORS.text} mb-8`}>주간 인기 콘텐츠</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {RELATED.map((item) => (
            <Link key={item.id} href={detailUrl(item.id)} className="block group">
              <div className={`aspect-[4/3] rounded-xl overflow-hidden ${item.imageGradient} mb-4`} />
              <p className={`font-bold text-[16px] leading-6 ${COLORS.text} group-hover:underline line-clamp-2`}>
                {item.title}
              </p>
              <p className={`text-[14px] leading-5 ${COLORS.textSecondary} mt-1`}>{item.editor}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

export default ArticleDetailContent
