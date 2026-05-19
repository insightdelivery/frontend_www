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
   * `next dev` / `next start` 공통: 브라우저 → 동일 출처 → 공개 API로 프록시.
   * `NEXT_PUBLIC_API_URL` 이 비어 있을 때 axios baseURL '' + 이 rewrites 사용.
   * SSR 서버 fetch는 `src/lib/serverApi.ts` 가 `INDE_API_SERVER_URL` 또는 `NEXT_PUBLIC_API_URL` 로 직접 호출.
   */
  async rewrites() {
    const target = (process.env.INDE_PUBLIC_API_PROXY_TARGET || 'http://127.0.0.1:8001').replace(
      /\/$/,
      '',
    )
    const useRewrite =
      process.env.NODE_ENV === 'development' || process.env.INDE_USE_API_REWRITE === '1'
    if (!useRewrite) return []

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
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
