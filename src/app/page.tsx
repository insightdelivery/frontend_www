'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'

export default function Home() {
  return (
    <main className="bg-white text-black">
      <div className="mx-auto max-w-[1220px] px-4 sm:px-6 md:px-8 py-6 md:py-10">
        {/* Hero Section (Director's Pick) - Figma 1:238 */}
        <section className="mb-16 overflow-hidden rounded-[12px] bg-[#f3f4f6]">
          <div className="relative min-h-[320px] sm:min-h-[400px] md:min-h-[521px] w-full">
            {/* Background image placeholder (gradient when no image) */}
            <div
              className="absolute inset-0 opacity-90"
              style={{
                background:
                  'linear-gradient(180deg, #374151 0%, #1f2937 50%, #111827 100%)',
              }}
            />
            {/* Overlay gradient: bottom dark for text readability */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
              }}
            />
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-12">
              <div className="pb-4">
                <span className="inline-block rounded-full bg-[#e1f800] px-3 py-1 font-bold text-[12px] uppercase tracking-[0.3px] text-black">
                  Director&apos;s Pick
                </span>
              </div>
              <h1 className="font-black text-white text-[32px] leading-[1.1] sm:text-[40px] md:text-[48px] md:leading-[48px]">
                소망의 시작, 파격적이고 명료한 복음이 바꾸는 당신의 일상
              </h1>
              <p className="mt-2 max-w-[672px] font-normal text-[18px] text-white/80 sm:text-[20px] sm:leading-[28px]">
                디렉터 추천 콘텐츠 - 아티클, 비디오 등 디렉터가 엄선한 5개의
                콘텐츠를 만나보세요.
              </p>
              {/* Carousel indicators */}
              <div className="mt-6 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-white" />
                <span className="h-3 w-3 rounded-full bg-white/40" />
                <span className="h-3 w-3 rounded-full bg-white/40" />
                <span className="h-3 w-3 rounded-full bg-white/40" />
                <span className="h-3 w-3 rounded-full bg-white/40" />
              </div>
            </div>
          </div>
        </section>

        {/* 다가오는 세미나 - Figma 1:260, dot #e1f800 */}
        <section className="mt-16 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-black text-[24px] leading-[32px]">
                다가오는 세미나
              </h2>
              <span className="h-2 w-2 rounded-full bg-[#e1f800]" />
            </div>
            <Link
              href="/seminar"
              className="font-medium text-[#6b7280] text-[14px] hover:text-black"
            >
              더보기 &gt;
            </Link>
          </div>

          <Link href="/seminar/detail?id=1">
            <Card className="overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white p-[25px] transition-shadow hover:shadow-md">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch">
                <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-[8px] bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400 sm:w-[200px]" />
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-bold text-[#ea90ff] text-[14px] uppercase">
                      next seminar
                    </span>
                    <span className="rounded-[8px] bg-[#f3f4f6] px-2 py-0.5 font-normal text-[#4b5563] text-[12px]">
                      D-3
                    </span>
                  </div>
                  <p className="font-bold text-black text-[20px] leading-[28px]">
                    트렌드 쫓다 기회 놓쳐, 2026 브랜딩 필승 전략 3
                  </p>
                  <p className="mt-1 font-normal text-[#6b7280] text-[14px] leading-[20px]">
                    권영욱 PRPD(프리패드) 대표
                  </p>
                  <p className="font-normal text-[#6b7280] text-[12px] leading-[16px] opacity-70">
                    외 1명 | 2024.01.29 (목) 20:00
                  </p>
                </div>
                <div className="hidden items-center text-[#6b7280] sm:flex">
                  →
                </div>
              </div>
            </Card>
          </Link>
        </section>

        {/* 최신 아티클 - Figma 1:286, dot #ff9f8a */}
        <section className="mt-16 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-black text-[24px] leading-[32px]">
                최신 아티클
              </h2>
              <span className="h-2 w-2 rounded-full bg-[#ff9f8a]" />
            </div>
            <Link
              href="/article"
              className="font-medium text-[#6b7280] text-[14px] hover:text-black"
            >
              더보기 &gt;
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title:
                  '아티클 제목 (2줄까지 표현 가능) 아티클 제목 (2줄까지 표현 가능)',
                category: '카테고리명',
                id: '1',
              },
              {
                title: '인사이트 가득한 책 표지 디자인 분석',
                category: '카테고리명',
                id: '2',
              },
              {
                title: '성공적인 발표를 위한 제스처 가이드',
                category: '카테고리명',
                id: '3',
              },
            ].map((a) => (
              <Link key={a.id} href={`/article/detail?id=${a.id}`}>
                <div className="group">
                  <div className="relative overflow-hidden rounded-[8px] bg-[#f3f4f6]">
                    <div className="aspect-[4/3] bg-gradient-to-br from-stone-400 via-stone-500 to-stone-700" />
                    <span className="absolute left-3 top-3 rounded-[8px] bg-[#e1f800] px-2 py-1 font-bold text-black text-[10px]">
                      {a.category}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 font-bold text-black text-[18px] leading-[24.75px] group-hover:underline">
                    {a.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 최신 비디오 - Figma 1:315, dot #ea90ff */}
        <section className="mt-16 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-black text-[24px] leading-[32px]">
                최신 비디오
              </h2>
              <span className="h-2 w-2 rounded-full bg-[#ea90ff]" />
            </div>
            <Link
              href="/video"
              className="font-medium text-[#6b7280] text-[14px] hover:text-black"
            >
              더보기 &gt;
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title:
                  '비디오 제목 (2줄까지 표현 가능) 비디오 제목 (2줄까지 표현 가능)',
                category: '카테고리명',
                author: '인터뷰이 이름',
                id: '1',
              },
              {
                title: '디자인 영감, 어디서 얻나요?',
                category: '카테고리명',
                author: '인터뷰이 이름',
                id: '2',
              },
              {
                title: '커리어 성장을 위한 조언',
                category: '카테고리명',
                author: '인터뷰이 이름',
                id: '3',
              },
            ].map((v) => (
              <Link key={v.id} href={`/video/detail?id=${v.id}`}>
                <div className="group">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] bg-[#f3f4f6]">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 via-emerald-400 to-emerald-800" />
                    <span className="absolute left-3 top-3 rounded-[8px] bg-[#e1f800] px-2 py-1 font-bold text-black text-[10px]">
                      {v.category}
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/20 backdrop-blur-[2px] text-white">
                        ▶
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 font-bold text-black text-[18px] leading-[24.75px] group-hover:underline">
                    {v.title}
                  </p>
                  <p className="mt-1 font-normal text-[#6b7280] text-[12px] leading-[16px]">
                    {v.author}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 세미나 다시보기 - Figma 1:365, dot #ffdf38 */}
        <section className="mt-16 flex flex-col gap-6 pb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-black text-[24px] leading-[32px]">
                세미나 다시보기
              </h2>
              <span className="h-2 w-2 rounded-full bg-[#ffdf38]" />
            </div>
            <Link
              href="/seminar"
              className="font-medium text-[#6b7280] text-[14px] hover:text-black"
            >
              더보기 &gt;
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: '세미나 제목 (2줄까지 표현 가능)',
                category: '카테고리명',
                instructor: '강사 이름',
                id: '1',
              },
              {
                title: '디자이너를 위한 마케팅 기초',
                category: '카테고리명',
                instructor: '강사 이름',
                id: '2',
              },
              {
                title: '효과적인 커뮤니케이션 스킬',
                category: '카테고리명',
                instructor: '강사 이름',
                id: '3',
              },
            ].map((s) => (
              <Link key={s.id} href={`/seminar/detail?id=${s.id}`}>
                <div className="group">
                  <div className="relative overflow-hidden rounded-[8px] bg-[#f3f4f6]">
                    <div className="aspect-[4/3] bg-gradient-to-br from-green-200 via-green-400 to-green-700" />
                    <span className="absolute left-3 top-3 rounded-[8px] bg-[#e1f800] px-2 py-1 font-bold text-black text-[10px]">
                      {s.category}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 font-bold text-black text-[18px] leading-[24.75px] group-hover:underline">
                    {s.title}
                  </p>
                  <p className="mt-1 font-normal text-[#6b7280] text-[12px] leading-[16px]">
                    {s.instructor}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
