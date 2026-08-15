/**
 * dsh-session-archive (host half).
 *
 * Same-origin POST route /_dsh/session-archive/delete: permanently deletes one
 * persisted session's log directory. Live (open/running) sessions are refused.
 * The web UI renders the list from the shipped session/workspace stores; only
 * deletion needs a host capability, because the product ships no session delete.
 * @module dsh-session-archive
 */
export const name = 'dsh-session-archive'
export const inject = ['sessionQuery', 'sessionPersistence', 'subprocess']

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

async function readJson(req, maxBytes = 16 * 1024) {
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
  const inFlight = new Set()

  async function deleteSession(sessionId) {
    if (typeof sessionId !== 'string' || sessionId === '') return { ok: false, reason: 'invalid session id' }
    const bare = sessionId.startsWith('session-') ? sessionId.slice('session-'.length) : sessionId
    if (!UUID_RE.test(bare)) return { ok: false, reason: 'invalid session id: ' + sessionId.slice(0, 80) }
    if (inFlight.has(sessionId)) return { ok: false, reason: 'deletion already in progress' }
    inFlight.add(sessionId)
    try {
      const records = await ctx.sessionQuery.listSessions()
      const record = records.find((r) => r && r.header && r.header.id === sessionId)
      if (record === undefined) return { ok: false, reason: 'session not found' }
      let note
      if (record.live) {
        const agentsService = ctx.get('agents')
        const agent = agentsService !== undefined && typeof agentsService.get === 'function' ? agentsService.get(sessionId) : undefined
        if (agent !== undefined && agent.status === 'running') {
          return { ok: false, reason: '该会话正在运行（有任务进行中），请等它结束后再删除' }
        }
        note = '该会话仍被浏览器标签页保持打开；磁盘日志已删除，关闭对应标签页后它才会从列表消失'
      }

      const location = ctx.sessionPersistence.locate(record.header)
      if (location === undefined || location.kind !== 'jsonl' || typeof location.path !== 'string') {
        return { ok: false, reason: 'no local artifact to delete' }
      }
      const filePath = location.path
      const sep = filePath.includes('/') ? '/' : '\\'
      const dir = filePath.slice(0, filePath.lastIndexOf(sep))
      const base = dir.slice(dir.lastIndexOf(sep) + 1)
      if (base !== sessionId) return { ok: false, reason: 'artifact path guard failed: ' + base }
      const cwd = dir.slice(0, dir.lastIndexOf(sep))

      let command = null
      let argv = null
      try { command = await ctx.subprocess.resolveExecutable('powershell.exe') } catch (err) {}
      if (command !== null) {
        argv = [command, '-NoProfile', '-NonInteractive', '-Command', 'Remove-Item -LiteralPath "' + dir + '" -Recurse -Force']
      } else {
        try { command = await ctx.subprocess.resolveExecutable('cmd.exe') } catch (err) {}
        if (command !== null) argv = [command, '/c', 'rmdir', '/s', '/q', dir]
      }
      if (argv === null) return { ok: false, reason: 'no shell available to delete files' }

      const handle = ctx.subprocess.spawn({
        argv,
        cwd,
        stdio: { stdin: 'ignore', stdout: { maxBytes: 8192 }, stderr: { maxBytes: 8192 } },
        graceMs: 20000,
      })
      const outcome = await handle.done
      if (outcome.exitCode === 0) return { ok: true, deleted: sessionId, ...(note === undefined ? {} : { note }) }
      let errText = ''
      try {
        if (handle.collected.stderr !== undefined) errText = handle.collected.stderr.readFrom(0).text
      } catch (err) {}
      return { ok: false, reason: ('delete exited with code ' + outcome.exitCode + (errText.trim() === '' ? '' : ': ' + errText.trim())).slice(0, 300) }
    } catch (error) {
      return { ok: false, reason: String(error && error.message ? error.message : error).slice(0, 300) }
    } finally {
      inFlight.delete(sessionId)
    }
  }

  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(() => {
      const dispose = webCtx.webServer.register({
        kind: 'exact',
        path: '/_dsh/session-archive/delete',
        handler: async (req, res) => {
          try {
            if (!sameOriginPost(req)) return responseJson(res, 403, { ok: false, reason: 'same-origin POST required' })
            const body = await readJson(req)
            const sessionId = body && typeof body.sessionId === 'string' ? body.sessionId : ''
            if (sessionId === '') return responseJson(res, 400, { ok: false, reason: 'sessionId is required' })
            const result = await deleteSession(sessionId)
            return responseJson(res, result.ok ? 200 : 400, result)
          } catch (error) {
            return responseJson(res, 400, { ok: false, reason: String(error && error.message ? error.message : error).slice(0, 300) })
          }
        },
      })
      return () => dispose()
    }, 'dsh-session-archive: delete route')
  })
}
