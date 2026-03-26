/**
 * 정적 호스팅에서 `/privacy` 새로고침 시 루트 index.html(메인)로 떨어지는 문제 완화.
 * Next `trailingSlash: false` 산출물은 `privacy.html` 형태인데, 많은 CDN/S3 설정은
 * `/privacy/` → `privacy/index.html` 만 찾거나, 디렉터리 인덱스만 켜져 있음.
 * → 동일 HTML을 `<path>/index.html`로도 복제해 두 경로 모두에서 본문이 서빙되게 함.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'out')

/** { 소스: out 기준 .html 경로, 대상: out 기준 디렉터리 (그 안에 index.html) } */
const DUAL_ROUTES = [
  // short 공유 `/s?code=` — `s.html`만 있고 `/s` 매핑이 없는 CDN이 index.html(메인)을 주는 문제 방지
  { html: 's.html', dir: 's' },
  { html: 'privacy.html', dir: 'privacy' },
  { html: 'terms.html', dir: 'terms' },
  { html: path.join('about', 'companyInfo.html'), dir: path.join('about', 'companyInfo') },
  // 아티클: /article·/article/category 새로고침 시 index.html 폴백만 있는 CDN에서 메인으로 떨어지는 문제 방지
  { html: 'article.html', dir: 'article' },
  { html: path.join('article', 'category.html'), dir: path.join('article', 'category') },
  { html: path.join('article', 'editor.html'), dir: path.join('article', 'editor') },
  { html: path.join('article', 'detail.html'), dir: path.join('article', 'detail') },
  // 비디오·세미나·게시 — `video.html`만 있을 때 일부 CDN이 `/video` → `video/index.html`을 찾다 없으면 루트 index(메인)로 폴백
  { html: 'video.html', dir: 'video' },
  { html: path.join('video', 'detail.html'), dir: path.join('video', 'detail') },
  { html: 'seminar.html', dir: 'seminar' },
  { html: path.join('seminar', 'detail.html'), dir: path.join('seminar', 'detail') },
  { html: 'notice.html', dir: 'notice' },
  { html: 'faq.html', dir: 'faq' },
  { html: 'search.html', dir: 'search' },
  { html: 'login.html', dir: 'login' },
  { html: 'register.html', dir: 'register' },
  { html: 'inquiry.html', dir: 'inquiry' },
  { html: path.join('inquiry', 'write.html'), dir: path.join('inquiry', 'write') },
  { html: path.join('signup', 'complete.html'), dir: path.join('signup', 'complete') },
  { html: path.join('signup', 'complete-profile.html'), dir: path.join('signup', 'complete-profile') },
  { html: path.join('signup', 'phone.html'), dir: path.join('signup', 'phone') },
  { html: path.join('auth', 'verify-email.html'), dir: path.join('auth', 'verify-email') },
  { html: path.join('auth', 'callback.html'), dir: path.join('auth', 'callback') },
  { html: 'profile.html', dir: 'profile' },
  // 마이페이지 — 전 탭·루트(redirect) 동일 이슈
  { html: 'mypage.html', dir: 'mypage' },
  { html: path.join('mypage', 'info.html'), dir: path.join('mypage', 'info') },
  { html: path.join('mypage', 'library.html'), dir: path.join('mypage', 'library') },
  { html: path.join('mypage', 'bookmarks.html'), dir: path.join('mypage', 'bookmarks') },
  { html: path.join('mypage', 'ratings.html'), dir: path.join('mypage', 'ratings') },
  { html: path.join('mypage', 'highlights.html'), dir: path.join('mypage', 'highlights') },
  { html: path.join('mypage', 'support.html'), dir: path.join('mypage', 'support') },
  { html: path.join('mypage', 'applied-questions.html'), dir: path.join('mypage', 'applied-questions') },
]

function copyHtmlToIndex(relHtml, relDir) {
  const src = path.join(outDir, relHtml)
  const destDir = path.join(outDir, relDir)
  const dest = path.join(destDir, 'index.html')
  if (!fs.existsSync(src)) {
    console.warn('[postbuild-static-html-dual] skip (missing):', relHtml)
    return
  }
  fs.mkdirSync(destDir, { recursive: true })
  fs.copyFileSync(src, dest)
  console.log('[postbuild-static-html-dual]', relHtml, '→', path.join(relDir, 'index.html'))
}

function main() {
  if (!fs.existsSync(outDir)) {
    console.error('[postbuild-static-html-dual] out/ not found. Run next build first.')
    process.exit(1)
  }
  for (const { html, dir } of DUAL_ROUTES) {
    copyHtmlToIndex(html, dir)
  }
}

main()
