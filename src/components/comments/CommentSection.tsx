'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MoreVertical } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createComment, deleteComment, fetchComments, updateComment, type CommentContentType, type CommentItem } from '@/services/comments'

const COLORS = {
  text: 'text-[#0f172a]',
  textSecondary: 'text-[#64748b]',
  border: 'border-[#e2e8f0]',
  bgLight: 'bg-[#f8fafc]',
} as const

/** 댓글 본문 최대 글자수(초과 입력·붙여넣기 방지) */
const COMMENT_MAX_LENGTH = 500

export default function CommentSection({
  contentType,
  contentId,
  allowComment,
  className,
}: {
  contentType: CommentContentType
  contentId: string | number
  allowComment: boolean
  className?: string
}) {
  const { status } = useAuth()
  const authenticated = status === 'authenticated'

  const [items, setItems] = useState<CommentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [menuOpenId, setMenuOpenId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')

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
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetchComments({ contentType, contentId })
      setItems(res.list ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '댓글을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [allowComment, contentType, contentId])

  useEffect(() => {
    void load()
    setMenuOpenId(null)
    setEditingId(null)
    setEditingText('')
  }, [load])

  const handleSubmit = useCallback(async () => {
    if (!authenticated || !allowComment) return
    const t = text.trim()
    if (!t) return
    setSubmitting(true)
    try {
      await createComment({ contentType, contentId, commentText: t })
      setText('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '댓글 작성에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }, [authenticated, allowComment, text, contentType, contentId, load])

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
    async (id: number) => {
      if (!confirm('이 댓글을 삭제하시겠습니까?')) return
      try {
        await deleteComment(id)
        setMenuOpenId(null)
        if (editingId === id) cancelEdit()
        await load()
      } catch (e) {
        setError(e instanceof Error ? e.message : '댓글 삭제에 실패했습니다.')
      }
    },
    [load, editingId, cancelEdit]
  )

  if (!allowComment) return null

  return (
    <section className={className ?? ''}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className={`text-[18px] font-bold ${COLORS.text}`}>댓글 {total}개</h2>
      </div>

      {authenticated ? (
        <div className={`mb-6 rounded-xl border ${COLORS.border} ${COLORS.bgLight} p-4`}>
          <textarea
            value={text}
            maxLength={COMMENT_MAX_LENGTH}
            onChange={(e) => setText(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
            placeholder="선한 인사이트로 연결되기, 생각을 자유롭게 나눠주세요."
            className={`min-h-[110px] w-full resize-none bg-transparent text-[14px] leading-6 ${COLORS.text} outline-none`}
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              disabled={submitting || !text.trim()}
              onClick={() => void handleSubmit()}
              className="rounded-lg bg-[#e2e8f0] px-4 py-2 text-[14px] font-semibold text-[#111827] disabled:opacity-50"
            >
              확인
            </button>
          </div>
        </div>
      ) : (
        <div className={`mb-6 rounded-xl border ${COLORS.border} ${COLORS.bgLight} p-4`}>
          <p className={`text-[14px] ${COLORS.textSecondary}`}>댓글을 작성하려면 로그인이 필요합니다.</p>
        </div>
      )}

      {error ? <p className="mb-4 text-[14px] text-red-600">{error}</p> : null}
      {loading ? <p className={`text-[14px] ${COLORS.textSecondary}`}>댓글을 불러오는 중...</p> : null}

      <div className={`divide-y ${COLORS.border}`}>
        {items.map((c) => (
          <div key={c.id} className="py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className={`text-[14px] font-bold ${COLORS.text}`}>{c.user?.nickname ?? '—'}</p>

                {editingId === c.id ? (
                  <div className="mt-2">
                    <textarea
                      value={editingText}
                      maxLength={COMMENT_MAX_LENGTH}
                      onChange={(e) => setEditingText(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
                      className={`min-h-[90px] w-full resize-none rounded-lg border ${COLORS.border} bg-white p-3 text-[14px] leading-6 ${COLORS.text} outline-none`}
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
                  <p className={`mt-2 whitespace-pre-wrap break-words text-[14px] leading-6 ${COLORS.text}`}>{c.text}</p>
                )}
              </div>

              {(c.can_edit || c.can_delete) && editingId !== c.id ? (
                <div className="relative">
                  <button
                    type="button"
                    aria-label="더보기"
                    className="rounded-md p-2 hover:bg-slate-100"
                    onClick={() => setMenuOpenId((prev) => (prev === c.id ? null : c.id))}
                  >
                    <MoreVertical className="h-5 w-5 text-[#475569]" />
                  </button>
                  {menuOpenId === c.id ? (
                    <div className="absolute right-0 mt-2 w-28 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
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
              <div className="mt-4 space-y-3 pl-6">
                {c.replies.map((r) => (
                  <div key={r.id} className="rounded-lg bg-[#f8fafc] p-4">
                    <p className={`text-[13px] font-bold ${COLORS.text}`}>
                      {r.user?.nickname ?? '관리자'} {r.user?.isAdmin ? <span className="ml-2 text-[12px] font-semibold text-[#64748b]">관리자 답변</span> : null}
                    </p>
                    <p className={`mt-2 whitespace-pre-wrap break-words text-[14px] leading-6 ${COLORS.text}`}>{r.text}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}

