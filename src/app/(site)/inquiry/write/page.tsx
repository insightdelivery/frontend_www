import { redirect } from 'next/navigation'

/** @deprecated 마이페이지 1:1 문의 작성으로 통합 */
export default function InquiryWriteRedirectPage() {
  redirect('/mypage/support/write')
}
