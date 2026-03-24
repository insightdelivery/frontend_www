/**
 * 마이페이지 탭 설정 (mypage.md §2 기준)
 */
export const MYPAGE_TABS = [
  {
    label: '회원 정보',
    path: '/mypage/info',
    title: '회원정보',
    subtitle: '회원님의 소중한 개인정보를 안전하게 관리하세요.',
  },
  {
    label: '라이브러리',
    path: '/mypage/library',
    title: '라이브러리',
    subtitle: '최근 본 콘텐츠를 확인할 수 있어요.',
  },
  {
    label: '하이라이트',
    path: '/mypage/highlights',
    title: '하이라이트',
    subtitle: '저장한 하이라이트 목록입니다.',
  },
  {
    label: '적용 질문',
    path: '/mypage/applied-questions',
    title: '적용질문',
    subtitle: '내가 작성한 적용 질문을 모아서 확인하고 관리하세요.',
  },
  {
    label: '북마크',
    path: '/mypage/bookmarks',
    title: '북마크',
    subtitle: '북마크한 콘텐츠를 모아서 확인하고 관리하세요.',
  },
  {
    label: '별점 모아보기',
    path: '/mypage/ratings',
    title: '별점 모아보기',
    subtitle: '내가 남긴 별점을 모아볼 수 있습니다.',
  },
  {
    label: '1:1 문의',
    path: '/mypage/support',
    title: '1:1 문의',
    subtitle: '궁금한 점은 문의를 남겨주세요.',
  },
] as const
