import type { Metadata } from 'next'
import { HomepageDocClientView } from '@/components/homepage/HomepageDocClientView'
import { homepageDocMetadataFallback } from '@/components/homepage/homepageDocMetadata'

export const metadata: Metadata = homepageDocMetadataFallback('company_intro')

export default function CompanyInfoPage() {
  return <HomepageDocClientView docType="company_intro" />
}
