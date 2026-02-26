/**
 * 게시판(공지/FAQ/문의) API 클라이언트
 * - baseURL: NEXT_PUBLIC_API_URL 또는 개발 시 localhost:8001
 * - JWT: 쿠키 accessToken 자동 첨부 (Authorization: Bearer)
 * - 401 시 로그인 페이지 리다이렉트
 */
export { getApiBaseURL } from './axios'
import apiClient from './axios'
export default apiClient
