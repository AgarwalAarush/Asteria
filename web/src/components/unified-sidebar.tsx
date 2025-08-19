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
import { ReactFlowNodeDataType, ReactFlowEdgeDataType } from '@/lib/schemas'

// AI modes
type AIModeType = 'suggest' | 'expand' | 'cluster' | 'links' | 'summarize' | 'research'

interface AIModeConfig {
  id: AIModeType
  name: string
  description: string
  icon: string
}

const AI_MODES: AIModeConfig[] = [
  { id: 'suggest', name: 'Suggest Ideas', description: 'Generate new ideas based on existing nodes', icon: '✨' },
  { id: 'expand', name: 'Expand Details', description: 'Elaborate on selected nodes with more details', icon: '🔍' },
  { id: 'links', name: 'Find Links', description: 'Discover relationships between nodes', icon: '🔗' },
  { id: 'summarize', name: 'Summarize', description: 'Create summaries of node clusters', icon: '📝' },
  { id: 'research', name: 'Research', description: 'Find external information and insights', icon: '🔬' }
]

interface AISidebarProps extends React.ComponentProps<typeof Sidebar> {
  nodes: Node<ReactFlowNodeDataType>[]
  edges: Edge<ReactFlowEdgeDataType>[]
  selectedNodes: Node<ReactFlowNodeDataType>[]
  onAIAction?: (mode: AIModeType, context: any) => void
}

export function AISidebar({
  nodes,
  edges,
  selectedNodes,
  onAIAction,
  ...props
}: AISidebarProps) {
  const [activeAIMode, setActiveAIMode] = useState<AIModeType>('suggest')
  const [isLoading, setIsLoading] = useState(false)
  const [prompt, setPrompt] = useState('')

  // AI Assistant handlers
  const handleAIAction = async () => {
    if (!onAIAction) return
    
    setIsLoading(true)
    try {
      const context = {
        nodes,
        edges,
        selectedNodes,
        prompt: prompt.trim() || undefined
      }
      await onAIAction(activeAIMode, context)
    } catch (error) {
      console.error('AI action failed:', error)
    } finally {
      setIsLoading(false)
      setPrompt('')
    }
  }

  const getContextInfo = () => ({
    selectedCount: selectedNodes.length,
    hasSelection: selectedNodes.length > 0
  })

  const contextInfo = getContextInfo()
  const currentAIMode = AI_MODES.find(m => m.id === activeAIMode)!

  return (
    <Sidebar {...props} className="w-80 min-w-80 max-w-[30rem] resize-x">
      <SidebarContent>
            {/* AI Modes */}
            <SidebarGroup>
              <SidebarGroupLabel>AI Assistant</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {AI_MODES.map((aiMode) => (
                    <SidebarMenuItem key={aiMode.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveAIMode(aiMode.id)}
                        isActive={activeAIMode === aiMode.id}
                        className="flex items-center gap-3 p-3 h-12 rounded-xl"
                      >
                        <span className="text-lg">{aiMode.icon}</span>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{aiMode.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {aiMode.description}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>



            {/* Active AI Mode Content */}
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2">
                <span>{currentAIMode.icon}</span>
                {currentAIMode.name}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-4">
                  <div className="space-y-4">
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={`Enter your ${currentAIMode.name.toLowerCase()} request...`}
                      className="min-h-[100px] resize-none"
                    />
                    
                    {contextInfo.hasSelection && (
                      <div className="text-xs text-muted-foreground p-2 rounded-lg bg-muted/30">
                        Working with {contextInfo.selectedCount} selected node(s)
                      </div>
                    )}
                  </div>

                  {/* AI Action Button */}
                  <Button
                    onClick={handleAIAction}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : (
                      `${currentAIMode.name} ${contextInfo.hasSelection ? `(${contextInfo.selectedCount})` : ''}`
                    )}
                  </Button>
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
}: AISidebarProps) {
  const [activeAIMode, setActiveAIMode] = useState<AIModeType>('suggest')
  const [isLoading, setIsLoading] = useState(false)
  const [prompt, setPrompt] = useState('')

  const handleAIAction = async () => {
    if (!onAIAction) return
    setIsLoading(true)
    try {
      const context = { nodes, edges, selectedNodes, prompt: prompt.trim() || undefined }
      await onAIAction(activeAIMode, context)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCount = selectedNodes.length
  const currentAIMode = AI_MODES.find(m => m.id === activeAIMode)!

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2">
        {AI_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveAIMode(m.id)}
            className={`h-12 px-4 rounded-lg border transition-colors ${activeAIMode === m.id ? 'bg-accent' : 'hover:bg-accent/50'}`}
          >
            <span className="mr-2">{m.icon}</span>
            <span className="font-medium text-sm">{m.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-4">
        <div className="mb-2 text-sm font-semibold flex items-center gap-2">
          <span>{currentAIMode.icon}</span>
          <span>{currentAIMode.name}</span>
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Enter your ${currentAIMode.name.toLowerCase()} request...`}
          className="min-h-[120px] resize-none"
        />
        {selectedCount > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">Working with {selectedCount} selected node(s)</div>
        )}
        <Button onClick={handleAIAction} disabled={isLoading} className="mt-3">
          {isLoading ? 'Processing…' : currentAIMode.name}
        </Button>
      </div>
    </div>
  )
}
