import type { Metadata } from 'next'
import { HomepageDocClientView } from '@/components/homepage/HomepageDocClientView'
import { homepageDocMetadataFallback } from '@/components/homepage/homepageDocMetadata'

export const metadata: Metadata = homepageDocMetadataFallback('privacy_policy')

export default function PrivacyPage() {
  return <HomepageDocClientView docType="privacy_policy" />
}
