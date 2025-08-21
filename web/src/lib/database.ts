import { ReactFlowNodeDataType, ReactFlowEdgeDataType } from './schemas'
import { Node as RFNode, Edge as RFEdge } from 'reactflow'

// Types for React Flow integration
export type ReactFlowNode = RFNode<ReactFlowNodeDataType>
export type ReactFlowEdge = RFEdge<ReactFlowEdgeDataType>

// Database service class using API calls
export class DatabaseService {
  // Load all nodes and edges from database
  static async loadGraphData(): Promise<{ nodes: ReactFlowNode[], edges: ReactFlowEdge[] }> {
    try {
      const response = await fetch('/api/graph')
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Load failed with status:', response.status, 'Error:', errorText)
        throw new Error(`Failed to load graph data: ${response.status} ${errorText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error loading graph data:', error)
      return { nodes: [], edges: [] }
    }
  }

  // Save multiple nodes and edges efficiently
  static async saveNodes(nodes: ReactFlowNode[]): Promise<void> {
    // We'll batch save nodes with edges
  }

  static async saveEdges(edges: ReactFlowEdge[]): Promise<void> {
    // We'll batch save edges with nodes
  }

  // Save all graph data (nodes and edges) in a single call
  static async saveGraphData(nodes: ReactFlowNode[], edges: ReactFlowEdge[]): Promise<void> {
    try {
      console.log('Saving graph data with', nodes.length, 'nodes and', edges.length, 'edges')
      
      // Clean nodes by removing React Flow specific properties
      const cleanNodes = nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data
        // Remove selected, dragging, etc. React Flow properties
      }))

      // Clean edges by removing React Flow specific properties  
      const cleanEdges = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        data: edge.data
        // Remove selected, animated, etc. React Flow properties
      }))

      const response = await fetch('/api/graph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nodes: cleanNodes, edges: cleanEdges }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Save failed with status:', response.status, 'Error:', errorText)
        throw new Error(`Failed to save graph data: ${response.status} ${errorText}`)
      }
      
      console.log('Graph data saved successfully')
    } catch (error) {
      console.error('Error saving graph data:', error)
      throw error
    }
  }

  // Delete a node and its associated edges and tags
  static async deleteNode(nodeId: string): Promise<void> {
    try {
      console.log('DatabaseService.deleteNode called with ID:', nodeId)
      const response = await fetch(`/api/nodes/${nodeId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Delete node failed with status:', response.status, 'Error:', errorText)
        
        // If node doesn't exist (404), consider it already deleted - don't throw error
        if (response.status === 404) {
          console.warn(`Node ${nodeId} not found in database, considering it already deleted`)
          return
        }
        
        throw new Error(`Failed to delete node: ${response.status} ${errorText}`)
      }
    } catch (error) {
      console.error('Error deleting node:', error)
      throw error
    }
  }

  // Delete an edge
  static async deleteEdge(edgeId: string): Promise<void> {
    try {
      const response = await fetch(`/api/edges/${edgeId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Delete edge failed with status:', response.status, 'Error:', errorText)
        throw new Error(`Failed to delete edge: ${response.status} ${errorText}`)
      }
    } catch (error) {
      console.error('Error deleting edge:', error)
      throw error
    }
  }
}