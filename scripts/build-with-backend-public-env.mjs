/**
 * Build frontend_www with public env values sourced from backend env.
 *
 * Static export embeds NEXT_PUBLIC_* values at build time. This wrapper lets the
 * backend deployment env be the source for public frontend config without
 * reading unrelated backend secrets into the browser bundle.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectDir = path.resolve(__dirname, '..')
const repoDir = path.resolve(projectDir, '..')

const DEFAULT_BACKEND_ENV_CANDIDATES = [
  path.join(repoDir, 'backend', '.env.production'),
  path.join(repoDir, 'backend', '.env'),
  path.join(repoDir, 'backend', '.env.local'),
]

function unquoteEnvValue(value) {
  const trimmed = value.trim()
  if (trimmed.length < 2) return trimmed
  const first = trimmed[0]
  const last = trimmed[trimmed.length - 1]
  if (!((first === '"' && last === '"') || (first === "'" && last === "'"))) return trimmed

  const inner = trimmed.slice(1, -1)
  if (first === "'") return inner
  return inner.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
}

function stripInlineComment(value) {
  let quote = null
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i]
    if ((ch === '"' || ch === "'") && value[i - 1] !== '\\') {
      quote = quote === ch ? null : quote || ch
      continue
    }
    if (!quote && ch === '#') {
      const prev = value[i - 1]
      if (i === 0 || /\s/.test(prev)) return value.slice(0, i)
    }
  }
  return value
}

function parseDotenv(contents) {
  const out = new Map()
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const normalized = line.startsWith('export ') ? line.slice('export '.length).trimStart() : line
    const eq = normalized.indexOf('=')
    if (eq <= 0) continue

    const key = normalized.slice(0, eq).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue

    const value = unquoteEnvValue(stripInlineComment(normalized.slice(eq + 1)))
    out.set(key, value)
  }
  return out
}

function resolveBackendEnvFile() {
  if (process.env.BACKEND_PUBLIC_ENV_FILE?.trim()) {
    return path.resolve(process.cwd(), process.env.BACKEND_PUBLIC_ENV_FILE.trim())
  }
  return DEFAULT_BACKEND_ENV_CANDIDATES.find((candidate) => fs.existsSync(candidate)) ?? null
}

function loadBackendPublicEnv() {
  const envFile = resolveBackendEnvFile()
  if (!envFile) {
    console.warn('[build-with-backend-public-env] backend env file not found; using current build environment only.')
    return
  }

  if (!fs.existsSync(envFile)) {
    console.warn(`[build-with-backend-public-env] configured env file does not exist: ${envFile}`)
    return
  }

  const parsed = parseDotenv(fs.readFileSync(envFile, 'utf8'))
  const loadedKeys = []
  for (const [key, value] of parsed) {
    if (!key.startsWith('NEXT_PUBLIC_')) continue
    if (process.env[key] != null && process.env[key] !== '') continue
    process.env[key] = value
    loadedKeys.push(key)
  }

  if (loadedKeys.length > 0) {
    console.log(`[build-with-backend-public-env] loaded from ${path.relative(repoDir, envFile)}: ${loadedKeys.join(', ')}`)
  } else {
    console.log(`[build-with-backend-public-env] no NEXT_PUBLIC_* values loaded from ${path.relative(repoDir, envFile)}`)
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectDir,
    env: process.env,
    stdio: 'inherit',
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function main() {
  loadBackendPublicEnv()
  run(process.execPath, [path.join(projectDir, 'node_modules', 'next', 'dist', 'bin', 'next'), 'build', '--webpack'])
  run(process.execPath, [path.join(projectDir, 'scripts', 'postbuild-static-html-dual.mjs')])
}

main()
