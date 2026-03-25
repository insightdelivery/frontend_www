import type { Metadata } from 'next'
import { HomepageDocClientView } from '@/components/homepage/HomepageDocClientView'
import { homepageDocMetadataFallback } from '@/components/homepage/homepageDocMetadata'

export const metadata: Metadata = homepageDocMetadataFallback('terms_of_service')

export default function TermsPage() {
  return <HomepageDocClientView docType="terms_of_service" />
}
