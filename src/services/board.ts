import api from '@/lib/api'
import type {
  NoticeListResponse,
  NoticeDetail,
  FAQListResponse,
  FAQItem,
  InquiryListResponse,
  InquiryDetail,
  InquiryTypeCode,
} from '@/types/board'

const BASE = {
  notices: '/api/notices',
  faqs: '/api/faqs',
  inquiries: '/api/inquiries',
}

/** Inde API 응답 래핑(IndeAPIResponse.Result 또는 Result) 해제 */
function unwrapResult<T>(data: unknown): T {
  const d = data as Record<string, unknown>
  if (d?.IndeAPIResponse && typeof d.IndeAPIResponse === 'object') {
    const r = (d.IndeAPIResponse as Record<string, unknown>).Result
    if (r !== undefined) return r as T
  }
  if (d?.Result !== undefined) return d.Result as T
  return data as T
}

/** 공지 목록 (검색/정렬/페이지네이션) */
export async function fetchNotices(params?: {
  page?: number
  page_size?: number
  search?: string
  ordering?: string
  /** true 이면 GNB 표시 공지만 (백엔드 목록 필터) */
  show_in_gnb?: boolean
}): Promise<NoticeListResponse> {
  const { data } = await api.get(BASE.notices, { params })
  return unwrapResult<NoticeListResponse>(data)
}

/** 공지 상세 (조회수 증가) */
export async function fetchNotice(id: number): Promise<NoticeDetail> {
  const { data } = await api.get(`${BASE.notices}/${id}`)
  return unwrapResult<NoticeDetail>(data)
}

/** FAQ 목록 */
export async function fetchFAQs(params?: { page?: number; page_size?: number }): Promise<FAQListResponse> {
  const { data } = await api.get(BASE.faqs, { params })
  return unwrapResult<FAQListResponse>(data)
}

/** FAQ 단일 (선택) */
export async function fetchFAQ(id: number): Promise<FAQItem> {
  const { data } = await api.get(`${BASE.faqs}/${id}`)
  return unwrapResult<FAQItem>(data)
}

/** 문의 목록 (본인만, 관리자는 전체) */
export async function fetchInquiries(params?: {
  page?: number
  page_size?: number
}): Promise<InquiryListResponse> {
  const { data } = await api.get(BASE.inquiries, { params })
  return unwrapResult<InquiryListResponse>(data)
}

/** 문의 상세 */
export async function fetchInquiry(id: number): Promise<InquiryDetail> {
  const { data } = await api.get(`${BASE.inquiries}/${id}`)
  return unwrapResult<InquiryDetail>(data)
}

/** 문의 작성 (로그인 필수, 첨부 있으면 multipart) */
export async function createInquiry(body: {
  title: string
  content: string
  inquiry_type: InquiryTypeCode
  attachment?: File | null
}): Promise<InquiryDetail> {
  if (body.attachment) {
    const fd = new FormData()
    fd.append('title', body.title)
    fd.append('content', body.content)
    fd.append('inquiry_type', body.inquiry_type)
    fd.append('attachment', body.attachment)
    const { data } = await api.post(BASE.inquiries, fd)
    return unwrapResult<InquiryDetail>(data)
  }
  const { data } = await api.post(BASE.inquiries, {
    title: body.title,
    content: body.content,
    inquiry_type: body.inquiry_type,
  })
  return unwrapResult<InquiryDetail>(data)
}

/** 문의 답변 (관리자) */
export async function answerInquiry(id: number, answer: string): Promise<InquiryDetail> {
  const { data } = await api.patch(`${BASE.inquiries}/${id}`, { answer })
  return unwrapResult<InquiryDetail>(data)
}
