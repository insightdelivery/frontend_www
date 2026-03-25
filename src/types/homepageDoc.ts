import type { HomepageDocType } from '@/constants/homepageDoc'

export type { HomepageDocType }

export interface HomepageDocPayload {
  docType: string
  title: string | null
  bodyHtml: string
  isPublished: boolean
}
