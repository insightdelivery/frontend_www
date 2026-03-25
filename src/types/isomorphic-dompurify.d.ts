declare module 'isomorphic-dompurify' {
  import type { Config } from 'dompurify'

  interface IsomorphicDOMPurify {
    sanitize(dirty: string, config?: Config): string
  }
  const DOMPurify: IsomorphicDOMPurify
  export default DOMPurify
}
