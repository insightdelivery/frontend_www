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
  { html: 'privacy.html', dir: 'privacy' },
  { html: 'terms.html', dir: 'terms' },
  { html: path.join('about', 'companyInfo.html'), dir: path.join('about', 'companyInfo') },
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
