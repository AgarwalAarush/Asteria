import { useEffect, useRef, useCallback, useState } from 'react'
import { Node as RFNode, Edge as RFEdge } from 'reactflow'
import { ReactFlowNodeDataType, ReactFlowEdgeDataType } from '@/lib/schemas'
import { DatabaseService } from '@/lib/database'

export type ReactFlowNode = RFNode<ReactFlowNodeDataType>
export type ReactFlowEdge = RFEdge<ReactFlowEdgeDataType>

interface UseAutoSaveOptions {
  debounceMs?: number
  onSaveStart?: () => void
  onSaveEnd?: () => void
  onSaveError?: (error: Error) => void
}

export function useAutoSave(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  options: UseAutoSaveOptions = {}
) {
  const {
    debounceMs = 2000, // Auto-save after 2 seconds of no changes
    onSaveStart,
    onSaveEnd,
    onSaveError
  } = options

  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedNodesRef = useRef<string>('')
  const lastSavedEdgesRef = useRef<string>('')
  const isSavingRef = useRef(false)

  // Function to perform the actual save
  const performSave = useCallback(async () => {
    if (isSavingRef.current) return

    const currentNodesString = JSON.stringify(nodes.map(n => ({ ...n, position: undefined })))
    const currentEdgesString = JSON.stringify(edges)

    // Check if data has actually changed
    if (
      currentNodesString === lastSavedNodesRef.current &&
      currentEdgesString === lastSavedEdgesRef.current
    ) {
      return
    }

    isSavingRef.current = true
    onSaveStart?.()

    try {
      // Save nodes and edges together
      await DatabaseService.saveGraphData(nodes, edges)

      // Update last saved references
      lastSavedNodesRef.current = currentNodesString
      lastSavedEdgesRef.current = currentEdgesString

      console.log('Auto-saved graph data')
    } catch (error) {
      console.error('Auto-save failed:', error)
      onSaveError?.(error as Error)
    } finally {
      isSavingRef.current = false
      onSaveEnd?.()
    }
  }, [nodes, edges, onSaveStart, onSaveEnd, onSaveError])

  // Debounced auto-save effect
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      performSave()
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [nodes, edges, debounceMs, performSave])

  // Save immediately on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Cancel any pending debounced save
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      // Attempt immediate save (note: this may not complete in time)
      performSave().catch(console.error)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [performSave])

  // Manual save function
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    await performSave()
  }, [performSave])

  return {
    saveNow,
    isSaving: isSavingRef.current
  }
}

// Hook for loading data on mount
export function useGraphData() {
  const [data, setData] = useState<{
    nodes: ReactFlowNode[]
    edges: ReactFlowEdge[]
    isLoading: boolean
    error: Error | null
  }>({
    nodes: [],
    edges: [],
    isLoading: true,
    error: null
  })

  const loadData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }))
      const graphData = await DatabaseService.loadGraphData()
      setData({
        nodes: graphData.nodes,
        edges: graphData.edges,
        isLoading: false,
        error: null
      })
    } catch (error) {
      console.error('Failed to load graph data:', error)
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error
      }))
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return { ...data, refresh: loadData }
}