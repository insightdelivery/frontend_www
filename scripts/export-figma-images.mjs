#!/usr/bin/env node
/**
 * Figma 디자인에서 이미지를 export 해서 public/figma/ 에 저장하는 스크립트
 *
 * 사용법:
 * 1. Figma에서 Personal Access Token 발급: Settings > Account > Personal access tokens
 * 2. .env.local에 추가: FIGMA_ACCESS_TOKEN=your_token
 * 3. Figma 파일에서 이미지로 쓸 프레임/그룹을 선택 후 URL에서 node-id 확인 (예: node-id=1-236 → 1:236)
 * 4. 아래 IMAGE_NODES에 이름과 node ID를 추가
 * 5. 실행: node scripts/export-figma-images.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY || 'faaPr93HWq1MitjeIhWdrO'
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN

// 이미지로 저장할 노드 매핑 (이름: nodeId). Figma에서 레이어 선택 후 URL의 node-id 참고
const IMAGE_NODES = {
  hero: '1:236',           // 메인 히어로 배너 (전체 프레임이면 하위 노드로 변경 권장)
  // 필요한 만큼 추가 (Figma에서 해당 영역 선택 후 URL에서 node-id 복사):
  // seminarCard: '1:xxx',
  // article1: '1:xxx',
  // article2: '1:xxx',
  // video1: '1:xxx',
}

const OUT_DIR = path.join(__dirname, '..', 'public', 'figma')

async function main() {
  if (!FIGMA_ACCESS_TOKEN) {
    console.error('FIGMA_ACCESS_TOKEN이 설정되지 않았습니다.')
    console.error('.env.local에 FIGMA_ACCESS_TOKEN=your_token 을 추가하세요.')
    process.exit(1)
  }

  const ids = Object.values(IMAGE_NODES).join(',')
  const url = `https://api.figma.com/v1/images/${FIGMA_FILE_KEY}?ids=${encodeURIComponent(ids)}&format=png&scale=2`

  const res = await fetch(url, {
    headers: { 'X-Figma-Token': FIGMA_ACCESS_TOKEN },
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('Figma API 오류:', res.status, text)
    process.exit(1)
  }

  const data = await res.json()
  if (data.err) {
    console.error('Figma API 오류:', data.err)
    process.exit(1)
  }

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true })
  }

  const entries = Object.entries(IMAGE_NODES)
  for (let i = 0; i < entries.length; i++) {
    const [name, nodeId] = entries[i]
    const imageUrl = data.images[nodeId]
    if (!imageUrl) {
      console.warn(`이미지 URL 없음: ${name} (${nodeId})`)
      continue
    }
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) {
      console.warn(`다운로드 실패: ${name}`)
      continue
    }
    const buf = Buffer.from(await imgRes.arrayBuffer())
    const outPath = path.join(OUT_DIR, `${name}.png`)
    fs.writeFileSync(outPath, buf)
    console.log(`저장: ${outPath}`)
  }

  console.log('완료.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
