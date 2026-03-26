/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  // false: /privacy → out/privacy.html (정적 호스팅이 /privacy 로 직접 매칭)
  // true: /privacy/ 만 실제 파일(privacy/index.html)과 일치 → /privacy 요청 시
  //       nginx/S3 등이 루트 index.html(SPA 폴백)로 떨어뜨려 메인이 보이는 현상 발생
  // `/s?code=`(short 공유)도 동일 — 빌드 후 scripts/postbuild-static-html-dual.mjs·public/_redirects 참고
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig


