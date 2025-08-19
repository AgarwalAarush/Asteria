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
    <div className="w-full space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900 dark:text-white">Mode</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between border-gray-200 dark:border-[#191919] bg-white dark:bg-black text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {currentAIMode.name}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] bg-white dark:bg-black border-gray-200 dark:border-[#191919]">
            {AI_MODES.map((mode) => (
              <DropdownMenuItem 
                key={mode.id}
                onClick={() => setActiveAIMode(mode.id)}
                className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {mode.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="space-y-3">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Enter your ${currentAIMode.name.toLowerCase()} request...`}
          className="min-h-[200px] resize-none border-gray-200 dark:border-[#191919] bg-white dark:bg-black text-gray-900 dark:text-white"
        />
        {selectedCount > 0 && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Working with {selectedCount} selected node(s)
          </div>
        )}
        <Button 
          onClick={handleAIAction} 
          disabled={isLoading} 
          className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
        >
          {isLoading ? 'Processing…' : currentAIMode.name}
        </Button>
      </div>
    </div>
  )
}
