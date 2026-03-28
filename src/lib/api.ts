/**
 * 게시판(공지/FAQ/문의) API 클라이언트
 * - baseURL: NEXT_PUBLIC_API_URL 또는 개발 시 localhost:8001
 * - JWT: 메모리의 accessToken만 Authorization: Bearer (없으면 헤더 미포함, frontend_wwwRules.md)
 * - 401 시 로그인 페이지 리다이렉트
 */
export { getApiBaseURL } from './axios'
import apiClient from './axios'
export default apiClient
