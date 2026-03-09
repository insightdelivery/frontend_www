'use client'

import { useState } from 'react'
import { requestWithdraw, logout } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface WithdrawModalProps {
  open: boolean
  onClose: () => void
  joinedVia: 'LOCAL' | 'KAKAO' | 'NAVER' | 'GOOGLE'
}

export default function WithdrawModal({ open, onClose, joinedVia }: WithdrawModalProps) {
  const [reason, setReason] = useState('')
  const [detailReason, setDetailReason] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isLocal = joinedVia === 'LOCAL'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const result = await requestWithdraw({
        reason: reason || undefined,
        detail_reason: detailReason || undefined,
        ...(isLocal && password ? { password } : {}),
      })
      if (result.success) {
        await logout()
        if (typeof window !== 'undefined') window.location.href = '/'
        return
      }
      if (result.notImplemented) {
        alert('회원 탈퇴 기능은 준비 중입니다.')
        onClose()
        return
      }
      setError(result.error ?? '탈퇴 요청에 실패했습니다.')
    } catch {
      setError('탈퇴 요청 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-bold text-[#111827]">회원 탈퇴</h2>
        <p className="mt-2 text-sm text-[#6b7280]">
          탈퇴 시 복구할 수 없으며, 보유 중인 개인정보는 법령에 따라 보존이 필요한 경우를 제외하고 파기됩니다.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="withdraw-reason" className="text-sm text-[#111827]">
              탈퇴 사유 (선택)
            </Label>
            <Input
              id="withdraw-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="탈퇴 사유를 입력해 주세요"
              className="mt-1 border-[#e5e7eb]"
            />
          </div>

          <div>
            <Label htmlFor="withdraw-detail" className="text-sm text-[#111827]">
              상세 사유 (선택)
            </Label>
            <textarea
              id="withdraw-detail"
              value={detailReason}
              onChange={(e) => setDetailReason(e.target.value)}
              placeholder="상세 사유를 입력해 주세요"
              rows={3}
              className="mt-1 w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm"
            />
          </div>

          {isLocal && (
            <div>
              <Label htmlFor="withdraw-password" className="text-sm text-[#111827]">
                비밀번호 확인 (선택)
              </Label>
              <Input
                id="withdraw-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="탈퇴를 위해 비밀번호를 입력해 주세요"
                className="mt-1 border-[#e5e7eb]"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? '처리 중...' : '탈퇴하기'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
