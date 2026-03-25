import type { Metadata } from 'next'
import { homepageDocMetadataAtBuild } from '@/components/homepage/homepageDocMetadata'
import { TermsDocPage } from './TermsDocPage'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(): Promise<Metadata> {
  return homepageDocMetadataAtBuild('terms_of_service')
}

export default TermsDocPage
