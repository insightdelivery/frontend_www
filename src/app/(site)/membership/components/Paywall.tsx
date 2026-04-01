export default function Paywall() {
  return (
    <div className="relative">
      <div className="blur-sm">콘텐츠 내용 일부...</div>

      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80">
        <p className="mb-4">🔒 PRO 이용권 필요</p>
        <button className="rounded bg-black px-6 py-2 text-white">구독하고 계속보기</button>
      </div>
    </div>
  )
}
