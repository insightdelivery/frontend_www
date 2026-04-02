'use client'

import { useEffect, useMemo, useState } from 'react'
import apiClient from '@/lib/axios'
import { getUserInfo } from '@/services/auth'

type PlanType = 'FREE' | 'PRO' | 'PREMIUM'
type DurationType = '1M' | '6M'

const PLAN_LABEL: Record<PlanType, string> = {
  FREE: '무료 (FREE)',
  PRO: '프로 (PRO)',
  PREMIUM: '프리미엄 (PREMIUM)',
}

const PLAN_DESCRIPTION: Record<PlanType, string> = {
  FREE: '기본 콘텐츠 이용',
  PRO: '아티클/영상 이용 (세미나 제외)',
  PREMIUM: '아티클/영상/세미나 전체 이용',
}

const PLAN_COMMENTS: Record<PlanType, string[]> = {
  FREE: ['기본 무료 콘텐츠 이용', '서비스 및 UI 체험용으로 시작 가능'],
  PRO: ['아티클 + 영상 전체 이용', '세미나 콘텐츠는 제외', '개인 학습 중심 이용자에게 추천'],
  PREMIUM: ['아티클 + 영상 + 세미나 전체 이용', '라이브/다시보기 포함 확장 학습', '가장 완전한 이용권'],
}

const PLAN_BG_CLASS: Record<PlanType, string> = {
  FREE: 'bg-sky-100',
  PRO: 'bg-violet-100',
  PREMIUM: 'bg-amber-100',
}

const PLAN_TEXT_CLASS: Record<PlanType, string> = {
  FREE: 'text-sky-800',
  PRO: 'text-violet-800',
  PREMIUM: 'text-amber-800',
}

const PLAN_DURATION_OPTIONS: Record<PlanType, DurationType[]> = {
  FREE: [],
  PRO: ['1M', '6M'],
  PREMIUM: ['1M', '6M'],
}

const PLAN_PRICE: Record<PlanType, Partial<Record<DurationType, number>>> = {
  FREE: {},
  PRO: { '1M': 19900, '6M': 108000 },
  PREMIUM: { '1M': 29900, '6M': 168000 },
}

type IamportResponse = {
  success: boolean
  imp_uid?: string
  merchant_uid?: string
  paid_amount?: number
  error_msg?: string
}

type IamportRequestPayload = {
  pg: string
  pay_method: string
  merchant_uid: string
  name: string
  amount: number
  buyer_email?: string
  buyer_name?: string
}

type IamportGlobal = {
  init: (merchantCode: string) => void
  request_pay: (payload: IamportRequestPayload, callback: (rsp: IamportResponse) => void) => void
}

const IAMPORT_SCRIPT_SRC = 'https://cdn.iamport.kr/v1/iamport.js'

export default function CheckoutPage() {
  const [plan, setPlan] = useState<PlanType>('PRO')
  const [duration, setDuration] = useState<DurationType>('1M')
  const [processing, setProcessing] = useState(false)

  const durationOptions = PLAN_DURATION_OPTIONS[plan]

  const finalDuration = useMemo<DurationType | null>(() => {
    if (plan === 'FREE') return null
    return durationOptions.includes(duration) ? duration : durationOptions[0]
  }, [duration, durationOptions, plan])

  const price = useMemo(() => {
    if (!finalDuration) return 0
    return PLAN_PRICE[plan][finalDuration] ?? 0
  }, [finalDuration, plan])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${IAMPORT_SCRIPT_SRC}"]`)
    if (existing) return
    const script = document.createElement('script')
    script.src = IAMPORT_SCRIPT_SRC
    script.async = true
    document.body.appendChild(script)
  }, [])

  const handlePay = async () => {
    if (plan === 'FREE') {
      window.alert('무료 플랜은 결제가 필요하지 않습니다.')
      return
    }
    if (!finalDuration) {
      window.alert('기간을 선택해 주세요.')
      return
    }
    if (processing) return

    const merchantCode = process.env.NEXT_PUBLIC_IAMPORT_MERCHANT_CODE
    if (!merchantCode) {
      window.alert('결제 설정이 누락되었습니다. NEXT_PUBLIC_IAMPORT_MERCHANT_CODE를 확인해 주세요.')
      return
    }

    const IMP = (window as Window & { IMP?: IamportGlobal }).IMP
    if (!IMP) {
      window.alert('결제 모듈 로딩 중입니다. 잠시 후 다시 시도해 주세요.')
      return
    }

    setProcessing(true)
    try {
      IMP.init(merchantCode)

      const user = getUserInfo()
      const merchantUid = `order_${Date.now()}_${Math.floor(Math.random() * 10000)}`
      const orderName = `${PLAN_LABEL[plan]} ${finalDuration === '1M' ? '1개월' : '6개월'} 이용권`

      await new Promise<void>((resolve, reject) => {
        IMP.request_pay(
          {
            pg: 'html5_inicis',
            pay_method: 'card',
            merchant_uid: merchantUid,
            name: orderName,
            amount: price,
            buyer_email: user?.email,
            buyer_name: user?.name ?? user?.nickname,
          },
          async (rsp) => {
            if (!rsp.success || !rsp.imp_uid || !rsp.merchant_uid) {
              reject(new Error(rsp.error_msg || '결제가 취소되었거나 실패했습니다.'))
              return
            }

            try {
              await apiClient.post('/api/payment/complete', {
                imp_uid: rsp.imp_uid,
                merchant_uid: rsp.merchant_uid,
                plan,
                duration: finalDuration,
              })
              resolve()
            } catch (error) {
              reject(error)
            }
          },
        )
      })

      window.alert('결제가 완료되었습니다.')
    } catch (error) {
      const message = error instanceof Error ? error.message : '결제 처리 중 오류가 발생했습니다.'
      window.alert(message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <main className="mx-auto max-w-[900px] space-y-6 px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">결제</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">플랜 선택</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {(Object.keys(PLAN_LABEL) as PlanType[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setPlan(key)
                const nextDuration = PLAN_DURATION_OPTIONS[key][0]
                if (nextDuration) setDuration(nextDuration)
              }}
              className={`min-h-[340px] rounded-2xl border-2 p-5 text-left shadow-sm transition-all flex flex-col items-start justify-start ${PLAN_BG_CLASS[key]} ${
                plan === key
                  ? 'border-black ring-4 ring-black/20 shadow-md scale-[1.01]'
                  : 'border-gray-300 hover:shadow-md'
              }`}
            >
              <span
                className={`inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold ${PLAN_TEXT_CLASS[key]}`}
              >
                {PLAN_LABEL[key]} 플랜
              </span>
              <p className={`mt-3 text-xl font-extrabold ${PLAN_TEXT_CLASS[key]}`}>{PLAN_LABEL[key]}</p>
              <div className="mt-4 w-full border-t border-gray-300/80" />
              <div className="mt-6 w-full">
                <p className="text-sm font-medium text-gray-800">{PLAN_DESCRIPTION[key]}</p>
                <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {PLAN_COMMENTS[key].map((comment) => (
                  <li key={comment} className="flex items-start gap-2">
                    <span className="mt-[2px] text-black">•</span>
                    <span>{comment}</span>
                  </li>
                ))}
                </ul>
              </div>
            </button>
          ))}
        </div>
      </section>

      {plan !== 'FREE' ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">기간 선택</h2>
          <div className="grid grid-cols-2 gap-3">
            {durationOptions.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setDuration(key)}
                className={`rounded-xl border p-3 text-sm font-medium ${
                  finalDuration === key ? 'border-black bg-gray-50' : 'border-gray-200'
                }`}
              >
                {key === '1M' ? '1개월' : '6개월'}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border-2 border-black bg-gradient-to-r from-gray-50 to-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-700">선택 상품</p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-2xl font-extrabold tracking-tight">
              {PLAN_LABEL[plan]}
              {finalDuration ? ` / ${finalDuration === '1M' ? '1개월' : '6개월'}` : ''}
            </p>
            <p className="mt-1 text-sm text-gray-600">{PLAN_DESCRIPTION[plan]}</p>
          </div>
          <div className="rounded-xl bg-black px-4 py-3 text-white">
            <p className="text-xs text-gray-200">결제 금액</p>
            <p className="text-2xl font-extrabold">{price.toLocaleString()}원</p>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => void handlePay()}
        disabled={processing}
        className="w-full rounded-xl bg-black py-4 text-white disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {processing ? '처리 중...' : plan === 'FREE' ? '무료로 시작하기' : '결제하기'}
      </button>
    </main>
  )
}
