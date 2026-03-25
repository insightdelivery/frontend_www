import type { Metadata } from 'next'
import { HomepageDocView } from '@/components/homepage/HomepageDocView'
import { homepageDocMetadata } from '@/components/homepage/homepageDocMetadata'

export async function generateMetadata(): Promise<Metadata> {
  return homepageDocMetadata('company_intro')
}

export default async function CompanyInfoPage() {
  return <HomepageDocView docType="company_intro" />
}
