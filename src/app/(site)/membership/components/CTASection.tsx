'use client'

import { useRouter } from 'next/navigation'

export default function CTASection() {
  const router = useRouter()

  return (
    <section className="text-center">
      <button
        onClick={() => router.push('/membership/checkout')}
        className="rounded-xl bg-black px-8 py-4 text-white"
      >
        이용권 구매하기
      </button>
    </section>
  )
}
