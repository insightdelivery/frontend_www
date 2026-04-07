# frontend_www — 라우팅·URL 규칙 (ME)

> 나중에 확인용: **페이지별 상태·필터·선택값은 경로(path)가 아니라 쿼리(query) 형식으로 처리한다.**

---

## 1. 원칙

- **동적 구분은 쿼리 파라미터로**
  - 예: `/article/category?category=브랜딩` (O)
  - 예: `/article/category/브랜딩` (X, 경로에 값 넣지 않음)
- **이유**
  - `output: 'export'`(정적 빌드) 시 `generateStaticParams` 불필요
  - URL이 읽기 쉽고, 공유·북마크·히스토리 관리가 단순함
  - 같은 페이지에서 파라미터만 바꿔서 사용하기 쉬움

---

## 2. Middleware — 기본적으로 사용하지 않음

- 이 프로젝트는 `next.config.js`에 **`output: 'export'`**(정적 HTML 내보내기)가 설정되어 있다.
- **Next.js는 `output: 'export'`와 Middleware를 함께 쓸 수 없다.** (`Middleware cannot be used with "output: export"`)
- **코드·기능 생성 시 `src/middleware.ts`를 추가하거나 Middleware에 의존하지 말 것.** 인증·경로 보호·리다이렉트는 **클라이언트**에서 처리한다 (예: `useAuth`, 레이아웃/쉘에서 `router.replace('/login')`).
- Middleware가 꼭 필요한 설계라면 **`output: 'export'` 제거**와 배포 방식 변경이 먼저 결정되어야 하며, 그 전에는 미들웨어만 도입하지 말 것.

---

## 3. 페이지별 쿼리 사용 현황

| 페이지 경로 | 쿼리 파라미터 | 설명 |
|------------|----------------|------|
| `/article/category` | `category` | 아티클 카테고리 (예: `?category=브랜딩`, `?category=서적`) |
| `/notice` | `id` | 공지 상세 (예: `?id=1`) |
| `/mypage/support` | — | 1:1 문의 목록(마이페이지). 상세는 `/mypage/support/[id]`, 작성은 `/mypage/support/write`. 예전 `/inquiry`·`/inquiry?id=`는 리다이렉트 |
| `/video` | (추가 시) `category`, `sort`, `page` 등 | 비디오 필터/정렬/페이지는 쿼리로 확장 |
| `/seminar` | (추가 시) `category`, `sort`, `page` 등 | 세미나 필터/정렬/페이지는 쿼리로 확장 |
| `/article` | (추가 시) | 아티클 메인에서 필터/정렬 추가 시 쿼리 사용 |

---

## 4. 링크·이동 시 규칙

- **쿼리만 바꿀 때**
  - `router.push('/article/category?category=' + encodeURIComponent(cat))`
  - 또는 `<Link href={/article/category?category=${encodeURIComponent(cat)}}>`
- **한글·특수문자**
  - 반드시 `encodeURIComponent(value)` 사용 (예: `취미/일상` → `취미%2F일상`)
- **여러 쿼리**
  - `?category=브랜딩&sort=latest&page=2` 형태로 이어 붙이기
  - Next: `useSearchParams()`로 읽기, `new URLSearchParams(params).toString()` 등으로 조합

---

## 5. 읽기/쓰기 (Next.js App Router)

- **읽기**: `useSearchParams()` (클라이언트)
  - `searchParams.get('category')` → `'브랜딩'` (자동 디코딩)
- **쓰기**: `router.push(path + '?' + new URLSearchParams({ category: '브랜딩' }))` 또는 위 Link 예시처럼 문자열로 조합

---

## 6. 새 페이지/기능 추가 시 체크

- [ ] 이 페이지에 “선택/필터/정렬/페이지”가 있나?
- [ ] 있다면 **경로 세그먼트(`/page/[id]`)가 아니라 쿼리(`?id=...`)로 설계했나?**
- [ ] 링크·`router.push`에 `encodeURIComponent` 적용했나?
- [ ] **`src/middleware.ts`를 추가하지 않았나?** (정적 export와 호환; 기본 금지 — §2)

---

*마지막 정리: 2025년 기준. 새 페이지·필터 추가 시 이 규칙을 따르고, 이 파일에 항목만 추가해서 유지하면 됨. Middleware 관련은 §2 참고.*



