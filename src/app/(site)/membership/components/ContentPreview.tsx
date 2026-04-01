export default function ContentPreview() {
  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold">인기 콘텐츠</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="relative rounded-xl border p-4">
            <div className="mb-2 h-32 rounded bg-gray-200" />

            <p>콘텐츠 제목 {item}</p>

            <div className="absolute inset-0 flex items-center justify-center bg-white/70">🔒 PRO 전용</div>
          </div>
        ))}
      </div>
    </section>
  )
}
