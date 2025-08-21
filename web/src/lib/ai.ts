import type { IdeaNodeDraftType, LinkSuggestionType, ReactFlowNodeDataType } from '@/lib/schemas'

export interface AISuggestionsResult {
  nodes: IdeaNodeDraftType[]
  edges: LinkSuggestionType[]
}

function buildSchemasXML(): string {
  const nodeTypeGuide = {
    problem: 'Pain points, challenges, or issues that need solving',
    solution: 'Products, services, or approaches that address problems', 
    market: 'Target audiences, customer segments, or market opportunities',
    tech: 'Technologies, tools, platforms, or technical capabilities',
    theme: 'High-level concepts, trends, or strategic directions',
    note: 'General observations, insights, or miscellaneous information'
  }

  const scoringGuide = {
    painkiller: '1-5: How well does this address a real pain point? (1=nice-to-have, 5=must-have)',
    founderFit: '1-5: How well does this align with founder strengths/background? (1=poor fit, 5=perfect fit)',
    timing: '1-5: How good is the market timing? (1=too early/late, 5=perfect timing)',
    moat: '1-5: How defensible is this competitive advantage? (1=no moat, 5=strong moat)',
    practicality: '1-5: How feasible is this to implement? (1=very hard, 5=easy to execute)'
  }

  const relationGuide = {
    solves: 'One node directly addresses/fixes the other (solution → problem)',
    depends_on: 'One node requires the other to exist/work (dependent → dependency)', 
    competes_with: 'Nodes are alternatives or competitors to each other',
    related: 'General connection or relevance between nodes',
    enables: 'One node makes the other possible or easier (enabler → enabled)',
    contradicts: 'Nodes are in conflict or oppose each other'
  }

  const nodeSchema = {
    id: 'string (required, use format "node-N" where N is nextNodeId + index)',
    title: 'string (required, clear and concise name)',
    kind: `"problem" | "solution" | "market" | "tech" | "theme" | "note" (required)
    
NODE TYPE GUIDE:
${Object.entries(nodeTypeGuide).map(([key, desc]) => `- ${key}: ${desc}`).join('\n')}`,
    body: 'string (optional, detailed description or explanation)',
    tags: ['string', '... (optional, relevant keywords or categories)'],
    score: `{
SCORING GUIDE (all optional, use 1-5 scale):
${Object.entries(scoringGuide).map(([key, desc]) => `- ${key}: ${desc}`).join('\n')}
    }`
  }

  const edgeSchema = {
    sourceId: 'string (required, must be either a referenced user node ID or a newly created node ID)',
    targetId: 'string (required, must be either a referenced user node ID or a newly created node ID)',
    relation: `"solves" | "depends_on" | "competes_with" | "related" | "enables" | "contradicts" (required)
    
RELATION GUIDE:
${Object.entries(relationGuide).map(([key, desc]) => `- ${key}: ${desc}`).join('\n')}`,
    confidence: 'number 0.0-1.0 (required, how confident you are in this relationship)',
    rationale: 'string (optional, brief explanation of why this relationship exists)'
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
  webSearchEnabled?: boolean
}): string {
  const { userPrompt, allNodes, referencedNodeIds = [], webSearchEnabled = false } = params

  // Calculate next available node ID based on existing nodes
  const extractNodeNumber = (id: string): number => {
    const match = id.match(/node-(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }
  
  const existingNodeNumbers = allNodes.map(n => extractNodeNumber(n.id))
  const nextNodeId = existingNodeNumbers.length > 0 ? Math.max(...existingNodeNumbers) + 1 : 1
  
  const nextNodeIdXML = [
    '<nextNodeId><![CDATA[',
    nextNodeId.toString(),
    ']]></nextNodeId>'
  ].join('\n')

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
    'You are Asteria\'s AI graph assistant for startup idea exploration. Generate high-quality nodes and edges for a knowledge graph.',
    '',
    'CONTEXT: This is a mind-mapping tool for entrepreneurs to explore business ideas, problems, solutions, markets, and technologies.',
    '',
    ...(webSearchEnabled ? [
      'WEB SEARCH ENABLED: You have access to real-time web search capabilities. Use current market data, trends, competitor analysis, and recent developments to enhance your suggestions.',
      'Incorporate up-to-date information about market conditions, emerging technologies, and competitive landscape.',
      ''
    ] : []),
    'NODE CREATION GUIDELINES:',
    '- Use clear, concise titles (2-6 words)',
    '- Choose appropriate node types based on content',
    '- Add meaningful descriptions in the body field',
    '- Include relevant tags for categorization',
    '- Apply scoring thoughtfully (1-5 scale) when applicable',
    '- Use sequential IDs starting from nextNodeId (format: "node-N", "node-N+1", etc.)',
    '',
    'EDGE CREATION GUIDELINES:',
    '- Only connect between referenced user nodes OR newly created nodes',
    '- Do not create edges to nodes that exist but are not referenced',
    '- Choose relations that make logical sense',
    '- Set confidence based on how certain you are (0.0-1.0)',
    '- Add rationale to explain non-obvious relationships',
    '',
    'EXAMPLES:',
    '- problem: "High customer acquisition costs" (painkiller: 4, practicality: 3)',
    '- solution: "Referral program platform" (timing: 4, moat: 2)',  
    '- market: "Small e-commerce businesses" (market size, addressability)',
    '- tech: "React Native mobile app" (technical feasibility, complexity)',
    '',
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
    nextNodeIdXML,
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
  webSearchEnabled?: boolean
}): Promise<AISuggestionsResult> {
  const { provider, xmlSystemPrompt, webSearchEnabled = false } = params
  let key: string | null = null
  // localStorage disabled - API keys must be entered each session
  key = null
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


