export default function PricingTable() {
  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold">플랜 비교</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border p-4">FREE</div>

        <div className="rounded-xl border p-4">BASIC</div>

        <div className="rounded-xl border-2 border-black p-4">
          <p className="font-bold">PRO (추천)</p>
        </div>
      </div>
    </section>
  )
}
