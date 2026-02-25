2-1. API 클라이언트 설정

axios 사용 시:

baseURL: https://api.inde.kr

withCredentials: true

fetch 사용 시:

credentials: "include"

2-2. 페이지/라우팅
(1) /login

일반 로그인 폼: email/password → POST /auth/login/

SNS 버튼:

카카오: location.href="https://api.inde.kr/auth/kakao/redirect/"

네이버: location.href="https://api.inde.kr/auth/naver/redirect/"

구글: location.href="https://api.inde.kr/auth/google/redirect/"

(2) /register

email/password/password2 → POST /auth/register/

성공 시 /signup/complete로 이동(또는 자동 로그인 유도)

(3) /auth/callback

SNS 로그인 후 도착하는 페이지

로딩 시 GET /me/ 호출

성공:

profile_completed==true → / 또는 /dashboard

profile_completed==false → /signup/complete

실패: /login?error=OAUTH_FAILED

(4) /signup/complete (핵심)

“기본정보 입력 폼” 구성 (로컬 가입자 + SNS 가입자 공통 사용)

필드:

이메일(읽기 전용 표시, /me에서 가져와서 표시)

핸드폰

이름

직분(교회 직분) (select 또는 input)

생일: 년/월/일 (3개 입력)

지역:

region_type 선택: 내국인/외국인

내국인: 도/광역시 select

외국인: 국가/지역 텍스트 입력

제출 시 PUT /profile/complete/

성공 시 /dashboard

(5) 로그아웃

POST /auth/logout/ 후 상태 초기화, /login

3) 완료 기준(테스트 시나리오)

로컬 회원가입 → /signup/complete에서 정보 입력 → 가입완료 → /me 확인

구글 로그인(처음) → /auth/callback → profile_completed=false → /signup/complete → 완료

카카오/네이버도 동일 흐름

새로고침해도 로그인 유지(쿠키)

로그아웃 후 /me는 401