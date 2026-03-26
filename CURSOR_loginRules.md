# 회원가입·로그인 규칙 (frontend_www)

> **정책 우선**: **`_docsRules/1_planDoc/userJoinPlan.md`** (§17 세션·콜백 포함). 본 파일과 충돌하면 **userJoinPlan 우선**.

## 1. API 클라이언트

- **baseURL**: `getApiBaseURL()` 사용  
  - 개발: `http://localhost:8001`  
  - 프로덕션: `NEXT_PUBLIC_API_URL` 또는 `https://api.inde.kr`
- **withCredentials**: `true` (쿠키 전송)
- **인증**: 요청 시 `Authorization: Bearer {accessToken}` (쿠키의 `accessToken`을 interceptor에서 첨부)
- **토큰·사용자 정보**: 쿠키에만 저장 (`accessToken`, `refreshToken`, `userInfo`). **localStorage 금지.**
- **가입 진행 전용**: `temp_token`·`register_context` 는 **accessToken과 별개** — 일반 API `Authorization`에 쓰지 않음(userJoinPlan §4).

---

## 2. API 응답 형식

백엔드가 **IndeAPIResponse** 래핑을 쓸 수 있음:

```json
{
  "ErrorCode": "00",
  "Message": "정상적으로 처리되었습니다.",
  "Result": { ... }
}
```

또는 **raw JSON** (`Result` 없이 바로 payload).

- **로그인**: `response.data.IndeAPIResponse.Result` 또는 `response.data`에서 `access_token`, `refresh_token`, `user` 추출.
- **회원가입(LOCAL)**: `POST /auth/register` — 성공 시 **JWT·자동 로그인** 여부는 백엔드·플랜에 따름(userJoinPlan §10).
- **getMe**: `GET /me` — **User 존재 시에만** 의미 있음(userJoinPlan §17).

에러 메시지: `response.data.error` 또는 `response.data.IndeAPIResponse.Message` 등으로 통일.

---

## 3. 페이지·라우팅 (userJoinPlan 기준)

### 3.1 `/login`

- **일반 로그인**: email / password → `POST /auth/login/`
  - 성공: 토큰·user 저장 후 **항상 `/`** (`profile_completed`·`/signup/complete` 분기 **미사용**)
- **SNS 버튼**: `window.location.href = getApiBaseURL() + 경로`
  - 카카오: `/auth/kakao/redirect/`
  - 네이버: `/auth/naver/redirect/`
  - 구글: `/auth/google/redirect/` (회원가입 페이지에서는 `?state=signup` **참고용**)

### 3.2 `/register`

- **일반 회원가입**: `register_context`(**/register 진입 시** 서버 발급, userJoinPlan §4.6) → 이메일·비밀번호·중복 검사 → 휴대폰 → `POST /auth/register/`
- **SNS**: 동일 OAuth 엔드포인트 (가입/로그인 판단은 **서버·SocialAccount**, `state` 의존 금지)

### 3.3 `/signup/phone`

- **휴대폰 인증·회원 생성 트리거** — `temp_token`(SNS) 또는 `register_context`(LOCAL) 검증 후 진입(userJoinPlan §8)
- 완료: `POST /auth/verify-phone` / `POST /auth/register` 등 백엔드 스펙에 따름

### 3.4 `/signup/complete`, `/signup/complete-profile`, `/auth/verify-email`

- **미사용·주석 처리**(userJoinPlan) — 이메일 인증·complete-profile 플로 폐기

### 3.5 `/auth/callback`

- **기존 SNS 회원**: `access_token`·`refresh_token` 쿼리 → `saveTokens` → `getMe()` → `/`
- **신규 SNS**: `temp_token` 쿠키만 → **`/signup/phone`** — **조건 없이 `getMe()` 금지**
- **에러 쿼리** (`error=...`): 공통 코드 처리 후 `/login?error=...`

### 3.6 로그아웃

- `POST /auth/logout/` 호출 (실패해도 진행)
- 쿠키에서 `accessToken`, `refreshToken`, `userInfo` 및 **`temp_token`·`register_context`** 제거
- `/login` 이동

---

## 4. 서비스 함수 (auth)

| 함수 | 설명 |
|------|------|
| `login(data)` | POST /auth/login/, 토큰·user 저장 |
| `register(data)` | POST /auth/register/ |
| `getMe()` | GET /me/ — **로그인 완료·User 존재 시** |
| `saveTokens(...)` | 토큰·userInfo 쿠키 저장 |
| `logout()` | 로그아웃 + 쿠키 정리 |

---

## 5. 완료 기준·테스트 시나리오 (요약)

- **LOCAL**: `/register` → `register_context` → 휴대폰 인증 → `POST /auth/register` → JWT → `/`
- **SNS 신규**: OAuth → callback → `temp_token` → `/signup/phone` → 인증 → 회원 생성 → JWT → `/`
- **SNS 기존**: OAuth → callback → JWT → `getMe()` → `/`
- 로그아웃 후 `/me` → 401

---

## 6. 변경 이력

| 날짜 | 내용 |
|------|------|
| (기존) | IndeAPIResponse·페이지 경로·서비스 함수 목록 |
| 2026-03-26 | **userJoinPlan 전면 정렬**: 라우팅·콜백·`temp_token`·`register_context`·레거시 이메일/complete-profile 제거 |
