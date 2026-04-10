'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type SearchChromeContextValue = {
  hideRecentSearchesInHeader: boolean
  setHideRecentSearchesInHeader: (v: boolean) => void
  /** 헤더 검색 입력에 포커스가 있으면 `/search` 완료 후에도 최근·추천 영역을 다시 쓸 수 있게 숨김 해제 */
  headerSearchInputFocused: boolean
  setHeaderSearchInputFocused: (v: boolean) => void
}

const SearchChromeContext = createContext<SearchChromeContextValue | null>(null)

export function SearchChromeProvider({ children }: { children: ReactNode }) {
  const [hideRecentSearchesInHeader, setHideRecentSearchesInHeader] = useState(false)
  const [headerSearchInputFocused, setHeaderSearchInputFocused] = useState(false)
  const setHide = useCallback((v: boolean) => {
    setHideRecentSearchesInHeader(v)
  }, [])
  const value = useMemo(
    () => ({
      hideRecentSearchesInHeader,
      setHideRecentSearchesInHeader: setHide,
      headerSearchInputFocused,
      setHeaderSearchInputFocused,
    }),
    [hideRecentSearchesInHeader, setHide, headerSearchInputFocused]
  )
  return <SearchChromeContext.Provider value={value}>{children}</SearchChromeContext.Provider>
}

export function useSearchChrome(): SearchChromeContextValue {
  const ctx = useContext(SearchChromeContext)
  if (!ctx) {
    return {
      hideRecentSearchesInHeader: false,
      setHideRecentSearchesInHeader: () => {},
      headerSearchInputFocused: false,
      setHeaderSearchInputFocused: () => {},
    }
  }
  return ctx
}
