'use client'

import { useState, useEffect, useCallback } from 'react'
import { Node, Edge } from 'reactflow'
import { GraphCanvasProvider } from '@/components/GraphCanvas'
import { AIOverlay } from '@/components/unified-sidebar'
import { NodeEditPanel } from '@/components/NodeEditPanel'
import { AuthModal } from '@/components/auth/AuthModal'


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
    position: { x: 100, y: 100 },
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
    position: { x: 400, y: 100 },
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
    position: { x: 700, y: 100 },
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
  const [nodes, setNodes] = useState<Node<ReactFlowNodeDataType>[]>(sampleNodes)
  const [edges, setEdges] = useState<Edge<ReactFlowEdgeDataType>[]>(sampleEdges)
  const [selectedNodes, setSelectedNodes] = useState<Node<ReactFlowNodeDataType>[]>([])
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [editingNode, setEditingNode] = useState<Node<ReactFlowNodeDataType> | null>(null)
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false)
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false)
  const [isAddingNewNode, setIsAddingNewNode] = useState(false)

  // Check for demo mode in localStorage - MUST be at top level
  useEffect(() => {
    const demoMode = localStorage.getItem('asteria-demo-mode')
    if (demoMode === 'true') {
      setIsDemoMode(true)
    }
  }, [])

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
  const handleNodeUpdate = (nodeId: string, updates: Partial<ReactFlowNodeDataType>) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    )
    
    // Update editing node if it's the same node
    if (editingNode?.id === nodeId) {
      setEditingNode(prev => prev ? { ...prev, data: { ...prev.data, ...updates } } : null)
    }
    
    // Update selected nodes if any match
    setSelectedNodes(prevSelected => 
      prevSelected.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...updates } }
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

  // Handle adding new nodes
  const handleAddNode = (newNode: Node<ReactFlowNodeDataType>) => {
    setNodes((nds) => [...nds, newNode])
  }

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

  // Handle adding new node with parent from hover plus button
  const handleAddNodeWithParent = useCallback((parentId: string) => {
    // Generate IDs first
    const newNodeId = `node-${Date.now()}`
    const newEdgeId = `edge-${Date.now()}`
    
    setNodes((currentNodes) => {
      const parentNode = currentNodes.find(n => n.id === parentId)
      if (!parentNode) return currentNodes

      // Position new node relative to parent
      const offset = 200
      const newNode: Node<ReactFlowNodeDataType> = {
        id: newNodeId,
        type: 'ideaNode',
        position: { 
          x: parentNode.position.x + offset, 
          y: parentNode.position.y 
        },
        data: {
          id: newNodeId,
          title: 'New Node',
          kind: 'note',
          body: '',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }

      // Set the editing node for the panel (using setTimeout to ensure state update completes)
      setTimeout(() => {
        setEditingNode(newNode)
        setIsEditPanelOpen(true)
        setIsAddingNewNode(true)
      }, 0)

      return [...currentNodes, newNode]
    })
    
    // Create edge from parent to new node
    const newEdge: Edge<ReactFlowEdgeDataType> = {
      id: newEdgeId,
      source: parentId,
      target: newNodeId,
      type: 'relationEdge',
      data: {
        id: newEdgeId,
        source: parentId,
        target: newNodeId,
        relation: 'related',
        weight: 0.7,
      },
    }
    
    setEdges((eds) => [...eds, newEdge])
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
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
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="#">Export</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="ml-auto flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            >
              Logout
            </button>
            <button
              onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
              className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              aria-label="Toggle AI Assistant"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="12,2 15.09,8.26 22,9 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9 8.91,8.26" fill="currentColor"/>
              </svg>
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
              className="w-full h-full"
            />
        </div>
      </div>

      {/* AI Assistant Floating Window */}
      {isAIAssistantOpen && (
        <div className="fixed top-16 right-4 w-96 h-[calc(100vh-5rem)] bg-white dark:bg-black border border-gray-200 dark:border-[#191919] rounded-xl shadow-lg flex flex-col z-50">
          <div className="p-4 border-b border-gray-200 dark:border-[#191919] flex items-center justify-between">
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
        allNodes={nodes}
        selectedNodes={selectedNodes}
        onAddParent={handleAddParent}
        isAddingNewNode={isAddingNewNode}
        edges={edges.map(e => ({ source: e.source, target: e.target }))}
      />
    </div>
  )
}
