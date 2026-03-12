/**
 * Article Highlight 타입 (articleHightlightPlan.md)
 */
export interface HighlightItem {
  highlightId: number
  articleId: number
  highlightGroupId: number
  paragraphIndex: number
  highlightText: string
  prefixText?: string
  suffixText?: string
  startOffset: number
  endOffset: number
  color: string
  createdAt?: string
}

export interface HighlightCreatePayload {
  articleId: number
  highlightGroupId?: number
  paragraphIndex: number
  highlightText: string
  prefixText?: string
  suffixText?: string
  startOffset: number
  endOffset: number
  color: string
}

export interface HighlightConstants {
  maxLength: number
  colors: string[]
}
