# 회원가입·로그인 규칙 (frontend_www)

## 1. API 클라이언트

- **baseURL**: `getApiBaseURL()` 사용  
  - 개발: `http://localhost:8001`  
  - 프로덕션: `NEXT_PUBLIC_API_URL` 또는 `https://api.inde.kr`
- **withCredentials**: `true` (쿠키 전송)
- **인증**: 요청 시 `Authorization: Bearer {accessToken}` (쿠키의 `accessToken`을 interceptor에서 첨부)
- **토큰·사용자 정보**: 쿠키에만 저장 (`accessToken`, `refreshToken`, `userInfo`). localStorage 사용 금지.

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
- **회원가입(LOCAL)**: `response.data.Result` 또는 `response.data`에서 `success`, `email`, `user` 추출 (토큰 없음).
- **getMe / completeProfile / verifyEmail**: 동일하게 `Result` 또는 `response.data`에서 실제 데이터 추출.

에러 메시지: `response.data.error` 또는 `response.data.IndeAPIResponse.Message` 등으로 통일해서 표시.

---

## 3. 페이지·라우팅

### 3.1 `/login`

- **일반 로그인**: email / password → `POST /auth/login/`
  - 성공: 토큰·user 저장 후 `profile_completed`에 따라 `/` 또는 `/signup/complete`
  - 403 (이메일 미인증): 에러 문구 + **「이메일 인증 메일 다시 보내기」** 버튼 → `resendVerificationEmail(email)`
- **SNS 버튼**: `window.location.href = getApiBaseURL() + 경로`
  - 카카오: `/auth/kakao/redirect/`
  - 네이버: `/auth/naver/redirect/`
  - 구글: `/auth/google/redirect/` (회원가입 페이지에서는 `/auth/google/redirect/?state=signup`)

### 3.2 `/register`

- **일반 회원가입**: email, password, password2, name, nickname, phone, 추가정보, 약관 → `POST /auth/register/`
  - 성공 시 **토큰 없음** (`success`, `email`, `user`만 반환) → `/signup/complete?email={email}` 로 이동
- **SNS 회원가입**: 구글 등 위 SNS 경로로 이동 (동일 엔드포인트).

### 3.3 `/signup/complete`

- **로컬(LOCAL) 회원가입 후 안내 전용**
- 쿼리 `email` 있으면 해당 이메일 표시
- 문구: 가입 이메일로 인증 메일을 보냈으며, **메일의 인증 링크를 클릭한 후에만 로그인 가능**하다는 안내
- 링크: 로그인 페이지로 이동

### 3.4 `/signup/complete-profile`

- **구글 회원가입 후 부가정보 입력**
- 진입: OAuth 콜백에서 `joined_via === 'GOOGLE'` 이고 `profile_completed === false` 일 때
- **이메일**: 구글에서 온 값, **수정 불가** (읽기 전용 표시)
- **필수**: 이름, 닉네임, 휴대폰 번호
- **선택**: 직분, 생년월일, 해외거주 체크, 지역
- **약관**: 이용약관 전체 동의, 만 14세 이상, 이용약관, 개인정보 수집·이용, 뉴스레터(선택)
- 제출: `PUT /profile/complete/` (또는 `completeProfile()`) → 성공 시 **이메일 인증 없이** 로그인 유지 → `/` 로 이동

### 3.5 `/auth/verify-email`

- 쿼리 `token`: 메일 링크의 인증 토큰
- `verifyEmail(token)` 호출 (응답은 `IndeAPIResponse.Result` 또는 raw 처리)
- 성공: "이메일 인증이 완료되었습니다. 로그인해 주세요." + 로그인 페이지 링크
- 실패: "인증 실패" 등 에러 메시지 + 로그인 페이지 링크

### 3.6 `/auth/callback`

- **OAuth 직후**: 쿼리에 `access_token`, `refresh_token`, `expires_in` (선택: `from=signup`) 있으면
  - 토큰 저장 → `getMe()` → user 쿠키 저장
  - `profile_completed === true` → `/?welcome=1` 또는 `/`
  - `profile_completed === false` 이고 `joined_via === 'GOOGLE'` → `/signup/complete-profile`
  - 그 외 미완료 → `/signup/complete`
- **토큰 없이 접근**: 이미 로그인된 상태로 간주, `getMe()` 후 위와 동일 분기
- **에러 쿼리** (`error=...`): OAUTH_DENIED, OAUTH_NO_CODE, OAUTH_CONFIG, OAUTH_FAILED, OAUTH_NO_EMAIL, EMAIL_ALREADY_REGISTERED 등 → 메시지 표시 후 `/login?error=...`

### 3.7 로그아웃

- `POST /auth/logout/` 호출 (실패해도 진행)
- 쿠키에서 `accessToken`, `refreshToken`, `userInfo` 제거
- `/login` 으로 이동

---

## 4. 서비스 함수 (auth)

| 함수 | 설명 |
|------|------|
| `login(data)` | POST /auth/login/, 응답(raw/IndeAPIResponse) 파싱 후 토큰·user 저장 |
| `register(data)` | POST /auth/register/, 성공 시 `{ success, email, user }` 반환 (토큰 없음) |
| `getMe()` | GET /me/, 응답(raw/Result) 파싱 후 UserInfo 반환 |
| `verifyEmail(token)` | POST /auth/verify-email/ body `{ token }` |
| `resendVerificationEmail(email)` | POST /auth/resend-verification-email/ body `{ email }` |
| `completeProfile(data)` | PUT /profile/complete/, 부가정보 완료 (구글 부가정보 등) |
| `saveTokens(accessToken, refreshToken, userInfo?)` | 토큰·userInfo 쿠키 저장 |
| `getUserInfo()` | 쿠키에서 userInfo 파싱 반환 |
| `getAccessToken()` | 쿠키에서 accessToken 반환 |
| `isAuthenticated()` | accessToken 존재 여부 |

---

## 5. 완료 기준·테스트 시나리오

- **로컬 회원가입**: 가입 → `/signup/complete?email=...` → 메일 인증 링크 클릭 → `/auth/verify-email` 성공 → 로그인 가능
- **로컬 로그인 미인증**: 403 시 "이메일 인증 메일 다시 보내기"로 재발송 후 인증 링크로 완료
- **구글 회원가입**: 구글 버튼 → OAuth → `/auth/callback` → `/signup/complete-profile` → 부가정보 입력·제출 → `/` (이메일 인증 없음)
- **구글 로그인(기가입)**: OAuth → `/auth/callback` → `profile_completed === true` → `/`
- 새로고침 시에도 쿠키로 로그인 유지
- 로그아웃 후 `/me` 호출 시 401
