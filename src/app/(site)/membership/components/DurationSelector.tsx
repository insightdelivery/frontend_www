'use client'

import { useState } from 'react'

export default function DurationSelector() {
  const [duration, setDuration] = useState('1M')

  const prices = {
    '1M': 9900,
    '6M': 54000,
    '12M': 99000,
  }

  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">기간 선택</h2>

      <div className="space-y-2">
        {Object.entries(prices).map(([key, price]) => (
          <div
            key={key}
            onClick={() => setDuration(key)}
            className={`cursor-pointer rounded-xl border p-4 ${duration === key ? 'border-black' : ''}`}
          >
            {key} - {price.toLocaleString()}원
          </div>
        ))}
      </div>
    </section>
  )
}
