'use client'

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
  ReactFlowProvider,
  useReactFlow,
  NodeProps,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { ReactFlowNodeDataType, ReactFlowEdgeDataType, NodeKind, Relation } from '@/lib/schemas'
import { IdeaNodeCard } from './nodes/IdeaNodeCard'
import { RelationEdge } from './edges/RelationEdge'
import { useAutoLayout } from '@/hooks/useAutoLayout'

// Factory function to create node with custom props
const createIdeaNodeWithProps = (onAddChild?: (parentId: string) => void) => {
  return (props: NodeProps<ReactFlowNodeDataType>) => (
    <IdeaNodeCard {...props} onAddChild={onAddChild} />
  )
}

// Define node types outside component to prevent recreation
const createNodeTypes = (onAddNodeWithParent?: (parentId: string) => void): NodeTypes => ({
  ideaNode: createIdeaNodeWithProps(onAddNodeWithParent),
})

// Define custom edge types
const edgeTypes: EdgeTypes = {
  relationEdge: RelationEdge,
}

interface GraphCanvasProps {
  nodes?: Array<Node<ReactFlowNodeDataType>>
  edges?: Array<Edge<ReactFlowEdgeDataType>>
  onNodesChange?: (nodes: Array<Node<ReactFlowNodeDataType>>) => void
  onEdgesChange?: (edges: Array<Edge<ReactFlowEdgeDataType>>) => void
  onNodeClick?: (node: Node<ReactFlowNodeDataType>, event?: React.MouseEvent) => void
  onNodeDoubleClick?: (node: Node<ReactFlowNodeDataType>) => void
  onEdgeClick?: (edge: Edge<ReactFlowEdgeDataType>) => void
  onConnect?: (connection: Connection) => void
  onAddNode?: (node: Node<ReactFlowNodeDataType>) => void
  onAddNodeWithParent?: (parentId: string) => void
  onDeleteNode?: (nodeId: string) => void
  selectedNodes?: Array<Node<ReactFlowNodeDataType>>
  onLayoutReady?: (relayoutAll: () => void, relayoutFrom: (nodeId: string) => void) => void
  className?: string
  isEditPanelOpen?: boolean
  isAIFocused?: boolean
}

// Hook for adding nodes with "N" key
function useAddNodeHotkey(wrapperRef: React.RefObject<HTMLDivElement | null>, onAddNode?: (node: Node<ReactFlowNodeDataType>) => void, disabled?: boolean, aiFocused?: boolean) {
  const { project } = useReactFlow()
  const mouse = useRef({ x: 200, y: 200 }) // fallback position

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }
    }
    
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'n' || !onAddNode || !wrapperRef.current || disabled || aiFocused) return
      
      const bounds = wrapperRef.current.getBoundingClientRect()
      const pos = project({ 
        x: mouse.current.x - bounds.left, 
        y: mouse.current.y - bounds.top 
      })
      
      const newNode: Node<ReactFlowNodeDataType> = {
        id: `node-${Date.now()}`,
        type: 'ideaNode',
        position: pos,
        data: {
          id: `node-${Date.now()}`,
          title: 'Add Node',
          kind: 'note',
          body: '',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }
      
      onAddNode(newNode)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('keydown', onKey)
    
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('keydown', onKey)
    }
  }, [project, onAddNode, wrapperRef, disabled])
}

// Hook for deleting nodes with "D" key
function useDeleteNodeHotkey(onDeleteNode?: (nodeId: string) => void, selectedNodes?: Array<Node<ReactFlowNodeDataType>>, disabled?: boolean) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'd' || !onDeleteNode || disabled) return
      if (!selectedNodes || selectedNodes.length === 0) return
      
      // Delete the first selected node
      onDeleteNode(selectedNodes[0].id)
    }

    window.addEventListener('keydown', onKey)
    
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [onDeleteNode, selectedNodes, disabled])
}

export function GraphCanvas({
  nodes: initialNodes = [],
  edges: initialEdges = [],
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  onNodeDoubleClick,
  onEdgeClick,
  onConnect,
  onAddNode,
  onAddNodeWithParent,
  onDeleteNode,
  selectedNodes = [],
  onLayoutReady,
  className = '',
  isEditPanelOpen = false,
  isAIFocused = false,
}: GraphCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const { project } = useReactFlow()
  const [counter, setCounter] = useState(1)
  const { relayoutAll, relayoutFrom } = useAutoLayout()

  // Expose layout functions to parent
  useEffect(() => {
    if (onLayoutReady) {
      onLayoutReady(relayoutAll, relayoutFrom)
    }
  }, [onLayoutReady, relayoutAll, relayoutFrom])

  // Use the hotkey hooks
  useAddNodeHotkey(wrapperRef, onAddNode, isEditPanelOpen || isAIFocused)
  useDeleteNodeHotkey(onDeleteNode, selectedNodes, isEditPanelOpen)

  // Create node types with custom props, memoized with stable dependency
  const nodeTypes: NodeTypes = useMemo(() => 
    createNodeTypes(onAddNodeWithParent), 
    [onAddNodeWithParent]
  )

  // Handle node changes - use external state management only
  const handleNodesChange = useCallback(
    (changes: any) => {
      if (onNodesChange) {
        // Apply changes to the current nodes and pass to parent
        const updatedNodes = applyNodeChanges(changes, initialNodes)
        onNodesChange(updatedNodes)
      }
    },
    [initialNodes, onNodesChange]
  )

  // Handle edge changes - use external state management only
  const handleEdgesChange = useCallback(
    (changes: any) => {
      if (onEdgesChange) {
        // Apply changes to the current edges and pass to parent
        const updatedEdges = applyEdgeChanges(changes, initialEdges)
        onEdgesChange(updatedEdges)
      }
    },
    [initialEdges, onEdgesChange]
  )

  // Handle new connections
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (onConnect) {
        onConnect(connection)
      } else if (onEdgesChange) {
        // Default behavior: add edge with 'related' relation
        const newEdge: Edge<ReactFlowEdgeDataType> = {
          id: `edge-${connection.source}-${connection.target}`,
          source: connection.source!,
          target: connection.target!,
          type: 'relationEdge',
          data: {
            id: `edge-${connection.source}-${connection.target}`,
            source: connection.source!,
            target: connection.target!,
            relation: 'related' as Relation,
            weight: null,
          },
        }
        onEdgesChange(addEdge(newEdge, initialEdges))
      }
    },
    [onConnect, onEdgesChange, initialEdges]
  )

  // Handle node clicks
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node<ReactFlowNodeDataType>) => {
      if (onNodeClick) {
        onNodeClick(node, event)
      }
    },
    [onNodeClick]
  )

  // Handle node double clicks
  const handleNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node<ReactFlowNodeDataType>) => {
      if (onNodeDoubleClick) {
        onNodeDoubleClick(node)
      }
    },
    [onNodeDoubleClick]
  )

  // Handle edge clicks
  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge<ReactFlowEdgeDataType>) => {
      if (onEdgeClick) {
        onEdgeClick(edge)
      }
    },
    [onEdgeClick]
  )

  // Handle double-click on pane to add node
  const handlePaneClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.detail !== 2 || !onAddNode || !wrapperRef.current) return // double-click only
      
      const bounds = wrapperRef.current.getBoundingClientRect()
      const pos = project({ 
        x: e.clientX - bounds.left, 
        y: e.clientY - bounds.top 
      })

      const newNode: Node<ReactFlowNodeDataType> = {
        id: `node-${Date.now()}`,
        type: 'ideaNode',
        position: pos,
        data: {
          id: `node-${Date.now()}`,
          title: 'Add Node',
          kind: 'note',
          body: '',
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }
      
      onAddNode(newNode)
      setCounter(c => c + 1)
    },
    [onAddNode, wrapperRef, project, counter]
  )



  const proOptions = { hideAttribution: true }

  return (
    <div ref={wrapperRef} className={`w-full h-full ${className}`}>
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        zoomOnDoubleClick={false}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: 0.15 }}
        fitView
        proOptions={proOptions}
      >
        <Background className="bg-white dark:bg-black" />
      </ReactFlow>
    </div>
  )
}

// Wrapper component with ReactFlowProvider
export function GraphCanvasProvider(props: GraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <GraphCanvas {...props} />
    </ReactFlowProvider>
  )
}
