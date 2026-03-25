import type { Metadata } from 'next'
import { homepageDocMetadataAtBuild } from '@/components/homepage/homepageDocMetadata'
import { CompanyIntroDocPage } from './CompanyIntroDocPage'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateMetadata(): Promise<Metadata> {
  return homepageDocMetadataAtBuild('company_intro')
}

export default CompanyIntroDocPage
