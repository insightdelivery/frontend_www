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
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class', 'style'],
}

export function sanitizeHomepageHtml(html: string): string {
  return DOMPurify.sanitize(html || '', {
    ALLOWED_TAGS: [...CONFIG.ALLOWED_TAGS],
    ALLOWED_ATTR: [...CONFIG.ALLOWED_ATTR],
  })
}
