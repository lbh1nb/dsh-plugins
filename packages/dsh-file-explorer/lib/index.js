/**
 * dsh-file-explorer (host half).
 *
 * Same-origin POST route /_dsh/file-explorer with an `action` field:
 * roots / list / read / write / mkdir / rename / delete.
 * Every path is resolved against one registered workspace root and
 * verified to stay inside it (no traversal). Reads are capped; only
 * text and small binary previews are served.
 * @module dsh-file-explorer
 */
import { promises as fsp } from 'node:fs'
import path from 'node:path'

export const name = 'dsh-file-explorer'
export const inject = ['workspaceRegistry']

const READ_TEXT_MAX = 256 * 1024
const READ_BIN_MAX = 2 * 1024 * 1024
const BODY_MAX = 2 * 1024 * 1024

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

async function readJson(req, maxBytes = BODY_MAX) {
  const contentType = req.headers['content-type']?.split(';', 1)[0]?.trim().toLowerCase()
  if (contentType !== 'application/json') throw new TypeError('Content-Type must be application/json')
  const chunks = []
  let bytes = 0
  for await (const chunk of req) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    bytes += part.length
    if (bytes > maxBytes) throw new RangeError('request body exceeds limit')
    chunks.push(part)
  }
  if (chunks.length === 0) throw new TypeError('request body is empty')
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export function apply(ctx) {
  const rootsCache = new Map() // workspaceId -> { id, title, path }

  function refreshRoots() {
    rootsCache.clear()
    let list = []
    try {
      const reg = ctx.workspaceRegistry
      if (reg !== undefined && typeof reg.list === 'function') list = reg.list() ?? []
    } catch {
      list = []
    }
    for (const w of list) {
      if (w === null || typeof w !== 'object') continue
      const wp = typeof w.path === 'string' ? w.path : ''
      if (wp === '') continue
      const id = typeof w.id === 'string' ? w.id : wp
      const title = typeof w.title === 'string' && w.title !== '' ? w.title : path.basename(wp)
      rootsCache.set(id, { id, title, path: wp })
    }
    return [...rootsCache.values()]
  }

  /** Resolve rel against a root; null when outside or missing. */
  function safeJoin(rootPath, rel) {
    if (typeof rel !== 'string' || rel.includes('\0')) return null
    const normRoot = path.resolve(rootPath)
    const abs = path.resolve(normRoot, rel === '' ? '.' : rel)
    if (abs !== normRoot && !abs.startsWith(normRoot + path.sep)) return null
    return abs
  }

  async function doRoots() {
    return { ok: true, roots: refreshRoots() }
  }

  async function doList(body) {
    const root = rootsCache.get(body?.rootId) ?? refreshRoots().find((r) => r.id === body?.rootId)
    if (root === undefined) return { ok: false, reason: 'workspace not found' }
    const abs = safeJoin(root.path, body?.rel ?? '')
    if (abs === null) return { ok: false, reason: 'path escapes workspace' }
    try {
      const st = await fsp.stat(abs)
      if (!st.isDirectory()) return { ok: false, reason: 'not a directory' }
    } catch {
      return { ok: false, reason: 'directory not found' }
    }
    const entries = []
    const dirents = await fsp.readdir(abs, { withFileTypes: true })
    for (const d of dirents) {
      const full = path.join(abs, d.name)
      let size = 0
      let mtime = 0
      let isDir = d.isDirectory()
      try {
        if (!isDir) {
          const s = await fsp.stat(full)
          size = s.size
          mtime = s.mtimeMs
        }
      } catch { /* unreadable entry: keep zeros */ }
      entries.push({
        name: d.name,
        dir: isDir,
        size: isDir ? 0 : size,
        mtime: isDir ? 0 : mtime,
      })
    }
    entries.sort((a, b) => (a.dir === b.dir ? a.name.localeCompare(b.name) : a.dir ? -1 : 1))
    return { ok: true, rel: body?.rel ?? '', path: abs, entries }
  }

  async function doRead(body) {
    const root = rootsCache.get(body?.rootId)
    if (root === undefined) return { ok: false, reason: 'workspace not found' }
    const abs = safeJoin(root.path, body?.rel)
    if (abs === null) return { ok: false, reason: 'path escapes workspace' }
    let st
    try {
      st = await fsp.stat(abs)
    } catch {
      return { ok: false, reason: 'file not found' }
    }
    if (st.isDirectory()) return { ok: false, reason: 'is a directory' }
    if (st.size > READ_TEXT_MAX + READ_BIN_MAX) return { ok: false, reason: 'file too large to preview' }
    const ext = path.extname(abs).toLowerCase()
    const binaryExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.bmp'])
    if (binaryExts.has(ext)) {
      if (st.size > READ_BIN_MAX) return { ok: false, reason: 'image too large to preview' }
      const buf = await fsp.readFile(abs)
      const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
        : ext === '.gif' ? 'image/gif'
        : ext === '.webp' ? 'image/webp'
        : ext === '.ico' ? 'image/x-icon'
        : ext === '.bmp' ? 'image/bmp'
        : 'image/png'
      return { ok: true, kind: 'image', mime, base64: buf.toString('base64') }
    }
    if (st.size > READ_TEXT_MAX) return { ok: false, reason: 'text file too large to preview' }
    const text = await fsp.readFile(abs, 'utf8')
    return { ok: true, kind: 'text', text }
  }

  async function doWrite(body) {
    const root = rootsCache.get(body?.rootId)
    if (root === undefined) return { ok: false, reason: 'workspace not found' }
    const abs = safeJoin(root.path, body?.rel)
    if (abs === null) return { ok: false, reason: 'path escapes workspace' }
    if (typeof body?.content !== 'string') return { ok: false, reason: 'content is required' }
    await fsp.mkdir(path.dirname(abs), { recursive: true })
    await fsp.writeFile(abs, body.content, 'utf8')
    return { ok: true, path: abs }
  }

  async function doMkdir(body) {
    const root = rootsCache.get(body?.rootId)
    if (root === undefined) return { ok: false, reason: 'workspace not found' }
    const abs = safeJoin(root.path, body?.rel)
    if (abs === null) return { ok: false, reason: 'path escapes workspace' }
    await fsp.mkdir(abs, { recursive: true })
    return { ok: true, path: abs }
  }

  async function doRename(body) {
    const root = rootsCache.get(body?.rootId)
    if (root === undefined) return { ok: false, reason: 'workspace not found' }
    if (typeof body?.newName !== 'string' || body.newName === '' || /[\\/]/.test(body.newName) || body.newName.includes('\0')) {
      return { ok: false, reason: 'invalid new name' }
    }
    const abs = safeJoin(root.path, body?.rel)
    if (abs === null) return { ok: false, reason: 'path escapes workspace' }
    const next = safeJoin(root.path, path.join(path.dirname(body.rel === '' ? '.' : body.rel), body.newName))
    if (next === null) return { ok: false, reason: 'target escapes workspace' }
    if (abs === path.resolve(root.path)) return { ok: false, reason: 'cannot rename workspace root' }
    await fsp.rename(abs, next)
    return { ok: true, path: next }
  }

  async function doDelete(body) {
    const root = rootsCache.get(body?.rootId)
    if (root === undefined) return { ok: false, reason: 'workspace not found' }
    const abs = safeJoin(root.path, body?.rel)
    if (abs === null) return { ok: false, reason: 'path escapes workspace' }
    if (abs === path.resolve(root.path)) return { ok: false, reason: 'cannot delete workspace root' }
    const st = await fsp.stat(abs)
    await fsp.rm(abs, { recursive: st.isDirectory(), force: false })
    return { ok: true }
  }

  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(() => {
      const dispose = webCtx.webServer.register({
        kind: 'exact',
        path: '/_dsh/file-explorer',
        handler: async (req, res) => {
          try {
            if (!sameOriginPost(req)) return responseJson(res, 403, { ok: false, reason: 'same-origin POST required' })
            const body = await readJson(req)
            const action = body && typeof body.action === 'string' ? body.action : ''
            let result
            switch (action) {
              case 'roots': result = await doRoots(); break
              case 'list': result = await doList(body); break
              case 'read': result = await doRead(body); break
              case 'write': result = await doWrite(body); break
              case 'mkdir': result = await doMkdir(body); break
              case 'rename': result = await doRename(body); break
              case 'delete': result = await doDelete(body); break
              default: result = { ok: false, reason: 'unknown action: ' + String(action).slice(0, 40) }
            }
            return responseJson(res, result.ok ? 200 : 400, result)
          } catch (error) {
            return responseJson(res, 400, { ok: false, reason: String(error && error.message ? error.message : error).slice(0, 300) })
          }
        },
      })
      return () => dispose()
    }, 'dsh-file-explorer: fs route')
  })
}
