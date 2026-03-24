export type SearchContentKind = 'article' | 'video' | 'seminar'

export type SearchContentItem = {
  id: number
  title: string
  thumbnail: string
  category: string
  writer: string
  tags: string[]
}

export type UnifiedSearchResult = {
  article: SearchContentItem[]
  video: SearchContentItem[]
  seminar: SearchContentItem[]
}
