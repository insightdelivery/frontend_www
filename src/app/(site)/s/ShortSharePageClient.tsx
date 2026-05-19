'use client'

import ShortShareRedirectClient from '@/components/share/ShortShareRedirectClient'

export default function ShortSharePageClient({ code }: { code: string }) {
  return <ShortShareRedirectClient code={code} />
}
