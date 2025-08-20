'use client'

import * as React from 'react'
import { useState } from 'react'
import { Node, Edge } from 'reactflow'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ReactFlowNodeDataType, ReactFlowEdgeDataType } from '@/lib/schemas'
import { AIProviderDropdown } from './ai/AIProviderDropdown'
import { PlusButtonDropdown } from './ai/PlusButtonDropdown'
import { WebSearchToggle } from './ai/WebSearchToggle'
import { AIMentionInput } from './ai/AIMentionInput'
import { AIProvider } from '@/lib/ai-providers'
import { buildXMLSystemPrompt, callAIProvider, type AISuggestionsResult } from '@/lib/ai'

// Legacy AI modes type for compatibility
type AIModeType = 'suggest' | 'expand' | 'cluster' | 'links' | 'summarize' | 'research'

interface AISidebarProps extends React.ComponentProps<typeof Sidebar> {
  nodes: Node<ReactFlowNodeDataType>[]
  edges: Edge<ReactFlowEdgeDataType>[]
  selectedNodes: Node<ReactFlowNodeDataType>[]
  onAIAction?: (mode: AIModeType, context: any) => void
  onFocusChange?: (isFocused: boolean) => void
}

export function AISidebar({
  nodes,
  edges,
  selectedNodes,
  onAIAction,
  onFocusChange,
  ...props
}: AISidebarProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | undefined>()
  const [aiMentions, setAiMentions] = useState<Array<{ id: string; title: string }>>([])
  const [aiResults, setAiResults] = useState<AISuggestionsResult | null>(null)

  // AI Assistant handlers
  const handleAIAction = async () => {
    if (!selectedProvider) return
    setIsLoading(true)
    setAiResults(null)
    try {
      const xml = buildXMLSystemPrompt({
        userPrompt: prompt,
        allNodes: nodes.map(n => ({ id: n.id, data: n.data })),
        referencedNodeIds: aiMentions.map(m => m.id)
      })
      const res = await callAIProvider({ provider: selectedProvider.key, xmlSystemPrompt: xml })
      setAiResults(res)
    } catch (error) {
      console.error('AI action failed:', error)
    } finally {
      setIsLoading(false)
      // do not clear prompt automatically so user can iterate
    }
  }

  const selectedCount = selectedNodes.length

  return (
    <Sidebar {...props} className="w-80 min-w-80 max-w-[30rem] resize-x">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>AI Assistant</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-4">
              {/* Unified input container with border */}
              <div className="border border-gray-200 dark:border-[#262626] rounded-lg bg-white dark:bg-[#262626] p-3">
                <div className="space-y-2">
                  {/* Text input area with mention support */}
                  <div className="relative">
                    <AIMentionInput
                      nodes={nodes}
                      placeholder="Enter your request..."
                      onChange={(t, mentions) => { setPrompt(t); setAiMentions(mentions || []) }}
                      onFocusChange={(f) => onFocusChange?.(f)}
                      className="text-gray-900 dark:text-white"
                    />
                    {webSearchEnabled && (
                      <div className="absolute bottom-1 left-0">
                        <WebSearchToggle
                          enabled={webSearchEnabled}
                          onToggle={setWebSearchEnabled}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Bottom controls - Plus button and Model selector */}
                  <div className="flex items-center justify-between pt-1">
                    <PlusButtonDropdown
                      webSearchEnabled={webSearchEnabled}
                      onWebSearchToggle={setWebSearchEnabled}
                    />
                    <AIProviderDropdown
                      selectedProvider={selectedProvider}
                      onProviderChange={setSelectedProvider}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
              
              {selectedCount > 0 && (
                <div className="text-xs text-muted-foreground p-2 rounded-lg bg-muted/30">
                  Working with {selectedCount} selected node(s)
                </div>
              )}

              {/* AI Action Button */}
              <Button
                onClick={handleAIAction}
                disabled={isLoading || !selectedProvider}
                className="w-full"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  `Generate ${selectedCount > 0 ? `(${selectedCount})` : ''}`
                )}
              </Button>

              {/* Referenced nodes section */}
              {aiMentions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Referenced User Nodes:</div>
                  <div className="grid grid-cols-1 gap-2">
                    {aiMentions.map(m => {
                      const n = nodes.find(n => n.id === m.id)
                      if (!n) return null
                      return (
                        <div key={m.id} className="border border-gray-200 dark:border-[#262626] rounded-md p-2">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{n.data.title}</div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">{n.data.kind}</div>
                          {n.data.body && <div className="mt-1 text-xs text-gray-700 dark:text-gray-300 line-clamp-3">{n.data.body}</div>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* AI results section */}
              {aiResults && (aiResults.nodes.length > 0 || aiResults.edges.length > 0) && (
                <div className="space-y-3">
                  {aiResults.nodes.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Suggested Nodes</div>
                      <div className="grid grid-cols-1 gap-2">
                        {aiResults.nodes.map((node, idx) => (
                          <div key={`ai-node-${idx}`} className="border border-gray-200 dark:border-[#262626] rounded-md p-2">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{node.title}</div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">{node.kind}</div>
                            {node.body && <div className="mt-1 text-xs text-gray-700 dark:text-gray-300 line-clamp-3">{node.body}</div>}
                            {node.tags && node.tags.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {node.tags.map((t, i) => (
                                  <span key={i} className="px-1 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-[#191919] border border-gray-200 dark:border-[#262626]">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiResults.edges.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Suggested Edges</div>
                      <div className="grid grid-cols-1 gap-2">
                        {aiResults.edges.map((edge, idx) => (
                          <div key={`ai-edge-${idx}`} className="border border-gray-200 dark:border-[#262626] rounded-md p-2">
                            <div className="text-sm text-gray-900 dark:text-white">{edge.sourceId} → {edge.targetId}</div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">{edge.relation} · conf {edge.confidence?.toFixed?.(2) ?? edge.confidence}</div>
                            {edge.rationale && <div className="mt-1 text-xs text-gray-700 dark:text-gray-300 line-clamp-3">{edge.rationale}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

// Overlay variant of the AI assistant (no sidebar container)
export function AIOverlay({
  nodes,
  edges,
  selectedNodes,
  onAIAction,
  onFocusChange,
}: AISidebarProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | undefined>()
  const [aiMentions, setAiMentions] = useState<Array<{ id: string; title: string }>>([])
  const [aiResults, setAiResults] = useState<AISuggestionsResult | null>(null)

  const handleAIAction = async () => {
    if (!selectedProvider) return
    setIsLoading(true)
    setAiResults(null)
    try {
      const xml = buildXMLSystemPrompt({
        userPrompt: prompt,
        allNodes: nodes.map(n => ({ id: n.id, data: n.data })),
        referencedNodeIds: aiMentions.map(m => m.id)
      })
      const res = await callAIProvider({ provider: selectedProvider.key, xmlSystemPrompt: xml })
      setAiResults(res)
    } catch (error) {
      console.error('AI action failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCount = selectedNodes.length

  return (
    <div className="w-full space-y-4">
      <div className="space-y-3">
        {/* Unified input container with border */}
        <div className="border border-gray-200 dark:border-[#262626] rounded-lg bg-white dark:bg-[#262626] p-3">
          <div className="space-y-2">
            {/* Text input area with mention support */}
            <div className="relative">
              <AIMentionInput
                nodes={nodes}
                placeholder="Enter your request..."
                onChange={(t, mentions) => { setPrompt(t); setAiMentions(mentions || []) }}
                onFocusChange={(f) => onFocusChange?.(f)}
                className="text-gray-900 dark:text-white"
              />
              {webSearchEnabled && (
                <div className="absolute bottom-1 left-0">
                  <WebSearchToggle
                    enabled={webSearchEnabled}
                    onToggle={setWebSearchEnabled}
                  />
                </div>
              )}
            </div>
            
            {/* Bottom controls - Plus button and Model selector */}
            <div className="flex items-center justify-between pt-1">
              <PlusButtonDropdown
                webSearchEnabled={webSearchEnabled}
                onWebSearchToggle={setWebSearchEnabled}
              />
              <AIProviderDropdown
                selectedProvider={selectedProvider}
                onProviderChange={setSelectedProvider}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
        
        {selectedCount > 0 && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Working with {selectedCount} selected node(s)
          </div>
        )}
        
        <Button 
          onClick={handleAIAction} 
          disabled={isLoading || !selectedProvider} 
          className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
        >
          {isLoading ? 'Processing…' : 'Generate'}
        </Button>

        {aiMentions.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Referenced User Nodes:</div>
            <div className="grid grid-cols-1 gap-2">
              {aiMentions.map(m => {
                const n = nodes.find(n => n.id === m.id)
                if (!n) return null
                return (
                  <div key={m.id} className="border border-gray-200 dark:border-[#262626] rounded-md p-2">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{n.data.title}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">{n.data.kind}</div>
                    {n.data.body && <div className="mt-1 text-xs text-gray-700 dark:text-gray-300 line-clamp-3">{n.data.body}</div>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {aiResults && (aiResults.nodes.length > 0 || aiResults.edges.length > 0) && (
          <div className="space-y-3">
            {aiResults.nodes.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Suggested Nodes</div>
                <div className="grid grid-cols-1 gap-2">
                  {aiResults.nodes.map((node, idx) => (
                    <div key={`ai-node-${idx}`} className="border border-gray-200 dark:border-[#262626] rounded-md p-2">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{node.title}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">{node.kind}</div>
                      {node.body && <div className="mt-1 text-xs text-gray-700 dark:text-gray-300 line-clamp-3">{node.body}</div>}
                      {node.tags && node.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {node.tags.map((t, i) => (
                            <span key={i} className="px-1 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-[#191919] border border-gray-200 dark:border-[#262626]">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiResults.edges.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Suggested Edges</div>
                <div className="grid grid-cols-1 gap-2">
                  {aiResults.edges.map((edge, idx) => (
                    <div key={`ai-edge-${idx}`} className="border border-gray-200 dark:border-[#262626] rounded-md p-2">
                      <div className="text-sm text-gray-900 dark:text-white">{edge.sourceId} → {edge.targetId}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">{edge.relation} · conf {edge.confidence?.toFixed?.(2) ?? edge.confidence}</div>
                      {edge.rationale && <div className="mt-1 text-xs text-gray-700 dark:text-gray-300 line-clamp-3">{edge.rationale}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
