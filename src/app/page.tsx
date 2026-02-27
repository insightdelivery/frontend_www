'use client'

import { Card } from '@/components/ui/card'
import Footer from '@/components/layout/Footer'

export default function Home() {
  return (
    <main className="bg-white text-black">
      {/* content width matches screenshot (lots of whitespace) */}
      <div className="mx-auto max-w-[1220px] px-4 sm:px-6 md:px-8 py-6 md:py-10">
        {/* Upcoming seminar */}
        <section className="mt-8 sm:mt-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] sm:text-[21px] font-black text-gray-800">다가오는 세미나</h2>
              <span className="text-brand-pink text-[14px] font-black">•</span>
            </div>
            <button className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors">
              더보기 &gt;
            </button>
          </div>

          <Card className="mt-4 overflow-hidden rounded-[18px] border border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row items-stretch gap-4 sm:gap-6 p-4 sm:p-6">
              <div className="h-[180px] sm:h-[200px] w-full sm:w-[260px] rounded-[14px] bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 rounded text-[10px] font-bold text-brand-pink bg-brand-pink/15">
                    NEXT SEMINAR
                  </span>
                  <span className="px-2 py-1 rounded text-[10px] font-bold text-gray-700 bg-gray-200">
                    D-3
                  </span>
                </div>
                <p className="text-[15px] sm:text-[17px] leading-[1.35] font-bold text-gray-900">
                  트렌드 쫓다 기회 놓쳐, 2026 브랜딩 필승 전략 3
                </p>
                <p className="mt-2 text-[12px] sm:text-[13px] text-gray-700">
                  진행자 PRPD/커스에드 | 대상 | 2025.07.28 (수) 20:00
                </p>
              </div>
              <div className="hidden sm:flex items-center pr-1 text-gray-600 text-lg">→</div>
            </div>
          </Card>
        </section>

        {/* Latest articles */}
        <section className="mt-8 sm:mt-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] sm:text-[22px] md:text-[25px] font-[800]">최신 아티클</h2>
              <span className="text-brand-pink text-[14px] font-black">•</span>
            </div>
            <button className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors">
              더보기 &gt;
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { title: '아티클 제목 (2줄까지 표현 가능) 아티클 제목 (2줄까지 표현 가능)', author: '인디데이 이리' },
              { title: '인사이트 가득한 책 표지 디자인 분석', author: '인디데이 이리' },
              { title: '성공적인 발표를 위한 제스처 가이드', author: '인디데이 이리' },
            ].map((a, idx) => (
              <div key={idx}>
                <div className="relative overflow-hidden rounded-[18px] border border-black/10 bg-white">
                  <div className="h-[180px] sm:h-[200px] md:h-[240px] bg-gradient-to-br from-stone-400 via-stone-500 to-stone-700" />
                  <div className="absolute left-4 top-4 rounded-full bg-neon-yellow px-[10px] py-[6px] text-[10px] font-extrabold text-black">
                    FREE/무료
                  </div>
                </div>
                <p className="mt-3 text-[16px] sm:text-[18px] font-extrabold leading-[1.35] line-clamp-2">
                  {a.title}
                </p>
                <p className="mt-1 text-[13px] sm:text-[14px] text-gray-500">{a.author}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Latest videos */}
        <section className="mt-8 sm:mt-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] sm:text-[22px] md:text-[25px] font-[800]">최신 비디오</h2>
              <span className="text-brand-pink text-[14px] font-black">•</span>
            </div>
            <button className="text-[12px] text-gray-400 hover:text-gray-700 transition-colors">
              더보기 &gt;
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { title: '비디오 제목 (2줄까지 표현 가능) 비디오 제목 (2줄까지 표현 가능)', author: '인디데이 이리' },
              { title: '디자인 엉뚱, 어디서 얻나요?', author: '인디데이 이리' },
              { title: '커리어 성장을 위한 조건', author: '인디데이 이리' },
            ].map((v, idx) => (
              <div key={idx}>
                <div className="relative overflow-hidden rounded-[18px] border border-black/10 bg-white">
                  <div className="h-[180px] sm:h-[200px] md:h-[240px] bg-gradient-to-br from-emerald-200 via-emerald-400 to-emerald-800" />
                  <div className="absolute left-4 top-4 rounded-full bg-neon-yellow px-[10px] py-[6px] text-[10px] font-extrabold text-black">
                    FREE/무료
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-[38px] w-[38px] rounded-full bg-white/25 border border-white/30 flex items-center justify-center text-white text-[11px]">
                      ▶
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-[16px] sm:text-[18px] font-extrabold leading-[1.35] line-clamp-2">
                  {v.title}
                </p>
                <p className="mt-1 text-[13px] sm:text-[14px] text-gray-500">{v.author}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Seminar Replay */}
        <section className="mt-8 sm:mt-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] sm:text-[22px] md:text-[25px] font-[800]">세미나 다시보기</h2>
              <span className="text-brand-pink text-[14px] font-black">•</span>
            </div>
            <button className="text-[12px] sm:text-[14px] text-gray-700 hover:text-gray-900 transition-colors">
              더보기 &gt;
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { title: '세미나 제목 (2줄까지 표현 가능)', instructor: '강사 이름' },
              { title: '디자이너를 위한 마케팅 기초', instructor: '강사 이름' },
              { title: '효과적인 커뮤니케이션 스킬', instructor: '강사 이름' },
            ].map((s, idx) => (
              <div key={idx}>
                <div className="relative overflow-hidden rounded-[18px] border border-black/10 bg-white">
                  <div className="h-[180px] sm:h-[200px] md:h-[240px] bg-gradient-to-br from-green-200 via-green-400 to-green-700" />
                  <div className="absolute left-4 top-4 rounded-full bg-neon-yellow px-[10px] py-[6px] text-[10px] font-extrabold text-black">
                    FREE/무료
                  </div>
                </div>
                <p className="mt-3 text-[16px] sm:text-[18px] font-extrabold leading-[1.35] line-clamp-2">
                  {s.title}
                </p>
                <p className="mt-1 text-[13px] sm:text-[14px] text-gray-500">{s.instructor}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}





