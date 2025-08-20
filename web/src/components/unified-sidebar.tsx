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

  // AI Assistant handlers
  const handleAIAction = async () => {
    if (!onAIAction || !selectedProvider) return
    
    setIsLoading(true)
    try {
      const context = {
        nodes,
        edges,
        selectedNodes,
        prompt: prompt.trim() || undefined,
        webSearchEnabled,
        provider: selectedProvider.key
      }
      await onAIAction('suggest', context)
    } catch (error) {
      console.error('AI action failed:', error)
    } finally {
      setIsLoading(false)
      setPrompt('')
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
                      onChange={(t) => setPrompt(t)}
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

  const handleAIAction = async () => {
    if (!onAIAction || !selectedProvider) return
    setIsLoading(true)
    try {
      const context = { 
        nodes, 
        edges, 
        selectedNodes, 
        prompt: prompt.trim() || undefined,
        webSearchEnabled,
        provider: selectedProvider.key
      }
      await onAIAction('suggest', context) // Default to suggest mode since we removed modes
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
                onChange={(t) => setPrompt(t)}
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
      </div>
    </div>
  )
}
