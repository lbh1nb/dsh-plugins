/**
 * dsh-attachment-upload (host half).
 *
 * Same-origin POST route /_dsh/attachment-upload/upload: writes the raw body
 * into `<workspace>/.dsh-attachments/<sanitized-name>` so the agent's file
 * tools (which are sandboxed to the session workspace) can always read it.
 * Metadata travels in headers (x-file-name / x-cwd, URI-encoded).
 * @module dsh-attachment-upload
 */
import { mkdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

export const name = 'dsh-attachment-upload'
export const inject = []

const MAX_BYTES = 64 * 1024 * 1024
const INVALID_NAME_CHARS = /[\\/:*?"<>|\u0000-\u001f]/g

function sanitizeName(raw) {
  let name = String(raw === undefined ? '' : raw).trim().replace(INVALID_NAME_CHARS, '_')
  name = name.replace(/^\.+/, '_')
  if (name === '') name = 'attachment'
  if (name.length > 120) {
    const ext = path.extname(name).slice(0, 16)
    name = name.slice(0, 100) + ext
  }
  return name
}

/** Resolve a collision-free absolute target path under `<cwd>/.dsh-attachments/`. */
export async function resolveTargetPath(cwd, rawName) {
  if (typeof cwd !== 'string' || !path.isAbsolute(cwd)) throw new Error('workspace path must be absolute')
  const cwdStat = await stat(cwd)
  if (!cwdStat.isDirectory()) throw new Error('workspace path is not a directory')
  const name = sanitizeName(rawName)
  const dir = path.join(cwd, '.dsh-attachments')
  await mkdir(dir, { recursive: true })
  const ext = path.extname(name)
  const base = name.slice(0, name.length - ext.length)
  let target = path.join(dir, name)
  for (let i = 1; i < 1000; i += 1) {
    try {
      await stat(target)
      target = path.join(dir, `${base} (${i})${ext}`)
    } catch {
      break
    }
  }
  return target
}

function responseJson(res, status, body) {
  const bytes = Buffer.from(JSON.stringify(body))
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Length', String(bytes.length))
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
  res.writeHead(status)
  res.end(bytes)
}

/** Accept only same-origin POSTs (the shipped vision-toolkit guard, verbatim). */
function sameOriginPost(req) {
  const fetchSite = req.headers['sec-fetch-site']
  if (fetchSite === 'cross-site') return false
  const origin = req.headers.origin
  if (origin === undefined) return fetchSite === 'same-origin' || fetchSite === 'same-site' || fetchSite === 'none'
  const host = req.headers.host
  if (host === undefined) return false
  try {
    const parsed = new URL(origin)
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.host === host
  } catch {
    return false
  }
}

async function readBody(req, maxBytes) {
  const chunks = []
  let total = 0
  for await (const chunk of req) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += part.length
    if (total > maxBytes) throw new Error('file exceeds 64MB limit')
    chunks.push(part)
  }
  return Buffer.concat(chunks)
}

export function apply(ctx) {
  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(() => {
      const dispose = webCtx.webServer.register({
        kind: 'exact',
        path: '/_dsh/attachment-upload/upload',
        handler: async (req, res) => {
          try {
            if (!sameOriginPost(req)) return responseJson(res, 403, { ok: false, reason: 'same-origin POST required' })
            const rawName = req.headers['x-file-name']
            const rawCwd = req.headers['x-cwd']
            if (typeof rawName !== 'string' || typeof rawCwd !== 'string') {
              return responseJson(res, 400, { ok: false, reason: 'missing x-file-name or x-cwd header' })
            }
            const name = decodeURIComponent(rawName)
            const cwd = decodeURIComponent(rawCwd)
            const bytes = await readBody(req, MAX_BYTES)
            if (bytes.length === 0) return responseJson(res, 400, { ok: false, reason: 'empty body' })
            const target = await resolveTargetPath(cwd, name)
            await writeFile(target, bytes)
            return responseJson(res, 200, { ok: true, path: target, bytes: bytes.length })
          } catch (error) {
            return responseJson(res, 400, { ok: false, reason: String(error && error.message ? error.message : error).slice(0, 300) })
          }
        },
      })
      return () => dispose()
    }, 'dsh-attachment-upload: upload route')
  })
}
