'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchContentQuestions,
  fetchMyContentAnswers,
  submitQuestionAnswer,
  updateQuestionAnswer,
  deleteQuestionAnswer,
  type ContentQuestionItem,
  type ContentType,
} from '@/services/contentQuestion'

const COLORS = {
  text: 'text-[#0f172a]',
  textSecondary: 'text-[#64748b]',
  border: 'border-[#e2e8f0]',
  bgLight: 'bg-[#f8fafc]',
} as const

export interface AppliedQuestionsSectionProps {
  /** `content_question` API — `ARTICLE` / `VIDEO` / `SEMINAR` */
  contentType: ContentType
  contentId: number
  /** 섹션 래퍼 추가 클래스 (예: `mb-12`) */
  className?: string
  /** 하단 「콘텐츠가 도움이 되었나요?」·별점 등 — `border-t` 는 보통 여기서 처리 */
  children?: ReactNode
}

/**
 * 아티클·비디오·세미나 상세 공통 — 적용 질문 API + 읽기/수정/삭제 UX (`article/detail.md` §4.6)
 */
export default function AppliedQuestionsSection({
  contentType,
  contentId,
  className = '',
  children,
}: AppliedQuestionsSectionProps) {
  const { status } = useAuth()
  const authLoading = status === 'loading'
  const authenticated = status === 'authenticated'

  const [contentQuestions, setContentQuestions] = useState<ContentQuestionItem[]>([])
  const [savedAnswers, setSavedAnswers] = useState<Record<number, { answer_id: number; answer_text: string }>>({})
  const [draftAnswers, setDraftAnswers] = useState<Record<number, string>>({})
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null)
  const [answersLoading, setAnswersLoading] = useState(false)
  const [submitting, setSubmitting] = useState<number | null>(null)
  const [deletingAnswerId, setDeletingAnswerId] = useState<number | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!contentId) return
    let cancelled = false
    fetchContentQuestions(contentType, contentId)
      .then((list) => {
        if (!cancelled) setContentQuestions(list)
      })
      .catch(() => {
        if (!cancelled) setContentQuestions([])
      })
    return () => {
      cancelled = true
    }
  }, [contentType, contentId])

  useEffect(() => {
    setEditingQuestionId(null)
    setDraftAnswers({})
  }, [contentType, contentId])

  useEffect(() => {
    if (!contentId) return
    if (!authenticated) {
      setSavedAnswers({})
      setAnswersLoading(false)
      return
    }
    let cancelled = false
    setAnswersLoading(true)
    fetchMyContentAnswers(contentType, contentId)
      .then((list) => {
        if (cancelled) return
        const map: Record<number, { answer_id: number; answer_text: string }> = {}
        for (const a of list) {
          map[a.question_id] = { answer_id: a.answer_id, answer_text: a.answer_text }
        }
        setSavedAnswers(map)
      })
      .catch(() => {
        if (!cancelled) setSavedAnswers({})
      })
      .finally(() => {
        if (!cancelled) setAnswersLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [contentType, contentId, authenticated])

  const extractApiMessage = useCallback((e: unknown): string | null => {
    if (e && typeof e === 'object' && 'response' in e) {
      return (e as { response?: { data?: { IndeAPIResponse?: { Message?: string } } } }).response?.data?.IndeAPIResponse?.Message ?? null
    }
    return null
  }, [])

  const handleDraftChange = useCallback((questionId: number, value: string) => {
    setDraftAnswers((prev) => ({ ...prev, [questionId]: value }))
    setSubmitError(null)
  }, [])

  const handleSubmitNew = useCallback(
    async (q: ContentQuestionItem) => {
      if (!authenticated) return
      const text = (draftAnswers[q.question_id] ?? '').trim()
      if (!text) return
      setSubmitting(q.question_id)
      setSubmitError(null)
      try {
        const res = await submitQuestionAnswer({
          question_id: q.question_id,
          content_type: contentType,
          content_id: contentId,
          answer_text: text,
        })
        setSavedAnswers((prev) => ({
          ...prev,
          [q.question_id]: { answer_id: res.answer_id, answer_text: text },
        }))
        setDraftAnswers((prev) => {
          const next = { ...prev }
          delete next[q.question_id]
          return next
        })
      } catch (e: unknown) {
        setSubmitError(extractApiMessage(e) || '답변 등록에 실패했습니다. 로그인 후 다시 시도해 주세요.')
      } finally {
        setSubmitting(null)
      }
    },
    [authenticated, contentType, contentId, draftAnswers, extractApiMessage]
  )

  const handleStartEdit = useCallback(
    (q: ContentQuestionItem) => {
      const s = savedAnswers[q.question_id]
      if (!s) return
      setEditingQuestionId(q.question_id)
      setDraftAnswers((prev) => ({ ...prev, [q.question_id]: s.answer_text }))
      setSubmitError(null)
    },
    [savedAnswers]
  )

  const handleCancelEdit = useCallback((q: ContentQuestionItem) => {
    setEditingQuestionId(null)
    setDraftAnswers((prev) => {
      const next = { ...prev }
      delete next[q.question_id]
      return next
    })
    setSubmitError(null)
  }, [])

  const handleSaveEdit = useCallback(
    async (q: ContentQuestionItem) => {
      const s = savedAnswers[q.question_id]
      if (!s) return
      const text = (draftAnswers[q.question_id] ?? '').trim()
      if (!text) return
      setSubmitting(q.question_id)
      setSubmitError(null)
      try {
        await updateQuestionAnswer(s.answer_id, { answer_text: text })
        setSavedAnswers((prev) => ({
          ...prev,
          [q.question_id]: { answer_id: s.answer_id, answer_text: text },
        }))
        setEditingQuestionId(null)
        setDraftAnswers((prev) => {
          const next = { ...prev }
          delete next[q.question_id]
          return next
        })
      } catch (e: unknown) {
        setSubmitError(extractApiMessage(e) || '답변 수정에 실패했습니다.')
      } finally {
        setSubmitting(null)
      }
    },
    [savedAnswers, draftAnswers, extractApiMessage]
  )

  const handleDeleteAnswer = useCallback(
    async (q: ContentQuestionItem) => {
      const s = savedAnswers[q.question_id]
      if (!s) return
      if (!window.confirm('이 답변을 삭제하시겠습니까?')) return
      setDeletingAnswerId(s.answer_id)
      setSubmitError(null)
      try {
        await deleteQuestionAnswer(s.answer_id)
        setSavedAnswers((prev) => {
          const next = { ...prev }
          delete next[q.question_id]
          return next
        })
        setEditingQuestionId((cur) => (cur === q.question_id ? null : cur))
        setDraftAnswers((prev) => {
          const next = { ...prev }
          delete next[q.question_id]
          return next
        })
      } catch (e: unknown) {
        setSubmitError(extractApiMessage(e) || '답변 삭제에 실패했습니다.')
      } finally {
        setDeletingAnswerId(null)
      }
    },
    [savedAnswers, extractApiMessage]
  )

  return (
    <section className={`${COLORS.bgLight} border ${COLORS.border} rounded-2xl p-8 ${className}`.trim()}>
      <h3 className={`font-bold text-[20px] ${COLORS.text} mb-6`}>적용 질문</h3>
      {submitError && <p className="mb-4 text-sm text-red-600">{submitError}</p>}
      <div className="space-y-6">
        {contentQuestions.length > 0 ? (
          contentQuestions.map((q, i) => {
            const saved = savedAnswers[q.question_id]
            const isEditing = editingQuestionId === q.question_id
            const draft = draftAnswers[q.question_id] ?? ''
            const showReadOnly = authenticated && !authLoading && !answersLoading && !!saved && !isEditing
            const showComposer = authenticated && !authLoading && !answersLoading && (!saved || isEditing)

            return (
              <div key={q.question_id}>
                <label className={`mb-2 block text-[14px] font-semibold leading-5 ${COLORS.text}`}>
                  Q{i + 1}. {q.question_text}
                </label>

                {authLoading && <p className={`text-[14px] ${COLORS.textSecondary}`}>로그인 상태 확인 중...</p>}

                {!authLoading && !authenticated && (
                  <p className={`text-[14px] ${COLORS.textSecondary}`}>
                    답변을 작성하려면{' '}
                    <Link href="/login" className="font-semibold text-[#0f172a] underline underline-offset-2">
                      로그인
                    </Link>
                    이 필요합니다.
                  </p>
                )}

                {!authLoading && authenticated && answersLoading && (
                  <p className={`text-[14px] ${COLORS.textSecondary}`}>내 답변을 불러오는 중...</p>
                )}

                {showReadOnly && saved && (
                  <div className="flex flex-row items-center gap-3 sm:gap-4">
                    <p
                      className={`min-w-0 flex-1 whitespace-pre-wrap break-words text-[16px] leading-relaxed ${COLORS.text}`}
                    >
                      {saved.answer_text}
                    </p>
                    <div
                      className="flex shrink-0 flex-row items-center gap-0.5 rounded-lg bg-white/90 p-0.5 shadow-sm ring-1 ring-slate-200/80"
                      role="group"
                      aria-label="답변 작업"
                    >
                      <button
                        type="button"
                        aria-label="답변 수정"
                        disabled={deletingAnswerId !== null || submitting !== null}
                        onClick={() => handleStartEdit(q)}
                        className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                      >
                        <Pencil className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label="답변 삭제"
                        disabled={deletingAnswerId !== null || submitting !== null}
                        onClick={() => void handleDeleteAnswer(q)}
                        className="rounded-md p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingAnswerId === saved.answer_id ? (
                          <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden />
                        ) : (
                          <Trash2 className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {showComposer && (
                  <>
                    <textarea
                      value={draft}
                      onChange={(e) => handleDraftChange(q.question_id, e.target.value)}
                      placeholder="나만의 생각을 정리해보세요."
                      className="w-full min-h-[120px] rounded-xl border border-[#e2e8f0] bg-white p-4 text-[16px] text-[#0f172a] placeholder:text-gray-400"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            disabled={submitting === q.question_id || !draft.trim()}
                            onClick={() => void handleSaveEdit(q)}
                            className="rounded-xl bg-black px-6 py-2 text-[14px] font-bold text-white disabled:opacity-50"
                          >
                            {submitting === q.question_id ? '저장 중...' : '저장하기'}
                          </button>
                          <button
                            type="button"
                            disabled={submitting === q.question_id}
                            onClick={() => handleCancelEdit(q)}
                            className="rounded-xl border border-[#e2e8f0] bg-white px-6 py-2 text-[14px] font-bold text-[#0f172a] disabled:opacity-50"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={submitting === q.question_id || !draft.trim()}
                          onClick={() => void handleSubmitNew(q)}
                          className="rounded-xl bg-black px-6 py-2 text-[14px] font-bold text-white disabled:opacity-50"
                        >
                          {submitting === q.question_id ? '저장 중...' : '저장하기'}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })
        ) : (
          <p className={`text-[14px] ${COLORS.textSecondary}`}>등록된 적용 질문이 없습니다.</p>
        )}
      </div>
      {children}
    </section>
  )
}
