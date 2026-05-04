/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next 16+: /etc/hosts 로 접속 시 dev 번들·HMR 차단 방지
  allowedDevOrigins: [
    'local.inde.kr',
    'adminlocal.inde.kr',
    'apilocal.inde.kr',
    'admin-apilocal.inde.kr',
  ],
  /**
   * 로컬 `next dev` 전용: 브라우저 → 동일 출처 → 여기서 공개 API(8001)로 프록시.
   * CORS·Private Network Access 로 인한 Axios "Network Error" 방지.
   * `NEXT_PUBLIC_API_URL` 을 비우면 axios baseURL 이 '' 이고 이 rewrites 가 적용된다.
   * 정적 export(`output: 'export'`) 빌드에는 rewrites 미적용 — 프로덕션은 api.inde.kr 직접 호출.
   */
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return []
    const target = (process.env.INDE_PUBLIC_API_PROXY_TARGET || 'http://127.0.0.1:8001').replace(
      /\/$/,
      '',
    )
    return [
      { source: '/auth/:path*', destination: `${target}/auth/:path*` },
      { source: '/api/:path*', destination: `${target}/api/:path*` },
      { source: '/me', destination: `${target}/me` },
      { source: '/me/', destination: `${target}/me/` },
      { source: '/me/:path*', destination: `${target}/me/:path*` },
      { source: '/profile/:path*', destination: `${target}/profile/:path*` },
      { source: '/systemmanage/:path*', destination: `${target}/systemmanage/:path*` },
    ]
  },
  output: 'export',
  // false: /privacy → out/privacy.html (정적 호스팅이 /privacy 로 직접 매칭)
  // true: /privacy/ 만 실제 파일(privacy/index.html)과 일치 → /privacy 요청 시
  //       nginx/S3 등이 루트 index.html(SPA 폴백)로 떨어뜨려 메인이 보이는 현상 발생
  // `/video`·`/article` 등 — 빌드 후 `scripts/postbuild-static-html-dual.mjs`로 `*.html` → `*/index.html` 복제.
  // 복제 없으면 일부 CDN이 `/video`를 못 찾아 루트 `index.html`(메인)만 줌. `public/_redirects`는 `/s` 등 보조.
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig


