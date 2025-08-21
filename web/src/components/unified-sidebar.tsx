'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
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
  onAddNode?: (node: Node<ReactFlowNodeDataType>) => void
  onAddEdge?: (edge: Edge<ReactFlowEdgeDataType>) => void
  onRelayout?: () => void
}

export function AISidebar({
  nodes,
  edges,
  selectedNodes,
  onAIAction,
  onFocusChange,
  onAddNode,
  onAddEdge,
  onRelayout,
  ...props
}: AISidebarProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | undefined>()
  const [aiMentions, setAiMentions] = useState<Array<{ id: string; title: string }>>([])
  const [aiResults, setAiResults] = useState<AISuggestionsResult | null>(null)
  const [selectedSuggestedNodes, setSelectedSuggestedNodes] = useState<Set<number>>(new Set())
  const [selectedSuggestedEdges, setSelectedSuggestedEdges] = useState<Set<number>>(new Set())

  // Handle selection of suggested nodes
  const handleSuggestedNodeClick = (index: number, event: React.MouseEvent) => {
    if (event.shiftKey) {
      event.preventDefault()
      const newSelected = new Set(selectedSuggestedNodes)
      if (newSelected.has(index)) {
        newSelected.delete(index)
      } else {
        newSelected.add(index)
      }
      setSelectedSuggestedNodes(newSelected)
    } else {
      // Normal click - add node immediately
      if (aiResults?.nodes?.[index]) {
        handleAddSuggestedNode(aiResults.nodes[index], index)
      }
    }
  }

  // Handle selection of suggested edges
  const handleSuggestedEdgeClick = (index: number, event: React.MouseEvent) => {
    if (event.shiftKey) {
      event.preventDefault()
      const newSelected = new Set(selectedSuggestedEdges)
      if (newSelected.has(index)) {
        newSelected.delete(index)
      } else {
        newSelected.add(index)
      }
      setSelectedSuggestedEdges(newSelected)
    } else {
      // Normal click - add edge immediately
      if (aiResults?.edges?.[index]) {
        handleAddSuggestedEdge(aiResults.edges[index], index)
      }
    }
  }

  // Add suggested node to graph
  const handleAddSuggestedNode = (node: any, index: number) => {
    if (!onAddNode) return
    
    const position = { x: Math.random() * 400, y: Math.random() * 400 }
    const newNode: Node<ReactFlowNodeDataType> = {
      id: node.id,
      type: 'ideaNode',
      position,
      data: {
        id: node.id,
        title: node.title,
        kind: node.kind,
        body: node.body || '',
        tags: node.tags || [],
        scorePainkiller: node.score?.painkiller,
        scoreFounderFit: node.score?.founderFit,
        scoreTiming: node.score?.timing,
        scoreMoat: node.score?.moat,
        scorePracticality: node.score?.practicality,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }
    onAddNode(newNode)
    
    // Trigger layout after adding node
    setTimeout(() => {
      if (onRelayout) onRelayout()
    }, 100)
  }

  // Add suggested edge to graph
  const handleAddSuggestedEdge = (edge: any, index: number) => {
    if (!onAddEdge) return
    
    const newEdge: Edge<ReactFlowEdgeDataType> = {
      id: `edge-${Date.now()}-${index}`,
      source: edge.sourceId,
      target: edge.targetId,
      type: 'relationEdge',
      data: {
        id: `edge-${Date.now()}-${index}`,
        source: edge.sourceId,
        target: edge.targetId,
        relation: edge.relation,
        weight: edge.confidence,
      },
    }
    onAddEdge(newEdge)
    
    // Trigger layout after adding edge
    setTimeout(() => {
      if (onRelayout) onRelayout()
    }, 100)
  }

  // Add all suggested nodes to graph
  const handleAddAllNodes = () => {
    if (!aiResults?.nodes || !onAddNode) return
    aiResults.nodes.forEach((node, index) => {
      handleAddSuggestedNode(node, index)
    })
  }

  // Add all suggested edges to graph
  const handleAddAllEdges = () => {
    if (!aiResults?.edges || !onAddEdge) return
    aiResults.edges.forEach((edge, index) => {
      handleAddSuggestedEdge(edge, index)
    })
    // Reset selections and AI panel after adding
    resetSelections()
    resetAIPanel()
  }

  // Add selected suggested nodes to graph
  const handleAddSelectedNodes = () => {
    if (!aiResults?.nodes || !onAddNode) return
    const selectedIndices = Array.from(selectedSuggestedNodes)
    selectedIndices.forEach((index) => {
      if (aiResults.nodes[index]) {
        handleAddSuggestedNode(aiResults.nodes[index], index)
      }
    })
    // Reset selections and AI panel after adding
    resetSelections()
    resetAIPanel()
  }

  // Add selected suggested edges to graph
  const handleAddSelectedEdges = () => {
    if (!aiResults?.edges || !onAddEdge) return
    const selectedIndices = Array.from(selectedSuggestedEdges)
    selectedIndices.forEach((index) => {
      if (aiResults.edges[index]) {
        handleAddSuggestedEdge(aiResults.edges[index], index)
      }
    })
    // Reset selections and AI panel after adding
    resetSelections()
    resetAIPanel()
  }

  // Reset selection states
  const resetSelections = () => {
    setSelectedSuggestedNodes(new Set())
    setSelectedSuggestedEdges(new Set())
  }

  // Reset AI panel to fresh state
  const resetAIPanel = () => {
    setPrompt('')
    setAiResults(null)
    setAiMentions([])
  }

  // Handle escape key for resetting selections and AI panel
  const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      // Only handle escape if we have selections or AI results
      if (selectedSuggestedNodes.size > 0 || selectedSuggestedEdges.size > 0 || aiResults) {
        event.preventDefault()
        resetSelections()
        resetAIPanel()
      }
    }
  }, [selectedSuggestedNodes.size, selectedSuggestedEdges.size, aiResults])

  // Add keyboard event listener
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // AI Assistant handlers
  const handleAIAction = async () => {
    if (!selectedProvider) return
    setIsLoading(true)
    setAiResults(null)
    try {
      const xml = buildXMLSystemPrompt({
        userPrompt: prompt,
        allNodes: nodes.map(n => ({ id: n.id, data: n.data })),
        referencedNodeIds: aiMentions.map(m => m.id),
        webSearchEnabled
      })
      const res = await callAIProvider({ 
        provider: selectedProvider.key, 
        xmlSystemPrompt: xml,
        webSearchEnabled 
      })
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
              {/* AI results section - moved above input */}
              {aiResults && (aiResults.nodes.length > 0 || aiResults.edges.length > 0) && (
                <div className="space-y-3">
                  {aiResults.nodes.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Suggested Nodes</div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={selectedSuggestedNodes.size > 0 ? handleAddSelectedNodes : handleAddAllNodes}
                        >
                          {selectedSuggestedNodes.size > 0 ? `Add Selected (${selectedSuggestedNodes.size})` : 'Add All'}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {aiResults.nodes.map((node, idx) => (
                          <div 
                            key={`ai-node-${idx}`} 
                            className={`border rounded-md p-2 cursor-pointer transition-colors ${
                              selectedSuggestedNodes.has(idx) 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                                : 'border-gray-200 dark:border-[#262626] hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                            onClick={(e) => handleSuggestedNodeClick(idx, e)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
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
                              {selectedSuggestedNodes.has(idx) && (
                                <div className="text-blue-500 text-sm">✓</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiResults.edges.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Suggested Edges</div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={selectedSuggestedEdges.size > 0 ? handleAddSelectedEdges : handleAddAllEdges}
                        >
                          {selectedSuggestedEdges.size > 0 ? `Add Selected (${selectedSuggestedEdges.size})` : 'Add All'}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {aiResults.edges.map((edge, idx) => (
                          <div 
                            key={`ai-edge-${idx}`} 
                            className={`border rounded-md p-2 cursor-pointer transition-colors ${
                              selectedSuggestedEdges.has(idx) 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                                : 'border-gray-200 dark:border-[#262626] hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                            onClick={(e) => handleSuggestedEdgeClick(idx, e)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-gray-900 dark:text-white">{edge.sourceId} → {edge.targetId}</div>
                                <div className="text-[11px] text-gray-500 dark:text-gray-400">{edge.relation} · conf {edge.confidence?.toFixed?.(2) ?? edge.confidence}</div>
                                {edge.rationale && <div className="mt-1 text-xs text-gray-700 dark:text-gray-300 line-clamp-3">{edge.rationale}</div>}
                              </div>
                              {selectedSuggestedEdges.has(idx) && (
                                <div className="text-blue-500 text-sm">✓</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Unified input container with border */}
              <div className="border border-gray-200 dark:border-[#262626] rounded-lg bg-white dark:bg-[#262626] p-3">
                <div className="space-y-2">
                  {/* Text input area with mention support */}
                  <AIMentionInput
                    nodes={nodes}
                    placeholder="Enter your request..."
                    onChange={(t, mentions) => { setPrompt(t); setAiMentions(mentions || []) }}
                    onFocusChange={(f) => onFocusChange?.(f)}
                    className="text-gray-900 dark:text-white"
                    initialMentions={selectedNodes.map(node => ({ id: node.id, title: node.data.title }))}
                  />
                  
                  {/* Bottom controls - Plus button, Web search, and Model selector */}
                  <div className="flex items-center justify-between pt-1">
                    <PlusButtonDropdown
                      webSearchEnabled={webSearchEnabled}
                      onWebSearchToggle={setWebSearchEnabled}
                    />
                    <WebSearchToggle
                      enabled={webSearchEnabled}
                      onToggle={setWebSearchEnabled}
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
  onAddNode,
  onAddEdge,
  onRelayout,
}: AISidebarProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | undefined>()
  const [aiMentions, setAiMentions] = useState<Array<{ id: string; title: string }>>([])
  const [aiResults, setAiResults] = useState<AISuggestionsResult | null>(null)

  // Add suggested node to graph
  const handleAddSuggestedNode = (node: any, index: number) => {
    if (!onAddNode) return
    
    const position = { x: Math.random() * 400, y: Math.random() * 400 }
    const newNode: Node<ReactFlowNodeDataType> = {
      id: node.id,
      type: 'ideaNode',
      position,
      data: {
        id: node.id,
        title: node.title,
        kind: node.kind,
        body: node.body || '',
        tags: node.tags || [],
        scorePainkiller: node.score?.painkiller,
        scoreFounderFit: node.score?.founderFit,
        scoreTiming: node.score?.timing,
        scoreMoat: node.score?.moat,
        scorePracticality: node.score?.practicality,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }
    onAddNode(newNode)
    
    // Trigger layout after adding node
    setTimeout(() => {
      if (onRelayout) onRelayout()
    }, 100)
  }

  // Add suggested edge to graph
  const handleAddSuggestedEdge = (edge: any, index: number) => {
    if (!onAddEdge) return
    
    const newEdge: Edge<ReactFlowEdgeDataType> = {
      id: `edge-${Date.now()}-${index}`,
      source: edge.sourceId,
      target: edge.targetId,
      type: 'relationEdge',
      data: {
        id: `edge-${Date.now()}-${index}`,
        source: edge.sourceId,
        target: edge.targetId,
        relation: edge.relation,
        weight: edge.confidence,
      },
    }
    onAddEdge(newEdge)
    
    // Trigger layout after adding edge
    setTimeout(() => {
      if (onRelayout) onRelayout()
    }, 100)
  }

  // Add all suggested nodes to graph
  const handleAddAllNodes = () => {
    if (!aiResults?.nodes || !onAddNode) return
    aiResults.nodes.forEach((node, index) => {
      handleAddSuggestedNode(node, index)
    })
  }

  // Add all suggested edges to graph
  const handleAddAllEdges = () => {
    if (!aiResults?.edges || !onAddEdge) return
    aiResults.edges.forEach((edge, index) => {
      handleAddSuggestedEdge(edge, index)
    })
  }

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
        {/* AI results section - moved above input */}
        {aiResults && (aiResults.nodes.length > 0 || aiResults.edges.length > 0) && (
          <div className="space-y-3">
            {aiResults.nodes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Suggested Nodes</div>
                  <Button size="sm" variant="outline" onClick={handleAddAllNodes}>
                    Add All
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {aiResults.nodes.map((node, idx) => (
                    <div key={`ai-node-${idx}`} className="border border-gray-200 dark:border-[#262626] rounded-md p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
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
                        <Button size="sm" variant="ghost" onClick={() => handleAddSuggestedNode(node, idx)}>
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiResults.edges.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Suggested Edges</div>
                  <Button size="sm" variant="outline" onClick={handleAddAllEdges}>
                    Add All
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {aiResults.edges.map((edge, idx) => (
                    <div key={`ai-edge-${idx}`} className="border border-gray-200 dark:border-[#262626] rounded-md p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 dark:text-white">{edge.sourceId} → {edge.targetId}</div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">{edge.relation} · conf {edge.confidence?.toFixed?.(2) ?? edge.confidence}</div>
                          {edge.rationale && <div className="mt-1 text-xs text-gray-700 dark:text-gray-300 line-clamp-3">{edge.rationale}</div>}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleAddSuggestedEdge(edge, idx)}>
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
                initialMentions={selectedNodes.map(node => ({ id: node.id, title: node.data.title }))}
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

      </div>
    </div>
  )
}
