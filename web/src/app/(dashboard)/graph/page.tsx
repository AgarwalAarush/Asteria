'use client'

import { useState, useEffect } from 'react'
import { Node, Edge } from 'reactflow'
import { GraphCanvasProvider } from '@/components/GraphCanvas'
import { AIOverlay } from '@/components/unified-sidebar'
import { NodeEditModal } from '@/components/node-edit-modal'
import { AuthModal } from '@/components/auth/AuthModal'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { ReactFlowNodeDataType, ReactFlowEdgeDataType } from '@/lib/schemas'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

// Theme-aware logo component
function AsteriaLogo() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    
    updateTheme() // Initial check
    
    // Watch for theme changes
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    })
    
    return () => observer.disconnect()
  }, [])

  return (
    <img 
      src={isDark ? '/asteria-dark.png' : '/asteria-light.png'}
      alt="Asteria"
      className="h-6 w-auto"
    />
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
      relation: 'solves',
      weight: 0.8,
    },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    type: 'relationEdge',
    data: {
      id: 'e2-3',
      source: '2',
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false)

  // Check for demo mode in localStorage - MUST be at top level
  useEffect(() => {
    const demoMode = localStorage.getItem('asteria-demo-mode')
    if (demoMode === 'true') {
      setIsDemoMode(true)
    }
  }, [])

  // Handle node selection
  const handleNodeClick = (node: Node<ReactFlowNodeDataType>) => {
    // Update selected nodes for multi-selection (for now, just single selection)
    setSelectedNodes([node])
  }

  // Handle double-click to edit
  const handleNodeDoubleClick = (node: Node<ReactFlowNodeDataType>) => {
    setEditingNode(node)
    setIsEditModalOpen(true)
  }

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
    <SidebarProvider>
      <SidebarInset>
        {/* Modern Navigation Header */}
        <header className="flex h-12 shrink-0 items-center gap-4 px-6 bg-white dark:bg-black">
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
              ⭐
            </button>
          </div>
        </header>

        {/* Main graph canvas */}
        <div className="flex flex-1 flex-col">
          <div className="min-h-[calc(100vh-3rem)] flex-1 bg-white dark:bg-black">
            <GraphCanvasProvider
              nodes={nodes}
              edges={edges}
              onNodesChange={setNodes}
              onEdgesChange={setEdges}
              onNodeClick={handleNodeClick}
              onNodeDoubleClick={handleNodeDoubleClick}
              onConnect={handleConnect}
              className="w-full h-full"
            />
          </div>
        </div>
      </SidebarInset>

      {/* AI Assistant Overlay */}
      {isAIAssistantOpen && (
        <div className="pointer-events-none fixed left-1/2 top-16 z-30 w-[min(1000px,92vw)] -translate-x-1/2">
          <div className="pointer-events-auto rounded-xl border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 shadow-lg">
            <div className="p-3 border-b">
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()} asChild>
                      <span>AI Assistant</span>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
            <div className="p-4">
              <AIOverlay
                nodes={nodes}
                edges={edges}
                selectedNodes={selectedNodes}
                onAIAction={handleAIAction}
              />
            </div>
          </div>
        </div>
      )}

      {/* Node Edit Modal */}
      <NodeEditModal
        node={editingNode}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingNode(null)
        }}
        onSave={handleNodeUpdate}
      />
    </SidebarProvider>
  )
}
