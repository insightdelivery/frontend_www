'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { verifyProfilePassword } from '@/services/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type MypageProfilePasswordGateProps = {
  onVerified: () => void
}

export default function MypageProfilePasswordGate({ onVerified }: MypageProfilePasswordGateProps) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const p = password.trim()
    if (!p) {
      setError('비밀번호를 입력해 주세요.')
      return
    }
    setLoading(true)
    try {
      await verifyProfilePassword(p)
      setPassword('')
      onVerified()
    } catch (err) {
      setError(err instanceof Error ? err.message : '본인 확인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="text-lg font-semibold text-gray-900">회원 정보 수정</h2>
      <p className="mt-2 text-sm text-gray-600">
        개인정보 보호를 위해 <strong className="font-medium text-gray-800">로그인 시 사용하는 비밀번호</strong>를 한 번 더 입력해
        주세요. (재로그인이 아닙니다.)
      </p>
      <form className="mt-6 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
        {error ? (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">
            {error}
          </div>
        ) : null}
        <div>
          <Label htmlFor="mypage-gate-password">비밀번호</Label>
          <div className="relative mt-1">
            <Input
              id="mypage-gate-password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
              placeholder="비밀번호 입력"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <Button
          type="submit"
          className="w-full bg-[#e1f800] font-semibold text-[#111827] hover:bg-[#c9e000] sm:w-auto"
          disabled={loading}
        >
          {loading ? '확인 중…' : '확인 후 수정하기'}
        </Button>
      </form>
    </div>
  )
}
