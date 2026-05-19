# frontend_www — 라우팅·URL 규칙 (ME)

> 나중에 확인용: **페이지별 상태·필터·선택값은 경로(path)가 아니라 쿼리(query) 형식으로 처리한다.**

---

## 1. 원칙

- **동적 구분은 쿼리 파라미터로**
  - 예: `/article/category?category=브랜딩` (O)
  - 예: `/article/category/브랜딩` (X, 경로에 값 넣지 않음)
- **이유**
  - URL이 읽기 쉽고, 공유·북마크·히스토리 관리가 단순함
  - 같은 페이지에서 파라미터만 바꿔서 사용하기 쉬움
  - 상세 페이지 OG는 `generateMetadata`(SSR) + `?id=` 쿼리 조합으로 처리

---

## 2. 배포·Middleware

- 이 프로젝트는 **Next.js SSR** (`next build` + `next start`) 로 운영한다. 정적 `out/` HTML 배포는 사용하지 않는다.
- **운영**: Node 프로세스(`npm run start`, 포트 3000) + nginx reverse proxy 권장.
- **인증·마이페이지 보호**: 현재는 클라이언트 가드(`useAuth`, `MypageShell` 등). Middleware 도입 가능하나 기존 클라이언트 가드와 중복되지 않게 설계할 것.
- **OG**: 아티클·비디오·세미나 상세는 서버 `generateMetadata`가 초기 HTML에 메타를 넣는다. 클라이언트 이동 시 `useDetailOpenGraphMeta`가 보조 갱신.

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

---

*마지막 정리: 2026년 기준. SSR 전환 후 `next start` 배포. 상세 OG는 `generateMetadata` 참고.*
