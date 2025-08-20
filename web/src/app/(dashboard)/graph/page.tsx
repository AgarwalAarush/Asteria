'use client'

import { useState, useEffect, useCallback } from 'react'
import { Node, Edge } from 'reactflow'
import { GraphCanvasProvider } from '@/components/GraphCanvas'
import { AIOverlay } from '@/components/unified-sidebar'
import { NodeEditPanel } from '@/components/NodeEditPanel'
import { AuthModal } from '@/components/auth/AuthModal'
import { SettingsDialog } from '@/components/SettingsDialog'
import { Button } from '@/components/ui/button'
import { Download, Upload } from 'lucide-react'
import { useAutoSave, useGraphData } from '@/hooks/useAutoSave'
import { DatabaseService } from '@/lib/database'


import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { ReactFlowNodeDataType, ReactFlowEdgeDataType, NodeKind, Relation } from '@/lib/schemas'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

// Theme-aware logo text component
function AsteriaLogo() {
  return (
    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
      Asteria
    </h1>
  )
}

// Sample data for initial development
const sampleNodes: Node<ReactFlowNodeDataType>[] = [
  {
    id: '1',
    type: 'ideaNode',
    position: { x: 0, y: 0 },
    data: {
      id: '1',
      title: 'Remote work productivity issues',
      kind: 'problem',
      body: 'Many remote workers struggle with focus and productivity due to distractions at home.',
      tags: ['remote-work', 'productivity'],
      scorePainkiller: 4,
      scoreFounderFit: 3,
      scoreTiming: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    id: '2',
    type: 'ideaNode',
    position: { x: 400, y: -100 },
    data: {
      id: '2',
      title: 'AI-powered focus assistant',
      kind: 'solution',
      body: 'An AI assistant that helps remote workers maintain focus by blocking distractions and providing structured work sessions.',
      tags: ['ai', 'productivity', 'focus'],
      scorePracticality: 4,
      scoreMoat: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    id: '3',
    type: 'ideaNode',
    position: { x: 400, y: 100 },
    data: {
      id: '3',
      title: 'Remote work tools market',
      kind: 'market',
      body: 'The remote work tools market is growing rapidly, with companies spending more on productivity software.',
      tags: ['market-research', 'remote-work'],
      scoreTiming: 5,
      scoreFounderFit: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
]

const sampleEdges: Edge<ReactFlowEdgeDataType>[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'relationEdge',
    data: {
      id: 'e1-2',
      source: '1',
      target: '2',
      relation: 'related',
      weight: 0.8,
    },
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    type: 'relationEdge',
    data: {
      id: 'e1-3',
      source: '1',
      target: '3',
      relation: 'related',
      weight: 0.6,
    },
  },
]

export default function GraphPage() {
  const { user, loading, supabase } = useSupabase()
  
  // Load data from database on mount
  const { nodes: loadedNodes, edges: loadedEdges, isLoading: isLoadingData, error: loadError, refresh: refreshData } = useGraphData()
  
  // Use loaded data or fallback to sample data
  const [nodes, setNodes] = useState<Node<ReactFlowNodeDataType>[]>(loadedNodes.length > 0 ? loadedNodes : sampleNodes)
  const [edges, setEdges] = useState<Edge<ReactFlowEdgeDataType>[]>(loadedEdges.length > 0 ? loadedEdges : sampleEdges)
  
  // Auto-save changes to database
  const { saveNow, isSaving } = useAutoSave(nodes, edges, {
    onSaveStart: () => console.log('Auto-saving...'),
    onSaveEnd: () => console.log('Auto-save complete'),
    onSaveError: (error) => console.error('Auto-save failed:', error)
  })
  const [selectedNodes, setSelectedNodes] = useState<Node<ReactFlowNodeDataType>[]>([])
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [editingNode, setEditingNode] = useState<Node<ReactFlowNodeDataType> | null>(null)
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false)
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false)
  const [isAddingNewNode, setIsAddingNewNode] = useState(false)
  const [isAIFocused, setIsAIFocused] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [layoutFunctions, setLayoutFunctions] = useState<{
    relayoutAll: () => void
    relayoutFrom: (nodeId: string) => void
  } | null>(null)

  // Check for demo mode in localStorage - MUST be at top level
  useEffect(() => {
    const demoMode = localStorage.getItem('asteria-demo-mode')
    if (demoMode === 'true') {
      setIsDemoMode(true)
    }
  }, [])
  
  // Update local state when data loads from database
  useEffect(() => {
    if (!isLoadingData && loadedNodes.length > 0) {
      setNodes(loadedNodes)
    }
    if (!isLoadingData && loadedEdges.length > 0) {
      setEdges(loadedEdges)
    }
    
    // Trigger layout after data loads
    if (!isLoadingData && loadedNodes.length > 0 && layoutFunctions) {
      setTimeout(() => {
        layoutFunctions.relayoutAll()
      }, 100)
    }
  }, [loadedNodes, loadedEdges, isLoadingData, layoutFunctions])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      const target = e.target as HTMLElement
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      
      if (isTyping) return

      // Toggle AI Assistant with 'a' key when not focused on edit panels
      if (e.key.toLowerCase() === 'a' && !isEditPanelOpen && !isAIFocused) {
        e.preventDefault()
        setIsAIAssistantOpen(!isAIAssistantOpen)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEditPanelOpen, isAIFocused, isAIAssistantOpen])

  // Handle node selection (with multi-select support)
  const handleNodeClick = useCallback((node: Node<ReactFlowNodeDataType>, event?: React.MouseEvent) => {
    if (event?.ctrlKey || event?.metaKey) {
      // Multi-select: add/remove from selection
      setSelectedNodes(prev => {
        const isSelected = prev.some(n => n.id === node.id)
        if (isSelected) {
          return prev.filter(n => n.id !== node.id)
        } else {
          return [...prev, node]
        }
      })
    } else {
      // Single select
      setSelectedNodes([node])
    }
  }, [])

  // Handle double-click to edit
  const handleNodeDoubleClick = useCallback((node: Node<ReactFlowNodeDataType>) => {
    setEditingNode(node)
    setIsEditPanelOpen(true)
    setIsAddingNewNode(false)
  }, [])


  // Handle node updates
  const handleNodeUpdate = async (nodeId: string, updates: Partial<ReactFlowNodeDataType>) => {
    // Update local state - auto-save will handle database persistence
    setNodes(prevNodes => 
      prevNodes.map(node => {
        if (node.id === nodeId) {
          const updatedNode = { ...node, data: { ...node.data, ...updates, updatedAt: new Date().toISOString() } }
          return updatedNode
        }
        return node
      })
    )
    
    // Update selected nodes if any match
    setSelectedNodes(prevSelected => 
      prevSelected.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...updates, updatedAt: new Date().toISOString() } }
          : node
      )
    )
  }

  // Handle AI actions
  const handleAIAction = async (mode: 'suggest' | 'expand' | 'cluster' | 'links' | 'summarize' | 'research', context: any) => {
    console.log('AI Action:', mode, context)
    // TODO: Implement AI endpoint calls
    alert(`AI ${mode} action triggered! Check console for context.`)
  }

  // Handle new connections
  const handleConnect = (connection: any) => {
    const newEdge: Edge<ReactFlowEdgeDataType> = {
      id: `e${connection.source}-${connection.target}`,
      source: connection.source!,
      target: connection.target!,
      type: 'relationEdge',
      data: {
        id: `e${connection.source}-${connection.target}`,
        source: connection.source!,
        target: connection.target!,
        relation: 'related',
        weight: 0.5,
      },
    }
    setEdges((eds) => [...eds, newEdge])
  }

  // Handle layout ready callback
  const handleLayoutReady = useCallback((relayoutAll: () => void, relayoutFrom: (nodeId: string) => void) => {
    setLayoutFunctions({ relayoutAll, relayoutFrom })
  }, [])

  // Handle initiating new node creation (just opens edit panel)
  const handleAddNode = (newNode: Node<ReactFlowNodeDataType>) => {
    // Don't add to graph yet, just open edit panel
    setEditingNode(newNode)
    setIsEditPanelOpen(true)
    setIsAddingNewNode(true)
  }

  // Actually add node to graph (called when "Add Node" is pressed)
  const handleConfirmAddNode = (nodeData: Partial<ReactFlowNodeDataType>, position: { x: number; y: number }) => {
    const newNodeId = `node-${Date.now()}`
    const newNode: Node<ReactFlowNodeDataType> = {
      id: newNodeId,
      type: 'ideaNode',
      position,
      data: {
        id: newNodeId,
        title: nodeData.title || 'New Node',
        kind: nodeData.kind || 'note',
        body: nodeData.body || '',
        tags: nodeData.tags || [],
        scorePainkiller: nodeData.scorePainkiller,
        scoreFounderFit: nodeData.scoreFounderFit,
        scoreTiming: nodeData.scoreTiming,
        scoreMoat: nodeData.scoreMoat,
        scorePracticality: nodeData.scorePracticality,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }

    setNodes((nds) => [...nds, newNode])

    // Check if this node has a pending parent (from plus button)
    const pendingParentId = (editingNode as any)?.pendingParentId
    if (pendingParentId) {
      // Create edge from parent to new node
      const newEdgeId = `edge-${Date.now()}`
      const newEdge: Edge<ReactFlowEdgeDataType> = {
        id: newEdgeId,
        source: pendingParentId,
        target: newNodeId,
        type: 'relationEdge',
        data: {
          id: newEdgeId,
          source: pendingParentId,
          target: newNodeId,
          relation: 'related',
          weight: 0.7,
        },
      }
      
      setEdges((eds) => [...eds, newEdge])
    }
    
    // Apply layout after node (and possibly edge) is added
    setTimeout(() => {
      if (layoutFunctions) {
        layoutFunctions.relayoutAll()
      }
    }, 100)

    return newNode
  }

  // Handle deleting nodes
  const handleDeleteNode = useCallback(async (nodeId: string) => {
    // Optimistically update local state first for better UX
    setNodes((nds) => nds.filter(n => n.id !== nodeId))
    setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId))
    
    // Close edit panel if deleting the currently edited node
    if (editingNode?.id === nodeId) {
      setIsEditPanelOpen(false)
      setEditingNode(null)
    }

    // Delete from database in background
    try {
      await DatabaseService.deleteNode(nodeId)
    } catch (error) {
      console.error('Failed to delete node from database:', error)
      // If database delete fails, we could revert the optimistic update here
      // but for now we'll just log the error
    }

    // Apply layout after deletion
    setTimeout(() => {
      if (layoutFunctions) {
        layoutFunctions.relayoutAll()
      }
    }, 0)
  }, [editingNode?.id, layoutFunctions])

  // Handle adding linked nodes from radial actions
  const handleAddLinkedNode = (fromNodeId: string, kind: NodeKind, relation: Relation) => {
    const fromNode = nodes.find(n => n.id === fromNodeId)
    if (!fromNode) return

    // Position new node relative to the source node
    const offset = 200
    const newNode: Node<ReactFlowNodeDataType> = {
      id: `node-${Date.now()}`,
      type: 'ideaNode',
      position: { 
        x: fromNode.position.x + offset, 
        y: fromNode.position.y 
      },
      data: {
        id: `node-${Date.now()}`,
        title: `New ${kind}`,
        kind,
        body: '',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }

    const newEdge: Edge<ReactFlowEdgeDataType> = {
      id: `edge-${Date.now()}`,
      source: fromNodeId,
      target: newNode.id,
      type: 'relationEdge',
      data: {
        id: `edge-${Date.now()}`,
        source: fromNodeId,
        target: newNode.id,
        relation,
        weight: 0.8,
      },
    }

    setNodes((nds) => [...nds, newNode])
    setEdges((eds) => [...eds, newEdge])
  }

  // Handle adding parent relationship
  const handleAddParent = (childId: string, parentId: string) => {
    // Check if edge already exists
    const existingEdge = edges.find(e => 
      e.source === parentId && e.target === childId
    )
    
    if (existingEdge) return // Edge already exists

    const newEdge: Edge<ReactFlowEdgeDataType> = {
      id: `edge-${Date.now()}`,
      source: parentId,
      target: childId,
      type: 'relationEdge',
      data: {
        id: `edge-${Date.now()}`,
        source: parentId,
        target: childId,
        relation: 'related',
        weight: 0.7,
      },
    }

    setEdges((eds) => [...eds, newEdge])
  }

  // Handle removing parent relationship
  const handleRemoveParent = async (childId: string, parentId: string) => {
    // Find and remove the edge
    const edgeToRemove = edges.find(e => 
      e.source === parentId && e.target === childId
    )
    
    if (edgeToRemove) {
      // Optimistically update local state first for better UX
      setEdges(prevEdges => prevEdges.filter(e => e.id !== edgeToRemove.id))
      
      // Delete from database in background
      try {
        await DatabaseService.deleteEdge(edgeToRemove.id)
      } catch (error) {
        console.error('Error deleting edge from database:', error)
        // If database delete fails, we could revert the optimistic update here
        // but for now we'll just log the error
      }
    }
  }

  // Handle adding new node with parent from hover plus button
  const handleAddNodeWithParent = useCallback((parentId: string) => {
    const timestamp = Date.now()
    const nodeId = `draft-${timestamp}`
    const currentTime = new Date().toISOString()
    
    // Create and set the editing node immediately without intermediate variables
    const editNode = {
      id: nodeId,
      type: 'ideaNode' as const,
      position: { x: 0, y: 0 },
      data: {
        id: nodeId,
        title: 'Add Node',
        kind: 'note' as const,
        body: '',
        tags: [] as string[],
        createdAt: currentTime,
        updatedAt: currentTime,
      },
    } as Node<ReactFlowNodeDataType>

    // Store the parent ID for later use when confirming the addition
    ;(editNode as any).pendingParentId = parentId

    // Just open edit panel with draft node
    setEditingNode(editNode)
    setIsEditPanelOpen(true)
    setIsAddingNewNode(true)
  }, [])

  // Export graph data
  const handleExport = () => {
    const exportData = {
      nodes: nodes.map(node => ({
        id: node.id,
        position: node.position,
        data: node.data
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        data: edge.data
      })),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `asteria-graph-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Import graph data
  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target?.result as string)
          
          // Validate import data structure
          if (!importData.nodes || !importData.edges || !Array.isArray(importData.nodes) || !Array.isArray(importData.edges)) {
            alert('Invalid file format. Please select a valid Asteria graph export file.')
            return
          }

          // Convert imported data to ReactFlow format
          const importedNodes: Node<ReactFlowNodeDataType>[] = importData.nodes.map((node: any) => ({
            id: node.id,
            type: 'ideaNode',
            position: node.position || { x: 0, y: 0 },
            data: {
              id: node.id,
              title: node.data.title || 'Untitled',
              kind: node.data.kind || 'note',
              body: node.data.body || '',
              tags: node.data.tags || [],
              scorePainkiller: node.data.scorePainkiller,
              scoreFounderFit: node.data.scoreFounderFit,
              scoreTiming: node.data.scoreTiming,
              scoreMoat: node.data.scoreMoat,
              scorePracticality: node.data.scorePracticality,
              createdAt: node.data.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          }))

          const importedEdges: Edge<ReactFlowEdgeDataType>[] = importData.edges.map((edge: any) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: 'relationEdge',
            data: {
              id: edge.id,
              source: edge.source,
              target: edge.target,
              relation: edge.data.relation || 'related',
              weight: edge.data.weight || 0.5,
            }
          }))

          // Update state
          setNodes(importedNodes)
          setEdges(importedEdges)

          // Auto-save will handle persistence

          alert(`Successfully imported ${importedNodes.length} nodes and ${importedEdges.length} edges.`)
        } catch (error) {
          console.error('Error importing file:', error)
          alert('Error importing file. Please check the file format and try again.')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  if (loading || isLoadingData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }
  
  // Show error if data failed to load
  if (loadError) {
    console.error('Failed to load graph data:', loadError)
    // Continue with sample data if database fails
  }

  // Check if Supabase is configured
  const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

  const enableDemoMode = () => {
    localStorage.setItem('asteria-demo-mode', 'true')
    setIsDemoMode(true)
    setShowAuthModal(false)
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Supabase Setup Required</h1>
          <p className="text-gray-600 mb-4">
            To use Asteria, you need to set up your Supabase project and configure environment variables.
          </p>
          <div className="text-left bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm font-medium mb-2">Steps to set up:</p>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Create a Supabase project at supabase.com</li>
              <li>2. Get your project URL and anon key</li>
              <li>3. Create a .env.local file with your credentials</li>
              <li>4. Restart the development server</li>
            </ol>
          </div>
          <div className="mt-4">
            <button
              onClick={enableDemoMode}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-2"
            >
              Continue with Demo Mode
            </button>
            <p className="text-xs text-gray-500">
              Skip Supabase setup for now and explore the interface
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!user && !isDemoMode) {
    return (
      <>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Welcome to Asteria</h1>
            <p className="text-gray-600 mb-4">Please sign in to access your mind map.</p>
            <button 
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-3"
            >
              Sign In
            </button>
            <button 
              onClick={enableDemoMode}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Demo Mode
            </button>
          </div>
        </div>
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </>
    )
  }

  const handleLogout = () => {
    if (isDemoMode) {
      localStorage.removeItem('asteria-demo-mode')
      setIsDemoMode(false)
    } else if (user) {
      supabase.auth.signOut()
    }
  }

  return (
    <div className="flex h-screen bg-white dark:bg-black">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Modern Navigation Header */}
        <header className="flex h-12 shrink-0 items-center gap-4 px-6 bg-white dark:bg-black border-b border-gray-200 dark:border-[#191919]">
          <div className="flex items-center gap-3">
            <AsteriaLogo />
          </div>
          
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Graph</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[300px] gap-2 p-4">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="#" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">Mind Map</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Visual representation of your ideas and connections
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="#" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="text-sm font-medium leading-none">Analytics</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Insights and patterns from your mind map data
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>Data</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[300px] gap-2 p-4">
                    <li>
                      <button
                        onClick={handleExport}
                        className="flex items-center w-full select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        <div className="text-left">
                          <div className="text-sm font-medium leading-none">Export Graph</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Download your mind map as a JSON file
                          </p>
                        </div>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={handleImport}
                        className="flex items-center w-full select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        <div className="text-left">
                          <div className="text-sm font-medium leading-none">Import Graph</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Load a mind map from a JSON file
                          </p>
                        </div>
                      </button>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className={navigationMenuTriggerStyle()}
                >
                  Settings
                </button>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="ml-auto flex items-center gap-4">
            <button
              onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
              className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              aria-label="Toggle AI Assistant"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="12,2 15.09,8.26 22,9 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9 8.91,8.26" fill="currentColor"/>
              </svg>
            </button>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main graph canvas */}
        <div className="flex-1 bg-white dark:bg-black">
                      <GraphCanvasProvider
              nodes={nodes}
              edges={edges}
              onNodesChange={setNodes}
              onEdgesChange={setEdges}
              onNodeClick={handleNodeClick}
              onNodeDoubleClick={handleNodeDoubleClick}
              onConnect={handleConnect}
              onAddNode={handleAddNode}
              onAddNodeWithParent={handleAddNodeWithParent}
              onDeleteNode={handleDeleteNode}
              selectedNodes={selectedNodes}
              onLayoutReady={handleLayoutReady}
              isEditPanelOpen={isEditPanelOpen}
              isAIFocused={isAIFocused}
              className="w-full h-full"
            />
        </div>
      </div>

      {/* AI Assistant Floating Window */}
      {isAIAssistantOpen && (
        <div className="fixed top-16 right-4 w-[28rem] h-[calc(100vh-5rem)] bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#262626] rounded-xl shadow-lg flex flex-col z-50 text-[13px]">
          <div className="p-4 border-b border-gray-200 dark:border-[#262626] flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h2>
            <button
              onClick={() => setIsAIAssistantOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <AIOverlay
              nodes={nodes}
              edges={edges}
              selectedNodes={selectedNodes}
              onAIAction={handleAIAction}
              onFocusChange={setIsAIFocused}
            />
          </div>
        </div>
      )}



      {/* Node Edit Panel */}
      <NodeEditPanel
        node={editingNode}
        isOpen={isEditPanelOpen}
        onClose={() => {
          setIsEditPanelOpen(false)
          setEditingNode(null)
          setIsAddingNewNode(false)
        }}
        onSave={handleNodeUpdate}
        onDelete={handleDeleteNode}
        onConfirmAdd={handleConfirmAddNode}
        allNodes={nodes}
        selectedNodes={selectedNodes}
        onAddParent={handleAddParent}
        onRemoveParent={handleRemoveParent}
        isAddingNewNode={isAddingNewNode}
        edges={edges.map(e => ({ source: e.source, target: e.target }))}
      />

      {/* Settings Dialog */}
      <SettingsDialog 
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  )
}
