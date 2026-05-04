/** GA4 gtag.js — `googleAnalyticsPlan.md` §0 */
export {}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}
