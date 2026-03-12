/**
 * 하이라이트 유틸 (articleHightlightPlan.md §8, §9, §12, 15.1)
 * - 본문 루트 직계 자식 블록만 문단으로 취급. :scope > p, h1, h2, h3, blockquote, ul, ol
 * - 본문 HTML이 wrapper div 한 겹으로 감싸진 경우, 그 내부를 본문 루트로 사용.
 */
import type { HighlightItem, HighlightCreatePayload } from '@/types/highlight'

const BLOCK_SELECTOR = ':scope > p, :scope > h1, :scope > h2, :scope > h3, :scope > blockquote, :scope > ul, :scope > ol'
const BLOCK_TAG = /^(P|H[1-3]|BLOCKQUOTE|UL|OL)$/i
const WRAPPER_TAG = /^(DIV|SECTION|ARTICLE|MAIN)$/i

/** 본문 루트 요소 반환. 직계 자식이 블록이면 root, 한 겹 wrapper만 있으면 그 자식 사용. */
function getContentRoot(root: HTMLElement | null): HTMLElement | null {
  if (!root) return null
  const first = root.firstElementChild
  if (
    root.children.length === 1 &&
    first &&
    WRAPPER_TAG.test(first.tagName) &&
    Array.from(first.children).some((el) => BLOCK_TAG.test(el.tagName))
  ) {
    return first as HTMLElement
  }
  return root
}

export function getParagraphNodes(root: HTMLElement | null): Element[] {
  const contentRoot = getContentRoot(root)
  if (!contentRoot) return []
  try {
    return Array.from(contentRoot.querySelectorAll(BLOCK_SELECTOR))
  } catch {
    return Array.from(contentRoot.children).filter((el) => BLOCK_TAG.test(el.tagName))
  }
}

/** textContent 기준 문자 offset에 해당하는 (텍스트 노드, 노드 내 offset) 반환 */
function getTextNodeAtOffset(root: Element, charOffset: number): { node: Text; offset: number } | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)
  let current = 0
  let node: Text | null = walker.nextNode() as Text | null
  while (node) {
    const len = node.textContent?.length ?? 0
    if (charOffset < current + len)
      return { node, offset: charOffset - current }
    current += len
    node = walker.nextNode() as Text | null
  }
  return null
}

/** 한 하이라이트에 대한 복원된 위치 (문단 요소 + start/end). */
interface ResolvedHighlight {
  el: Element
  start: number
  end: number
  color: string
  highlightId: number
}

/**
 * §9 복원 순서: paragraph_index + offset 확인 → highlightText 검색 → prefix+highlightText → highlightText+suffix
 * 문단 인덱스가 어긋나도 텍스트로 위치를 찾음.
 */
function resolveHighlightPosition(paragraphs: Element[], h: HighlightItem): ResolvedHighlight | null {
  const textAt = (el: Element) => (el.textContent || '')

  const tryParagraph = (p: Element, start: number, end: number): boolean => {
    const text = textAt(p)
    return end <= text.length && text.slice(start, end) === h.highlightText
  }

  // 1) paragraph_index로 문단 찾아 offset 확인
  const byIndex = paragraphs[h.paragraphIndex]
  if (byIndex && tryParagraph(byIndex, h.startOffset, h.endOffset)) {
    return { el: byIndex, start: h.startOffset, end: h.endOffset, color: h.color, highlightId: h.highlightId }
  }

  // 2) 전체 문단에서 검색. prefix+highlightText → highlightText+suffix → highlightText 순으로 시도 (§9).
  // DOM의 <br>은 textContent에서 \n이 되어 저장값과 불일치할 수 있으므로 highlightText 단독 검색 fallback 필수.
  const prefix = (h.prefixText ?? '').trim()
  const suffix = (h.suffixText ?? '').trim()
  const highlightLen = h.highlightText.length

  const tryFindInParagraph = (text: string, el: Element): { start: number; end: number } | null => {
    let idx = -1
    let startOffset = 0
    if (prefix) {
      idx = text.indexOf(prefix + h.highlightText)
      if (idx !== -1) startOffset = prefix.length
    }
    if (idx === -1 && suffix) {
      idx = text.indexOf(h.highlightText + suffix)
    }
    if (idx === -1) {
      idx = text.indexOf(h.highlightText)
    }
    if (idx === -1) return null
    const start = idx + startOffset
    const end = start + highlightLen
    if (text.slice(start, end) !== h.highlightText) return null
    return { start, end }
  }

  for (let i = 0; i < paragraphs.length; i++) {
    const text = textAt(paragraphs[i])
    const found = tryFindInParagraph(text, paragraphs[i])
    if (found) {
      return {
        el: paragraphs[i],
        start: found.start,
        end: found.end,
        color: h.color,
        highlightId: h.highlightId,
      }
    }
  }

  return null
}

/**
 * 문단 노드의 textContent 기준 start~end 구간을 <mark>로 감쌈.
 * end 내림차순 적용해 offset 밀림 방지 (§12).
 */
function applyResolvedToParagraph(paragraphEl: Element, items: ResolvedHighlight[]): void {
  const text = paragraphEl.textContent || ''
  if (!text.length) return
  const sorted = [...items].sort((a, b) => b.end - a.end)
  for (const r of sorted) {
    if (r.start >= r.end || r.end > text.length) continue
    const startPos = getTextNodeAtOffset(paragraphEl, r.start)
    const endPos = getTextNodeAtOffset(paragraphEl, r.end)
    if (!startPos || !endPos) continue
    try {
      const range = document.createRange()
      range.setStart(startPos.node, startPos.offset)
      range.setEnd(endPos.node, endPos.offset)
      const mark = document.createElement('mark')
      mark.setAttribute('data-color', r.color)
      mark.setAttribute('data-highlight-id', String(r.highlightId))
      if (r.color.startsWith('#')) {
        mark.style.backgroundColor = r.color
      }
      range.surroundContents(mark)
    } catch {
      // 겹치는 구간 등으로 실패 시 스킵
    }
  }
}

/** (기존 호환) 문단 노드에 HighlightItem[] 적용. */
export function applyMarksToParagraph(paragraphEl: Element, items: HighlightItem[]): void {
  const text = paragraphEl.textContent || ''
  if (!text.length) return
  const sorted = [...items].sort((a, b) => b.endOffset - a.endOffset)
  for (const h of sorted) {
    const start = h.startOffset
    const end = h.endOffset
    if (start >= end || end > text.length) continue
    if (text.slice(start, end) !== h.highlightText) continue
    const startPos = getTextNodeAtOffset(paragraphEl, start)
    const endPos = getTextNodeAtOffset(paragraphEl, end)
    if (!startPos || !endPos) continue
    try {
      const range = document.createRange()
      range.setStart(startPos.node, startPos.offset)
      range.setEnd(endPos.node, endPos.offset)
      const mark = document.createElement('mark')
      mark.setAttribute('data-color', h.color)
      mark.setAttribute('data-highlight-id', String(h.highlightId))
      if (h.color.startsWith('#')) {
        mark.style.backgroundColor = h.color
      }
      range.surroundContents(mark)
    } catch {
      // 겹치는 구간 등으로 실패 시 스킵
    }
  }
}

/**
 * 본문 루트에 하이라이트 목록 적용.
 * §9: paragraph_index + offset 실패 시 highlightText(·prefix·suffix)로 위치 검색 후 적용.
 */
export function applyMarks(root: HTMLElement | null, list: HighlightItem[]): void {
  if (!root || !list.length) return
  const paragraphs = getParagraphNodes(root)
  if (!paragraphs.length) return

  const resolved: ResolvedHighlight[] = []
  for (const h of list) {
    const r = resolveHighlightPosition(paragraphs, h)
    if (r) resolved.push(r)
  }

  const byEl = new Map<Element, ResolvedHighlight[]>()
  for (const r of resolved) {
    const arr = byEl.get(r.el) ?? []
    arr.push(r)
    byEl.set(r.el, arr)
  }
  byEl.forEach((items, el) => applyResolvedToParagraph(el, items))
}

/**
 * 현재 Selection과 본문 루트에서 단일 문단 하이라이트용 payload 생성.
 * 선택이 한 문단 안에 있으면 1개, 여러 문단에 걸치면 문단별로 분할 (15.12).
 */
export function selectionToPayloads(
  root: HTMLElement,
  articleId: number,
  selection: Selection,
  color: string = 'yellow',
  maxPrefixSuffix: number = 255
): HighlightCreatePayload[] {
  const text = selection.toString().trim()
  if (!text) return []
  const paragraphs = getParagraphNodes(root)
  if (!paragraphs.length) return []

  const anchorNode = selection.anchorNode
  const focusNode = selection.focusNode
  if (!anchorNode || !focusNode) return []

  const getBlock = (node: Node): Element | null => {
    let n: Node | null = node
    while (n && n !== root) {
      if (n.nodeType === Node.ELEMENT_NODE && paragraphs.includes(n as Element)) return n as Element
      n = n.parentNode
    }
    return null
  }

  const startBlock = getBlock(anchorNode)
  const endBlock = getBlock(focusNode)
  if (!startBlock || !endBlock) return []

  const startIdx = paragraphs.indexOf(startBlock)
  const endIdx = paragraphs.indexOf(endBlock)
  if (startIdx === -1 || endIdx === -1) return []

  const payloads: HighlightCreatePayload[] = []
  const fullText = selection.toString()

  if (startIdx === endIdx) {
    const block = paragraphs[startIdx]
    const blockText = block.textContent || ''
    const range = selection.getRangeAt(0)
    const preRange = document.createRange()
    preRange.setStart(block, 0)
    preRange.setEnd(range.startContainer, range.startOffset)
    const startOffset = (preRange.toString().length)
    const endOffset = startOffset + fullText.length
    const prefix = blockText.slice(Math.max(0, startOffset - maxPrefixSuffix), startOffset)
    const suffix = blockText.slice(endOffset, endOffset + maxPrefixSuffix)
    payloads.push({
      articleId,
      paragraphIndex: startIdx,
      highlightText: fullText,
      prefixText: prefix,
      suffixText: suffix,
      startOffset,
      endOffset,
      color,
    })
  } else {
    let offset = 0
    for (let i = startIdx; i <= endIdx; i++) {
      const block = paragraphs[i]
      const blockText = block.textContent || ''
      const len = blockText.length
      if (i === startIdx) {
        const range = selection.getRangeAt(0)
        const preRange = document.createRange()
        preRange.setStart(block, 0)
        preRange.setEnd(range.startContainer, range.startOffset)
        const startOffset = preRange.toString().length
        const endOffset = len
        const slice = blockText.slice(startOffset, endOffset)
        const prefix = blockText.slice(Math.max(0, startOffset - maxPrefixSuffix), startOffset)
        const suffix = blockText.slice(endOffset, Math.min(blockText.length, endOffset + maxPrefixSuffix))
        payloads.push({
          articleId,
          paragraphIndex: i,
          highlightText: slice,
          prefixText: prefix,
          suffixText: suffix,
          startOffset,
          endOffset,
          color,
        })
      } else if (i === endIdx) {
        const range = selection.getRangeAt(0)
        const preRange = document.createRange()
        preRange.setStart(block, 0)
        preRange.setEnd(range.endContainer, range.endOffset)
        const endOffset = preRange.toString().length
        const startOffset = 0
        const slice = blockText.slice(0, endOffset)
        const suffix = blockText.slice(endOffset, endOffset + maxPrefixSuffix)
        payloads.push({
          articleId,
          paragraphIndex: i,
          highlightText: slice,
          prefixText: '',
          suffixText: suffix,
          startOffset,
          endOffset,
          color,
        })
      } else {
        payloads.push({
          articleId,
          paragraphIndex: i,
          highlightText: blockText,
          prefixText: '',
          suffixText: blockText.slice(0, maxPrefixSuffix),
          startOffset: 0,
          endOffset: len,
          color,
        })
      }
    }
  }

  return payloads
}
