import type { Metadata } from 'next'
import { HomepageDocView } from '@/components/homepage/HomepageDocView'
import { homepageDocMetadata } from '@/components/homepage/homepageDocMetadata'

export async function generateMetadata(): Promise<Metadata> {
  return homepageDocMetadata('terms_of_service')
}

export default async function TermsPage() {
  return <HomepageDocView docType="terms_of_service" />
}
