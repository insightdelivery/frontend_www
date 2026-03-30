'use client'

export function formatInquiryDate(s: string) {
  try {
    return new Date(s).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return s
  }
}

export function formatInquiryDateTime(s: string) {
  try {
    return new Date(s).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return s
  }
}

export function inquiryErrorMessage(e: unknown, fallback: string): string {
  const err = e as { response?: { status: number; data?: { Message?: string } }; message?: string }
  const status = err?.response?.status
  if (status === 401 || status === 403) {
    const msg = err?.response?.data?.Message?.trim()
    return msg || '로그인이 필요하거나 권한이 없습니다. 다시 로그인해 주세요.'
  }
  return err?.message ?? fallback
}

function isAttachmentImageUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(u.pathname)
  } catch {
    return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(url)
  }
}

function attachmentSuggestedFileName(url: string): string {
  try {
    const path = new URL(url).pathname
    const seg = path.split('/').pop() || 'download'
    return decodeURIComponent(seg)
  } catch {
    const raw = url.split('/').pop() || 'download'
    return decodeURIComponent(raw.split('?')[0] || 'download')
  }
}

export function InquiryAttachmentBlock({ url }: { url: string }) {
  const fileName = attachmentSuggestedFileName(url)
  const isImage = isAttachmentImageUrl(url)

  if (isImage) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">첨부 이미지</p>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- 동적 업로드 URL */}
          <img
            src={url}
            alt=""
            loading="lazy"
            className="mx-auto max-h-[min(480px,70vh)] w-auto max-w-full object-contain"
          />
        </div>
        <a
          href={url}
          download={fileName}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-blue-600 underline hover:text-blue-800"
        >
          {fileName} 다운로드
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">첨부 파일</p>
      <a
        href={url}
        download={fileName}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
      >
        {fileName} 다운로드
      </a>
    </div>
  )
}
