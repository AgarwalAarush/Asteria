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
} from 'reactflow'
import 'reactflow/dist/style.css'

import { ReactFlowNodeDataType, ReactFlowEdgeDataType, NodeKind, Relation } from '@/lib/schemas'
import { IdeaNodeCard } from './nodes/IdeaNodeCard'
import { RelationEdge } from './edges/RelationEdge'

// Factory function to create node with custom props
const createIdeaNodeWithProps = (onAddChild?: (parentId: string) => void) => {
  return (props: NodeProps<ReactFlowNodeDataType>) => (
    <IdeaNodeCard {...props} onAddChild={onAddChild} />
  )
}

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
  className?: string
}

// Hook for adding nodes with "N" key
function useAddNodeHotkey(wrapperRef: React.RefObject<HTMLDivElement>, onAddNode?: (node: Node<ReactFlowNodeDataType>) => void) {
  const { project } = useReactFlow()
  const mouse = useRef({ x: 200, y: 200 }) // fallback position

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }
    }
    
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'n' || !onAddNode || !wrapperRef.current) return
      
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
          title: 'New Idea',
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
  }, [project, onAddNode, wrapperRef])
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
  className = '',
}: GraphCanvasProps) {
  const [nodes, setNodes, onNodesStateChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesStateChange] = useEdgesState(initialEdges)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { project } = useReactFlow()
  const [counter, setCounter] = useState(1)

  // Use the hotkey hook
  useAddNodeHotkey(wrapperRef, onAddNode)

  // Create node types with custom props
  const nodeTypes: NodeTypes = useMemo(() => ({
    ideaNode: createIdeaNodeWithProps(onAddNodeWithParent),
  }), [onAddNodeWithParent])

  // Handle node changes
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesStateChange(changes)
      if (onNodesChange) {
        // Get updated nodes after the change
        const updatedNodes = nodes // This would need proper change application
        onNodesChange(updatedNodes)
      }
    },
    [nodes, onNodesChange, onNodesStateChange]
  )

  // Handle edge changes
  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesStateChange(changes)
      if (onEdgesChange) {
        // Get updated edges after the change
        const updatedEdges = edges // This would need proper change application
        onEdgesChange(updatedEdges)
      }
    },
    [edges, onEdgesChange, onEdgesStateChange]
  )

  // Handle new connections
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (onConnect) {
        onConnect(connection)
      } else {
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
        setEdges((eds) => addEdge(newEdge, eds))
      }
    },
    [onConnect, setEdges]
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
          title: `New Node ${counter}`,
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
        nodes={nodes}
        edges={edges}
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
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
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
