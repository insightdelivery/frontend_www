'use client'

import { useState, useEffect } from 'react'
import { fetchFAQs } from '@/services/board'
import type { FAQItem } from '@/types/board'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Footer from '@/components/layout/Footer'

export default function FAQPage() {
  const [items, setItems] = useState<FAQItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchFAQs({ page_size: 100 })
      .then((res) => {
        if (!cancelled) setItems(Array.isArray(res.results) ? res.results : [])
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'FAQ를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[720px] px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">FAQ</h1>
        <p className="mt-1 text-sm text-gray-500">자주 묻는 질문입니다.</p>

        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">자주 묻는 질문</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (items ?? []).length === 0 ? (
              <p className="text-center text-gray-500 py-8">등록된 FAQ가 없습니다.</p>
            ) : (
              <Accordion type="single" defaultValue={null}>
                {(items ?? []).map((item) => (
                  <AccordionItem key={item.id} value={`faq-${item.id}`}>
                    <AccordionTrigger className="text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div
                        className="prose prose-sm text-gray-700 max-w-none"
                        dangerouslySetInnerHTML={{ __html: item.answer || '' }}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </main>
  )
}
