'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createInquiry } from '@/services/board'
import { getAccessToken, getMe } from '@/services/auth'
import { getSysCode, INQUIRY_TYPE_PARENT, type SysCodeItem } from '@/lib/syscode'

const MAX_FILE_BYTES = 10 * 1024 * 1024
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.pdf', '.zip'])

function sortTypeOptions(list: SysCodeItem[]) {
  return [...list]
    .filter((c) => c.sysCodeUseFlag === 'Y')
    .sort((a, b) => a.sysCodeSort - b.sysCodeSort)
}

function validateFile(file: File | null): string | null {
  if (!file) return null
  if (file.size > MAX_FILE_BYTES) return '첨부 파일은 10MB 이하여야 합니다.'
  const name = file.name.toLowerCase()
  const dot = name.lastIndexOf('.')
  const ext = dot >= 0 ? name.slice(dot) : ''
  if (!ALLOWED_EXT.has(ext)) return 'jpg, png, pdf, zip 형식만 지원합니다.'
  return null
}

export default function MypageSupportWritePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [typeOptions, setTypeOptions] = useState<SysCodeItem[]>([])
  const [inquiryType, setInquiryType] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [agree, setAgree] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedOptions = useMemo(() => sortTypeOptions(typeOptions), [typeOptions])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!getAccessToken()) {
      router.replace('/login?next=/mypage/support/write')
      return
    }
    let cancelled = false
    getMe()
      .then((u) => {
        if (!cancelled) {
          setName(u.name?.trim() || '')
          setEmail(u.email?.trim() || '')
        }
      })
      .catch(() => {
        if (!cancelled) router.replace('/login?next=/mypage/support/write')
      })
    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    let cancelled = false
    void getSysCode(INQUIRY_TYPE_PARENT).then((rows) => {
      if (!cancelled) setTypeOptions(rows)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!inquiryType) {
      setError('문의 유형을 선택해 주세요.')
      return
    }
    if (!title.trim()) {
      setError('제목을 입력해 주세요.')
      return
    }
    if (!content.trim()) {
      setError('문의 내용을 입력해 주세요.')
      return
    }
    if (!agree) {
      setError('개인정보 수집 및 이용에 동의해 주세요.')
      return
    }
    const fileErr = validateFile(file)
    if (fileErr) {
      setError(fileErr)
      return
    }
    setSubmitting(true)
    try {
      const created = await createInquiry({
        title: title.trim(),
        content: content.trim(),
        inquiry_type: inquiryType,
        attachment: file ?? undefined,
      })
      router.push(`/mypage/support?id=${created.id}`)
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { Message?: string } }; message?: string }
      if (ax.response?.status === 401) {
        router.replace('/login?next=/mypage/support/write')
        return
      }
      const msg = ax.response?.data?.Message?.trim()
      setError(msg || ax.message || '문의 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[896px] rounded-xl border border-[#e5e7eb] bg-white px-[33px] pb-[49px] pt-[33px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <div className="mb-6">
          <Link href="/mypage/support" className="text-sm text-[#6b7280] hover:text-[#111827]">
            ← 목록으로
          </Link>
        </div>
        <form className="flex flex-col gap-8" onSubmit={onSubmit}>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium leading-5 text-[#111827]">성함</label>
              <div className="rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] px-4 py-3">
                <span className="text-[16px] leading-6 text-[#6b7280]">{name || '—'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium leading-5 text-[#111827]">이메일</label>
              <div className="rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] px-4 py-3">
                <span className="text-[16px] leading-6 text-[#6b7280]">{email || '—'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium leading-5 text-[#111827]">문의 유형</label>
            <select
              className="h-[50px] w-full rounded-lg border border-[#e5e7eb] bg-white px-4 text-[16px] leading-6 text-[#111827]"
              value={inquiryType}
              onChange={(e) => setInquiryType(e.target.value)}
            >
              <option value="">문의 유형을 선택해 주세요</option>
              {sortedOptions.map((opt) => (
                <option key={opt.sysCodeSid} value={opt.sysCodeSid}>
                  {opt.sysCodeName}
                </option>
              ))}
            </select>
            {sortedOptions.length === 0 && (
              <p className="text-[12px] leading-4 text-[#6b7280]">
                등록된 문의 유형이 없습니다. 관리자에게 문의해 주세요.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium leading-5 text-[#111827]">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              placeholder="제목을 입력해 주세요"
              className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-3.5 text-[16px] leading-6 text-[#111827] placeholder:text-[#6b7280]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium leading-5 text-[#111827]">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="문의 내용을 상세히 작성해 주세요."
              rows={8}
              className="min-h-[200px] rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 text-[16px] leading-6 text-[#111827] placeholder:text-[#6b7280]"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[14px] font-medium leading-5 text-[#111827]">파일 첨부</label>
            <div className="flex flex-wrap items-center gap-4">
              <label className="cursor-pointer rounded-lg border border-[#111827] px-6 py-2.5 text-[14px] font-medium leading-5 text-[#111827]">
                파일 선택
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,.zip"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null
                    setFile(f)
                    setFileName(f?.name ?? null)
                  }}
                />
              </label>
              <span className="text-[12px] leading-4 text-[#6b7280]">
                {fileName ?? '선택된 파일 없음'}
              </span>
            </div>
            <ul className="flex flex-col gap-1">
              <li className="flex items-center gap-1 text-[12px] leading-4 text-[#6b7280]">
                <span className="text-[#6b7280]">•</span> 10MB 이하의 파일만 첨부 가능합니다.
              </li>
              <li className="flex items-center gap-1 text-[12px] leading-4 text-[#6b7280]">
                <span className="text-[#6b7280]">•</span> jpg, png, pdf, zip 형식의 파일만 지원합니다.
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-4 pb-6">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="h-4 w-4 rounded border border-[#e5e7eb]"
              />
              <span className="text-[14px] font-medium leading-5 text-[#111827]">
                개인정보 수집 및 이용 동의 (필수)
              </span>
            </label>
            <div className="h-32 overflow-auto rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] px-4 py-4 text-[12px] leading-[19.5px] text-[#6b7280]">
              <p>1. 개인정보 수집 항목</p>
              <p>성함, 이메일 주소, 문의 내용에 포함된 개인정보</p>
              <p>2. 수집 및 이용 목적</p>
              <p>1:1 문의 접수 및 답변 처리, 서비스 개선을 위한 통계 활용</p>
              <p>3. 보유 및 이용 기간</p>
              <p>
                문의 처리 완료 후 3년간 보관하며, 관련 법령에 따라 보존할 필요가 있는 경우 해당
                기간까지 보관합니다.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#e1f800] py-5 text-[20px] font-medium leading-7 text-black shadow-[0px_10px_15px_-3px_rgba(225,248,0,0.2),0px_4px_6px_-4px_rgba(225,248,0,0.2)] disabled:opacity-60"
            >
              {submitting ? '전송 중…' : '보내기'}
            </button>
            <p className="text-center text-sm text-[#6b7280]">
              제출 후 내역은{' '}
              <Link href="/mypage/support" className="text-[#111827] underline">
                1:1 문의 목록
              </Link>
              에서 확인할 수 있습니다.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
