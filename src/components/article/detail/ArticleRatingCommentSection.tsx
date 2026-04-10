'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CornerDownRight, MessageCircle, MoreVertical, Star } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  createComment,
  deleteComment,
  fetchComments,
  updateComment,
  type CommentContentType,
  type CommentItem,
} from '@/services/comments'
import { postRating } from '@/services/libraryUseractivity'

const COLORS = {
  text: 'text-[#0f172a]',
  textSecondary: 'text-[#64748b]',
  border: 'border-[#e2e8f0]',
  bgLight: 'bg-[#f8fafc]',
} as const

const COMMENT_MAX_LENGTH = 500

function formatCommentListDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}.${m}.${day} ${hh}:${mm}`
}

function StarRowDisplay({ value }: { value: number | null | undefined }) {
  const n = typeof value === 'number' && value >= 1 && value <= 5 ? value : 0
  if (n <= 0) return null
  return (
    <div className="flex items-center gap-0.5" aria-label={`별점 ${n}점`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= n ? 'fill-[#333333] text-[#333333]' : 'fill-none stroke-[#cbd5e1] text-[#cbd5e1]'
          }`}
          strokeWidth={i <= n ? 0 : 1.5}
          aria-hidden
        />
      ))}
    </div>
  )
}

export interface ArticleRatingCommentSectionProps {
  contentCode: string
  /** 콘텐츠 PK (아티클·비디오·세미나 공통) */
  articleId: number
  /** 기본값 `ARTICLE` — 비디오/세미나 상세에서 `VIDEO` / `SEMINAR` 전달 */
  contentType?: CommentContentType
  allowComment: boolean
  ratingValue: number | null
  setRatingValue: (v: number | null) => void
  className?: string
}

/**
 * 아티클·비디오·세미나 상세 공통 — 별점 + 댓글을 한 블록에 두고, 목록에는 작성자의 *현재* 콘텐츠 별점을 표시 (detail.md §4.9)
 */
export default function ArticleRatingCommentSection({
  contentCode,
  articleId,
  contentType = 'ARTICLE',
  allowComment,
  ratingValue,
  setRatingValue,
  className = '',
}: ArticleRatingCommentSectionProps) {
  const { status } = useAuth()
  const authenticated = status === 'authenticated'

  const [items, setItems] = useState<CommentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [draftStars, setDraftStars] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [menuOpenId, setMenuOpenId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')

  useEffect(() => {
    setDraftStars(ratingValue ?? null)
  }, [ratingValue, articleId])

  const total = useMemo(() => {
    let n = 0
    for (const c of items) {
      n += 1
      n += c.replies?.length ?? 0
    }
    return n
  }, [items])

  const load = useCallback(async () => {
    if (!allowComment) {
      setItems([])
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetchComments({ contentType, contentId: articleId })
      setItems(res.list ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '댓글을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [allowComment, articleId, contentType])

  useEffect(() => {
    void load()
    setMenuOpenId(null)
    setEditingId(null)
    setEditingText('')
  }, [load])

  const canSave =
    authenticated &&
    ((draftStars !== null && draftStars >= 1 && draftStars <= 5) || (allowComment && text.trim().length > 0))

  const handleSave = useCallback(async () => {
    if (!authenticated || !canSave) return
    setSubmitting(true)
    setError(null)
    try {
      if (draftStars !== null && draftStars >= 1 && draftStars <= 5) {
        await postRating(contentType, contentCode, draftStars)
        setRatingValue(draftStars)
      }
      const t = text.trim()
      if (allowComment && t) {
        await createComment({ contentType, contentId: articleId, commentText: t })
        setText('')
      }
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }, [authenticated, canSave, draftStars, text, allowComment, contentType, contentCode, articleId, load, setRatingValue])

  const startEdit = useCallback((id: number, current: string) => {
    setEditingId(id)
    setEditingText(current)
    setMenuOpenId(null)
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditingText('')
  }, [])

  const saveEdit = useCallback(async () => {
    if (!editingId) return
    const t = editingText.trim()
    if (!t) return
    try {
      await updateComment({ commentId: editingId, commentText: t })
      cancelEdit()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '댓글 수정에 실패했습니다.')
    }
  }, [editingId, editingText, cancelEdit, load])

  const handleDelete = useCallback(
    async (commentId: number) => {
      if (!confirm('이 댓글을 삭제하시겠습니까?')) return
      try {
        await deleteComment(commentId)
        setMenuOpenId(null)
        if (editingId === commentId) cancelEdit()
        await load()
      } catch (e) {
        setError(e instanceof Error ? e.message : '댓글 삭제에 실패했습니다.')
      }
    },
    [load, editingId, cancelEdit]
  )

  const starsDisabled = !authenticated

  return (
    <section className={`${COLORS.bgLight} rounded-2xl border ${COLORS.border} p-8 ${className}`.trim()}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className={`h-6 w-6 shrink-0 ${COLORS.textSecondary}`} strokeWidth={2} aria-hidden />
          <h2 className={`text-[18px] font-bold ${COLORS.text}`}>이 콘텐츠가 어떠셨나요?</h2>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-xl bg-[#d4d4d8] px-3 py-2 sm:pl-4">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = draftStars !== null && n <= draftStars
            return (
              <button
                key={n}
                type="button"
                disabled={starsDisabled}
                aria-label={`${n}점`}
                aria-pressed={active}
                onClick={() => {
                  if (!authenticated) return
                  setDraftStars(n)
                }}
                className="rounded p-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Star
                  className={`h-7 w-7 ${
                    active ? 'fill-[#333333] text-[#333333]' : 'fill-none stroke-2 stroke-white text-white'
                  }`}
                  strokeWidth={active ? 0 : 2}
                />
              </button>
            )
          })}
        </div>
      </div>

      {authenticated ? (
        <>
          {allowComment ? (
            <div className="mb-8 rounded-xl border border-[#e2e8f0] bg-white p-4">
              <textarea
                value={text}
                maxLength={COMMENT_MAX_LENGTH}
                onChange={(e) => setText(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
                placeholder="댓글을 남겨주세요. (선택사항)"
                className={`min-h-[120px] w-full resize-none bg-transparent text-[15px] leading-6 ${COLORS.text} outline-none placeholder:text-slate-400`}
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  disabled={submitting || !canSave}
                  onClick={() => void handleSave()}
                  className="rounded-xl bg-[#1e293b] px-8 py-2.5 text-[15px] font-bold text-white disabled:opacity-50"
                >
                  {submitting ? '저장 중...' : '저장하기'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 flex flex-col items-end gap-2">
              <p className={`w-full text-[13px] ${COLORS.textSecondary}`}>이 콘텐츠는 댓글이 비활성화되어 있습니다. 별점만 남길 수 있습니다.</p>
              <button
                type="button"
                disabled={submitting || !canSave}
                onClick={() => void handleSave()}
                className="rounded-xl bg-[#1e293b] px-8 py-2.5 text-[15px] font-bold text-white disabled:opacity-50"
              >
                {submitting ? '저장 중...' : '저장하기'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={`mb-8 rounded-xl border ${COLORS.border} bg-white/80 p-4`}>
          <p className={`text-[14px] ${COLORS.textSecondary}`}>별점·댓글은 로그인 후 이용할 수 있습니다.</p>
        </div>
      )}

      {allowComment ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h3 className={`text-[16px] font-bold ${COLORS.text}`}>댓글 {total}개</h3>
          </div>

          {error ? <p className="mb-4 text-[14px] text-red-600">{error}</p> : null}
          {loading ? <p className={`mb-4 text-[14px] ${COLORS.textSecondary}`}>댓글을 불러오는 중...</p> : null}

          <div className="flex flex-col gap-4">
            {items.map((c) => (
              <div key={c.id} className="rounded-xl border border-[#e8ecf0] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className={`text-[15px] font-bold ${COLORS.text}`}>{c.user?.nickname ?? '—'}</p>
                  <StarRowDisplay value={c.rating_for_content} />
                  {c.created_at ? (
                    <span className={`text-[13px] ${COLORS.textSecondary}`}>{formatCommentListDate(c.created_at)}</span>
                  ) : null}
                </div>

                {editingId === c.id ? (
                  <div className="mt-3">
                    <textarea
                      value={editingText}
                      maxLength={COMMENT_MAX_LENGTH}
                      onChange={(e) => setEditingText(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
                      className={`min-h-[90px] w-full resize-none rounded-lg border ${COLORS.border} bg-[#f8fafc] p-3 text-[14px] leading-6 ${COLORS.text} outline-none`}
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button type="button" onClick={cancelEdit} className="px-3 py-2 text-[14px] font-medium text-[#475569]">
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => void saveEdit()}
                        className="rounded-lg bg-[#0f172a] px-4 py-2 text-[14px] font-semibold text-white"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className={`mt-3 whitespace-pre-wrap break-words text-[15px] leading-7 ${COLORS.text}`}>{c.text}</p>
                )}
              </div>

              {(c.can_edit || c.can_delete) && editingId !== c.id ? (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    aria-label="더보기"
                    className="rounded-md p-2 hover:bg-slate-100"
                    onClick={() => setMenuOpenId((prev) => (prev === c.id ? null : c.id))}
                  >
                    <MoreVertical className="h-5 w-5 text-[#475569]" />
                  </button>
                  {menuOpenId === c.id ? (
                    <div className="absolute right-0 z-10 mt-2 w-28 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                      {c.can_edit ? (
                        <button
                          type="button"
                          className="block w-full px-3 py-2 text-left text-[14px] hover:bg-slate-50"
                          onClick={() => startEdit(c.id, c.text)}
                        >
                          수정
                        </button>
                      ) : null}
                      {c.can_delete ? (
                        <button
                          type="button"
                          className="block w-full px-3 py-2 text-left text-[14px] text-red-600 hover:bg-red-50"
                          onClick={() => void handleDelete(c.id)}
                        >
                          삭제
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {c.replies?.length ? (
              <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                {c.replies.map((r) => (
                  <div key={r.id} className="relative flex gap-3 pl-1">
                    <CornerDownRight className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" aria-hidden />
                    <div className="min-w-0 flex-1 rounded-lg border border-slate-100 bg-[#f8fafc] p-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className={`text-[14px] font-bold ${COLORS.text}`}>
                          {r.user?.nickname ?? '관리자'}{' '}
                          {r.user?.isAdmin ? (
                            <span className="ml-2 text-[12px] font-semibold text-[#64748b]">관리자 답변</span>
                          ) : null}
                        </p>
                        <StarRowDisplay value={r.rating_for_content} />
                        {r.created_at ? (
                          <span className={`text-[12px] ${COLORS.textSecondary}`}>{formatCommentListDate(r.created_at)}</span>
                        ) : null}
                      </div>
                      <p className={`mt-2 whitespace-pre-wrap break-words text-[14px] leading-6 ${COLORS.text}`}>{r.text}</p>
                      {r.can_delete ? (
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            className="text-[13px] font-medium text-red-600 hover:underline"
                            onClick={() => void handleDelete(r.id)}
                          >
                            삭제
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}
