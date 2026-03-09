'use client'

import { useState } from 'react'

export default function MypageSupportPage() {
  const [agree, setAgree] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[896px] rounded-xl border border-[#e5e7eb] bg-white px-[33px] pb-[49px] pt-[33px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <form className="flex flex-col gap-8">
          {/* 성함, 이메일 2열: 읽기 전용 */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium leading-5 text-[#111827]">성함</label>
              <div className="rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] px-4 py-3">
                <span className="text-[16px] leading-6 text-[#6b7280]">최호경</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium leading-5 text-[#111827]">이메일</label>
              <div className="rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] px-4 py-3">
                <span className="text-[16px] leading-6 text-[#6b7280]">juotte@naver.com</span>
              </div>
            </div>
          </div>

          {/* 문의 유형 */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium leading-5 text-[#111827]">문의 유형</label>
            <select
              className="h-[50px] w-full rounded-lg border border-[#e5e7eb] bg-white px-4 text-[16px] leading-6 text-[#111827]"
              defaultValue=""
            >
              <option value="">문의 유형을 선택해 주세요</option>
              <option value="usage">이용 문의</option>
              <option value="payment">결제 문의</option>
              <option value="etc">기타</option>
            </select>
          </div>

          {/* 제목 */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium leading-5 text-[#111827]">제목</label>
            <input
              type="text"
              placeholder="제목을 입력해 주세요"
              className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-3.5 text-[16px] leading-6 text-[#111827] placeholder:text-[#6b7280]"
            />
          </div>

          {/* 내용 */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium leading-5 text-[#111827]">내용</label>
            <textarea
              placeholder="문의 내용을 상세히 작성해 주세요."
              rows={8}
              className="min-h-[200px] rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 text-[16px] leading-6 text-[#111827] placeholder:text-[#6b7280]"
            />
          </div>

          {/* 파일 첨부 */}
          <div className="flex flex-col gap-3">
            <label className="text-[14px] font-medium leading-5 text-[#111827]">파일 첨부</label>
            <div className="flex flex-wrap items-center gap-4">
              <label className="cursor-pointer rounded-lg border border-[#111827] px-6 py-2.5 text-[14px] font-medium leading-5 text-[#111827]">
                파일 선택
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,.zip"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                />
              </label>
              <span className="text-[12px] leading-4 text-[#6b7280]">
                {fileName ?? '선택된 파일 없음'}
              </span>
            </div>
            <ul className="flex flex-col gap-1">
              <li className="flex items-center gap-1 text-[12px] leading-4 text-[#6b7280]">
                <span className="text-[#6b7280]">•</span> 10MB 이하의 파일만 첨부 가능합니다.
              </li>
              <li className="flex items-center gap-1 text-[12px] leading-4 text-[#6b7280]">
                <span className="text-[#6b7280]">•</span> jpg, png, pdf, zip 형식의 파일만 지원합니다.
              </li>
            </ul>
          </div>

          {/* 개인정보 동의 */}
          <div className="flex flex-col gap-4 pb-6">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="h-4 w-4 rounded border border-[#e5e7eb]"
              />
              <span className="text-[14px] font-medium leading-5 text-[#111827]">
                개인정보 수집 및 이용 동의 (필수)
              </span>
            </label>
            <div className="h-32 overflow-auto rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] px-4 py-4 text-[12px] leading-[19.5px] text-[#6b7280]">
              <p>1. 개인정보 수집 항목</p>
              <p>성함, 이메일 주소, 문의 내용에 포함된 개인정보</p>
              <p>2. 수집 및 이용 목적</p>
              <p>1:1 문의 접수 및 답변 처리, 서비스 개선을 위한 통계 활용</p>
              <p>3. 보유 및 이용 기간</p>
              <p>
                문의 처리 완료 후 3년간 보관하며, 관련 법령에 따라 보존할 필요가 있는 경우 해당
                기간까지 보관합니다.
              </p>
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            className="w-full rounded-xl bg-[#e1f800] py-5 text-[20px] font-medium leading-7 text-black shadow-[0px_10px_15px_-3px_rgba(225,248,0,0.2),0px_4px_6px_-4px_rgba(225,248,0,0.2)]"
          >
            보내기
          </button>
        </form>
      </div>
    </div>
  )
}
