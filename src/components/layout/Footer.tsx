export default function Footer() {
  return (
    <footer className="mt-8 sm:mt-10 bg-[#F8F8F8]">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 md:px-8 py-10 sm:py-16 md:py-20">
        {/* Top Section - Three Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Left Column - Company Introduction */}
          <div className="md:col-span-1">
            <h3 className="text-xl sm:text-2xl font-black text-gray-800">InDe</h3>
            <p className="mt-4 sm:mt-5 text-[11px] sm:text-[12px] leading-[1.6] text-gray-600 max-w-full md:max-w-[360px]">
              InDe는 (들어오는) 말씀과 (드러나는) 삶을 연결하는 크리스천 인사이트 플랫폼으로, 정기적인 콘텐츠를 통해 세상의 개념과 정의를 복음으로 조명하고, 매주 듣는 말씀을 일상의 언어와 시각으로 적용할 수 있도록 돕습니다.
            </p>
          </div>

          {/* Middle Column - Site Menu (Figma: 메인, 이용약관, 비디오, 개인정보처리방침, 세미나, 공지사항, FAQ) */}
          <div>
            <p className="text-[12px] font-extrabold text-gray-700">사이트 메뉴</p>
            <ul className="mt-4 sm:mt-5 space-y-2 text-[12px] text-gray-600">
              <li><a href="/" className="hover:text-gray-900 transition-colors">HOME</a></li>
              <li><a href="/terms" className="hover:text-gray-900 transition-colors">이용약관</a></li>
              <li><a href="/privacy" className="hover:text-gray-900 transition-colors">개인정보처리방침</a></li>
              <li><a href="/notice" className="hover:text-gray-900 transition-colors">공지사항</a></li>
              <li><a href="/faq" className="hover:text-gray-900 transition-colors">FAQ</a></li>
              <li><a href="/inquiry" className="hover:text-gray-900 transition-colors">1:1 문의</a></li>
            </ul>
          </div>

          {/* Right Column - Customer Support (Figma: 고객지원 + Facebook, Instagram, YouTube) */}
          <div>
            <p className="text-[12px] font-extrabold text-gray-700">고객지원</p>
            <div className="mt-4 sm:mt-5 flex gap-4 sm:gap-6 text-[12px] font-normal text-gray-700 tracking-wide">
              <a href="#" className="hover:text-gray-900 transition-colors" aria-label="Facebook">Facebook</a>
              <a href="#" className="hover:text-gray-900 transition-colors" aria-label="Instagram">Instagram</a>
              <a href="#" className="hover:text-gray-900 transition-colors" aria-label="YouTube">YouTube</a>
            </div>
          </div>
        </div>

        {/* Middle Separator Line */}
        <div className="mt-8 sm:mt-12 md:mt-14 border-t border-gray-200"></div>

        {/* Bottom Section */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          {/* Left Side - Company Legal and Contact Information */}
          <div className="space-y-2 text-[12px] sm:text-[14px] text-gray-700">
            <p className="break-words">
              사업자등록번호 : 203-87-02097| 통신판매업신고: 000000000000 | 개인정보책임자 : xxxxxxxx
            </p>
            <p className="break-words">
            서울특별시 성동구 광나루로8길 31, 2동 301호(성수동2가, 성수SKV1센터) I 이메일: indemgz@gmail.com | 대표이사 : 조광식 
            </p>
            <p className="mt-3 sm:mt-4">Copyright ⓒ 2024. InDe All Rights Reserved</p>
          </div>

          {/* Right Side - Social Media Links */}
          <div className="flex gap-4 sm:gap-6 text-[12px] sm:text-[14px] font-normal text-gray-700 tracking-wide flex-shrink-0">
            <span>FACEBOOK</span>
            <span>INSTAGRAM</span>
            <span>YOUTUBE</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

