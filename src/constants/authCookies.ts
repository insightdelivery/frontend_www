/**
 * `userInfo` 일반 쿠키 만료(일).
 * HttpOnly refresh 토큰(백엔드 설정, 예: 7일)과 크게 어긋나지 않게 해
 * 헤더·UI용 닉네임 캐시가 먼저 사라지지 않도록 함.
 *
 * 주의: 인증 복구·세션 판별에는 사용하지 않는다. 복구는 `/auth/tokenrefresh`(HttpOnly refresh)만 신뢰.
 */
export const USER_INFO_COOKIE_EXPIRES_DAYS = 7
