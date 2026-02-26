import api from '@/lib/api'
import { getAccessToken } from '@/services/auth'
import type {
  NoticeListResponse,
  NoticeDetail,
  FAQListResponse,
  FAQItem,
  InquiryListResponse,
  InquiryDetail,
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

/** 인증 필요 요청용 헤더 (쿠키 토큰을 Authorization에 명시적으로 붙임) */
function authHeaders(): { headers?: { Authorization: string } } {
  const token = typeof window !== 'undefined' ? getAccessToken() : undefined
  if (!token) return {}
  return { headers: { Authorization: `Bearer ${token}` } }
}

/** 공지 목록 (검색/정렬/페이지네이션) */
export async function fetchNotices(params?: {
  page?: number
  page_size?: number
  search?: string
  ordering?: string
}): Promise<NoticeListResponse> {
  const { data } = await api.get(BASE.notices + '/', { params })
  return unwrapResult<NoticeListResponse>(data)
}

/** 공지 상세 (조회수 증가) */
export async function fetchNotice(id: number): Promise<NoticeDetail> {
  const { data } = await api.get(`${BASE.notices}/${id}/`)
  return unwrapResult<NoticeDetail>(data)
}

/** 공지 생성 (관리자) */
export async function createNotice(body: { title: string; content: string; is_pinned?: boolean }): Promise<NoticeDetail> {
  const { data } = await api.post(BASE.notices + '/', body, authHeaders())
  return unwrapResult<NoticeDetail>(data)
}

/** 공지 수정 (관리자) */
export async function updateNotice(
  id: number,
  body: { title?: string; content?: string; is_pinned?: boolean }
): Promise<NoticeDetail> {
  const { data } = await api.patch(`${BASE.notices}/${id}/`, body, authHeaders())
  return unwrapResult<NoticeDetail>(data)
}

/** 공지 삭제 (관리자) */
export async function deleteNotice(id: number): Promise<void> {
  await api.delete(`${BASE.notices}/${id}/`, authHeaders())
}

/** FAQ 목록 */
export async function fetchFAQs(params?: { page?: number; page_size?: number }): Promise<FAQListResponse> {
  const { data } = await api.get(BASE.faqs + '/', { params })
  return unwrapResult<FAQListResponse>(data)
}

/** FAQ 단일 (선택) */
export async function fetchFAQ(id: number): Promise<FAQItem> {
  const { data } = await api.get(`${BASE.faqs}/${id}/`)
  return unwrapResult<FAQItem>(data)
}

/** 문의 목록 (본인만, 관리자는 전체) */
export async function fetchInquiries(params?: {
  page?: number
  page_size?: number
}): Promise<InquiryListResponse> {
  const { data } = await api.get(BASE.inquiries + '/', { ...authHeaders(), params })
  return unwrapResult<InquiryListResponse>(data)
}

/** 문의 상세 */
export async function fetchInquiry(id: number): Promise<InquiryDetail> {
  const { data } = await api.get(`${BASE.inquiries}/${id}/`, authHeaders())
  return unwrapResult<InquiryDetail>(data)
}

/** 문의 작성 (로그인 필수) */
export async function createInquiry(body: { title: string; content: string }): Promise<InquiryDetail> {
  const { data } = await api.post(BASE.inquiries + '/', body, authHeaders())
  return unwrapResult<InquiryDetail>(data)
}

/** 문의 답변 (관리자) */
export async function answerInquiry(id: number, answer: string): Promise<InquiryDetail> {
  const { data } = await api.patch(`${BASE.inquiries}/${id}/`, { answer }, authHeaders())
  return unwrapResult<InquiryDetail>(data)
}
