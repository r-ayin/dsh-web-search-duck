export const name = 'web-search-duck'
export const inject = ['web', 'credentials']

// Configure via env: DUCK_SEARCH_ENDPOINT (Responses-API-compatible URL, required),
// DUCK_SEARCH_MODEL (required), DUCK_SEARCH_CREDENTIAL (credentials-store key).
const ENDPOINT = process.env.DUCK_SEARCH_ENDPOINT || ''
const MODEL = process.env.DUCK_SEARCH_MODEL || ''
const CREDENTIAL = process.env.DUCK_SEARCH_CREDENTIAL || 'DSH_WEB_SEARCH_TOKEN'

function mapResponse(parsed) {
  let content = ''
  const sources = []
  const seen = new Set()
  const output = Array.isArray(parsed.output) ? parsed.output : []
  for (const item of output) {
    if (!item || item.type !== 'message' || !Array.isArray(item.content)) continue
    for (const block of item.content) {
      if (!block || block.type !== 'output_text') continue
      if (typeof block.text === 'string') content += (content ? '\\n\\n' : '') + block.text
      const annotations = Array.isArray(block.annotations) ? block.annotations : []
      for (const ann of annotations) {
        if (!ann || ann.type !== 'url_citation' || typeof ann.url !== 'string' || seen.has(ann.url)) continue
        seen.add(ann.url)
        const source = { url: ann.url }
        if (typeof ann.title === 'string' && ann.title) source.title = ann.title
        sources.push(source)
      }
    }
  }
  if (!content && sources.length === 0) throw new Error('Duck search returned no answer or citations')
  return { content, sources, truncated: false }
}

export function apply(ctx) {
  const provider = {
    id: 'duck-responses-search',
    available() { return true },
    async search(request, signal) {
        if (!ENDPOINT || !MODEL) throw new Error('dsh-web-search-duck: set DUCK_SEARCH_ENDPOINT and DUCK_SEARCH_MODEL')
      const credential = await ctx.credentials.resolve(CREDENTIAL)
      if (!credential || !credential.value) throw new Error(CREDENTIAL + ' is unavailable')
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          authorization: 'Bearer ' + credential.value,
          'content-type': 'application/json',
          accept: 'application/json'
        },
        body: JSON.stringify({
          model: MODEL,
          tools: [{ type: 'web_search_preview' }],
          input: 'Search the web for: ' + request.query + '. Return a concise answer with source citations.'
        }),
        signal
      })
      let parsed
      try { parsed = await response.json() } catch (error) { throw new Error('Duck search returned invalid JSON: ' + String(error)) }
      if (!response.ok) throw new Error((parsed && parsed.error && parsed.error.message) || ('Duck search HTTP ' + response.status))
      if (parsed && parsed.error) throw new Error('Duck search API error: ' + String(parsed.error.message || parsed.error))
      return mapResponse(parsed)
    }
  }
  ctx.effect(() => ctx.web.registerSearchProvider(provider))
}
