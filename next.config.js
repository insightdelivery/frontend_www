/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  // / 있던 없던 접근 가능: 빌드 시 path/index.html 생성 → /terms, /terms/ 모두 서빙 가능
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig


