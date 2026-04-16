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


