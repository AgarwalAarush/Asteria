import type { IdeaNodeDraftType, LinkSuggestionType, ReactFlowNodeDataType } from '@/lib/schemas'

export interface AISuggestionsResult {
  nodes: IdeaNodeDraftType[]
  edges: LinkSuggestionType[]
}

function buildSchemasXML(): string {
  const nodeSchema = {
    title: 'string (required)',
    kind: '"problem" | "solution" | "market" | "tech" | "theme" | "note" (required)',
    body: 'string (optional)',
    tags: ['string', '... (optional)'],
    score: {
      painkiller: 'number 1-5 (optional)',
      founderFit: 'number 1-5 (optional)',
      timing: 'number 1-5 (optional)',
      moat: 'number 1-5 (optional)',
      practicality: 'number 1-5 (optional)'
    }
  }

  const edgeSchema = {
    sourceId: 'string (required, must match an existing node id)',
    targetId: 'string (required, must match an existing node id)',
    relation: '"solves" | "depends_on" | "competes_with" | "related" | "enables" | "contradicts" (required)',
    confidence: 'number 0.0-1.0 (required)',
    rationale: 'string (optional)'
  }

  return [
    '<schemas>',
    '  <nodeSchema><![CDATA[',
    JSON.stringify(nodeSchema, null, 2),
    '  ]]></nodeSchema>',
    '  <edgeSchema><![CDATA[',
    JSON.stringify(edgeSchema, null, 2),
    '  ]]></edgeSchema>',
    '</schemas>'
  ].join('\n')
}

export function buildXMLSystemPrompt(params: {
  userPrompt?: string
  allNodes: Array<{ id: string; data: ReactFlowNodeDataType }>
  referencedNodeIds?: string[]
}): string {
  const { userPrompt, allNodes, referencedNodeIds = [] } = params

  const referencedNodes = allNodes
    .filter(n => referencedNodeIds.includes(n.id))
    .map(n => ({
      id: n.id,
      title: n.data.title,
      kind: n.data.kind,
      body: n.data.body,
      tags: n.data.tags,
      score: {
        painkiller: n.data.scorePainkiller ?? undefined,
        founderFit: n.data.scoreFounderFit ?? undefined,
        timing: n.data.scoreTiming ?? undefined,
        moat: n.data.scoreMoat ?? undefined,
        practicality: n.data.scorePracticality ?? undefined,
      }
    }))

  const referencedXML = referencedNodes.length
    ? [
        '<referencedUserNodes><![CDATA[',
        JSON.stringify(referencedNodes, null, 2),
        ']]></referencedUserNodes>'
      ].join('\n')
    : ''

  const instructions = [
    '<instructions>',
    'You are Asteria\'s AI graph assistant. Generate high-quality idea nodes and/or relationship edges for a knowledge graph.',
    'When suggesting edges, use existing node ids only. When suggesting nodes, do not invent ids.',
    'Return ONLY a single JSON object with the following shape and nothing else:',
    '{ "nodes": IdeaNodeDraft[], "edges": LinkSuggestion[] }',
    'Avoid prose. No markdown code fences. No commentary.',
    '</instructions>'
  ].join('\n')

  const userSection = userPrompt?.trim()
    ? ['<userPrompt>', '<![CDATA[', userPrompt.trim(), ']]>', '</userPrompt>'].join('\n')
    : ''

  return [
    '<asteriaPrompt>',
    instructions,
    buildSchemasXML(),
    referencedXML,
    userSection,
    '</asteriaPrompt>'
  ].join('\n')
}

function extractFirstJSONObject(text: string): any | null {
  // Try direct JSON first
  try {
    return JSON.parse(text)
  } catch {}
  // Try code block
  const codeBlockMatch = text.match(/```json[\s\S]*?```|```[\s\S]*?```/)
  if (codeBlockMatch) {
    const inner = codeBlockMatch[0].replace(/```json|```/g, '').trim()
    try { return JSON.parse(inner) } catch {}
  }
  // Try to find a JSON object by braces
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = text.slice(start, end + 1)
    try { return JSON.parse(candidate) } catch {}
  }
  return null
}

export async function callAIProvider(params: {
  provider: string
  xmlSystemPrompt: string
}): Promise<AISuggestionsResult> {
  const { provider, xmlSystemPrompt } = params
  let key: string | null = null
  if (typeof window !== 'undefined') {
    // Prefer secure storage
    try {
      const { secureLoad } = await import('@/lib/secure-store')
      const secret = localStorage.getItem('asteria-local-secret') || ''
      key = secret ? await secureLoad(provider, secret) : null
    } catch {
      key = null
    }
    if (!key) {
      key = localStorage.getItem(`asteria-${provider}-key`)
    }
  }
  if (!key) throw new Error(`Missing API key for provider: ${provider}`)

  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: xmlSystemPrompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    })
    const json = await res.json()
    const content = json?.choices?.[0]?.message?.content || ''
    const parsed = typeof content === 'string' ? extractFirstJSONObject(content) : content
    return normalizeSuggestions(parsed)
  }

  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 1000,
        system: xmlSystemPrompt,
        messages: [
          { role: 'user', content: 'Return ONLY the JSON object.' }
        ]
      })
    })
    const json = await res.json()
    const content = json?.content?.[0]?.text || ''
    const parsed = extractFirstJSONObject(content)
    return normalizeSuggestions(parsed)
  }

  // Basic fallback for other providers (not fully implemented)
  throw new Error(`Provider not implemented: ${provider}`)
}

function normalizeSuggestions(raw: any): AISuggestionsResult {
  const result: AISuggestionsResult = { nodes: [], edges: [] }
  if (!raw || typeof raw !== 'object') return result
  if (Array.isArray(raw.nodes)) result.nodes = raw.nodes as IdeaNodeDraftType[]
  if (Array.isArray(raw.edges)) result.edges = raw.edges as LinkSuggestionType[]
  return result
}


