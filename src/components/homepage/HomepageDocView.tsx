import { notFound } from 'next/navigation'
import { fetchPublicHomepageDoc } from '@/services/homepageDoc'
import type { HomepageDocType } from '@/constants/homepageDoc'
import { HOMEPAGE_DOC_DEFAULT_TITLES } from '@/constants/homepageDoc'
import { sanitizeHomepageHtml } from '@/lib/sanitizeHomepageHtml'

export async function HomepageDocView({ docType }: { docType: HomepageDocType }) {
  const doc = await fetchPublicHomepageDoc(docType)
  if (!doc) notFound()
  const title = doc.title?.trim() || HOMEPAGE_DOC_DEFAULT_TITLES[docType]
  const html = sanitizeHomepageHtml(doc.bodyHtml || '')

  return (
    <main className="bg-white text-black min-h-screen">
      <div className="mx-auto max-w-[1220px] px-4 sm:px-6 md:px-8 py-10 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{title}</h1>
        <div
          className="mt-8 sm:mt-10 prose prose-gray max-w-none text-gray-700 [&_a]:text-blue-700 [&_img]:max-w-full [&_img]:h-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </main>
  )
}
