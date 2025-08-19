'use client'

import React, { useCallback, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { ReactFlowNodeDataType, ReactFlowEdgeDataType, NodeKind, Relation } from '@/lib/schemas'
import { IdeaNodeCard } from './nodes/IdeaNodeCard'
import { RelationEdge } from './edges/RelationEdge'

// Define custom node types
const nodeTypes: NodeTypes = {
  ideaNode: IdeaNodeCard,
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
  onNodeClick?: (node: Node<ReactFlowNodeDataType>) => void
  onNodeDoubleClick?: (node: Node<ReactFlowNodeDataType>) => void
  onEdgeClick?: (edge: Edge<ReactFlowEdgeDataType>) => void
  onConnect?: (connection: Connection) => void
  className?: string
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
  className = '',
}: GraphCanvasProps) {
  const [nodes, setNodes, onNodesStateChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesStateChange] = useEdgesState(initialEdges)

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
        onNodeClick(node)
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

  // Theme-aware minimap node color
  const getNodeColor = useCallback((node: Node<ReactFlowNodeDataType>) => {
    // Check if dark mode is active
    const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
    
    if (isDark) {
      // Dark mode: use #191919 for all nodes
      return '#191919'
    } else {
      // Light mode: use white for all nodes
      return '#ffffff'
    }
  }, [])

  return (
    <div className={`w-full h-full ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="top-right"
      >
        <Controls />
        <MiniMap nodeColor={getNodeColor} />
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
