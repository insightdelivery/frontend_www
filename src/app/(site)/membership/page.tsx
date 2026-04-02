'use client'

import CTASection from './components/CTASection'
import ContentPreview from './components/ContentPreview'
import DurationSelector from './components/DurationSelector'
import Hero from './components/Hero'
import PricingTable from './components/PricingTable'

export default function MembershipPage() {
  return (
    <main className="mx-auto max-w-[900px] space-y-16 px-4 py-10">
      <Hero />
      <ContentPreview />
      <PricingTable />
      <DurationSelector />
      <CTASection />
    </main>
  )
}
