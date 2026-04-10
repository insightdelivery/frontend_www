import type { Metadata } from 'next'
import { HomepageDocClientView } from '@/components/homepage/HomepageDocClientView'
import { homepageDocMetadataFallback } from '@/components/homepage/homepageDocMetadata'

export const metadata: Metadata = homepageDocMetadataFallback('company_intro')

export default function CompanyInfoPage() {
  /** `#partners` 앵커는 관리자 본문 `<h2 id="partners">`에 둠 */
  return <HomepageDocClientView docType="company_intro" />
}
