/**
 * wwwDocEtc.md §8.4 — DOMPurify (SSR: isomorphic-dompurify)
 */
import DOMPurify from 'isomorphic-dompurify'

const CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'em',
    'b',
    'i',
    'u',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'a',
    'img',
    'span',
    'div',
  ],
  /** `id` — 관리자 본문의 앵커(#partners 등) 유지 */
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class', 'style', 'id'],
}

export function sanitizeHomepageHtml(html: string): string {
  return DOMPurify.sanitize(html || '', {
    ALLOWED_TAGS: [...CONFIG.ALLOWED_TAGS],
    ALLOWED_ATTR: [...CONFIG.ALLOWED_ATTR],
  })
}
