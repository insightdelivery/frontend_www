import type { Metadata } from 'next'
import { homepageDocMetadataAtBuild } from '@/components/homepage/homepageDocMetadata'
import { PrivacyDocPage } from './PrivacyDocPage'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(): Promise<Metadata> {
  return homepageDocMetadataAtBuild('privacy_policy')
}

export default PrivacyDocPage
