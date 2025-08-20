'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Node } from 'reactflow'
import { ReactFlowNodeDataType, NodeKind } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { X } from 'lucide-react'

interface NodeEditPanelProps {
  node: Node<ReactFlowNodeDataType> | null
  isOpen: boolean
  onClose: () => void
  onSave: (nodeId: string, updates: Partial<ReactFlowNodeDataType>) => void
  onDelete?: (nodeId: string) => void
  onConfirmAdd?: (nodeData: Partial<ReactFlowNodeDataType>, position: { x: number; y: number }) => Node<ReactFlowNodeDataType>
  allNodes: Node<ReactFlowNodeDataType>[]
  selectedNodes: Node<ReactFlowNodeDataType>[]
  onAddParent: (childId: string, parentId: string) => void
  onRemoveParent?: (childId: string, parentId: string) => void
  isAddingNewNode?: boolean
  edges?: { source: string; target: string }[]
}

export function NodeEditPanel({ 
  node, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  onConfirmAdd,
  allNodes,
  selectedNodes,
  onAddParent,
  onRemoveParent,
  isAddingNewNode = false,
  edges = []
}: NodeEditPanelProps) {
  const [formData, setFormData] = useState<Partial<ReactFlowNodeDataType>>({})
  const [parentSearch, setParentSearch] = useState('')
  const [suggestedParents, setSuggestedParents] = useState<Node<ReactFlowNodeDataType>[]>([])
  const [selectedParentIndex, setSelectedParentIndex] = useState(-1)
  const [tagSearch, setTagSearch] = useState('')
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [selectedTagIndex, setSelectedTagIndex] = useState(-1)

  useEffect(() => {
    if (node) {
      setFormData({
        title: node.data.title || '',
        body: node.data.body || '',
        kind: node.data.kind || 'note',
        tags: node.data.tags || [],
        scorePainkiller: node.data.scorePainkiller || undefined,
        scoreFounderFit: node.data.scoreFounderFit || undefined,
        scoreTiming: node.data.scoreTiming || undefined,
        scoreMoat: node.data.scoreMoat || undefined,
        scorePracticality: node.data.scorePracticality || undefined,
      })
    }
  }, [node?.id]) // Only reset when node ID changes, not when node object reference changes

  // Reset search states when panel opens/closes
  useEffect(() => {
    if (isOpen) {
      setParentSearch('')
      setTagSearch('')
      setSuggestedParents([])
      setSuggestedTags([])
      setSelectedParentIndex(-1)
      setSelectedTagIndex(-1)
    }
  }, [isOpen])

  // Get current parent nodes (memoized to prevent infinite loops)
  const currentParents = useMemo(() => {
    if (!node?.id) return []
    
    // Get parents from existing edges
    const edgeParents = allNodes.filter(n => 
      edges.some(e => e.source === n.id && e.target === node.id)
    )
    
    // For draft nodes with pending parent, also include the pending parent
    const pendingParentId = (node as any).pendingParentId
    if (pendingParentId && isAddingNewNode) {
      const pendingParent = allNodes.find(n => n.id === pendingParentId)
      if (pendingParent && !edgeParents.some(p => p.id === pendingParentId)) {
        return [...edgeParents, pendingParent]
      }
    }
    
    return edgeParents
  }, [node?.id, node, allNodes, edges, isAddingNewNode])

  // Get all existing tags across all nodes (memoized to prevent infinite loops)
  const allExistingTags = useMemo(() => {
    return Array.from(new Set(
      allNodes.flatMap(n => n.data.tags || [])
    )).sort()
  }, [allNodes])

  useEffect(() => {
    if (parentSearch.trim()) {
      const filtered = allNodes.filter(n => 
        n.id !== node?.id && 
        !currentParents.some(p => p.id === n.id) && // exclude current parents
        n.data.title.toLowerCase().includes(parentSearch.toLowerCase())
      ).slice(0, 5)
      setSuggestedParents(filtered)
      setSelectedParentIndex(-1)
    } else {
      setSuggestedParents([])
      setSelectedParentIndex(-1)
    }
  }, [parentSearch, allNodes, node, currentParents])

  useEffect(() => {
    if (tagSearch.trim()) {
      const currentTags = formData.tags || []
      const filtered = allExistingTags.filter(tag => 
        !currentTags.includes(tag) && // exclude current tags
        tag.toLowerCase().includes(tagSearch.toLowerCase())
      ).slice(0, 5)
      
      // If search doesn't match any existing tag, suggest creating a new one
      if (filtered.length === 0 || !filtered.some(tag => tag.toLowerCase() === tagSearch.toLowerCase())) {
        filtered.push(`Create "${tagSearch}"`)
      }
      
      setSuggestedTags(filtered)
      setSelectedTagIndex(-1)
    } else {
      setSuggestedTags([])
      setSelectedTagIndex(-1)
    }
  }, [tagSearch, allExistingTags, formData.tags])

  const handleSave = () => {
    if (isAddingNewNode && onConfirmAdd && node) {
      // For new nodes, call confirm add with form data and node position
      onConfirmAdd(formData, node.position)
      onClose()
    } else if (node) {
      // For existing nodes, call regular save
      onSave(node.id, formData)
      onClose()
    }
  }

  const handleDelete = () => {
    if (node && onDelete && !isAddingNewNode) {
      onDelete(node.id)
      onClose()
    }
  }

  const handleAddParent = (parentNode: Node<ReactFlowNodeDataType>) => {
    if (node) {
      onAddParent(node.id, parentNode.id)
      setParentSearch('')
      setSuggestedParents([])
    }
  }

  const handleAddTag = (tag: string) => {
    const newTag = tag.startsWith('Create "') ? tag.slice(8, -1) : tag
    const currentTags = formData.tags || []
    if (!currentTags.includes(newTag)) {
      setFormData(prev => ({ 
        ...prev, 
        tags: [...currentTags, newTag]
      }))
    }
    setTagSearch('')
    setSuggestedTags([])
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = formData.tags || []
    setFormData(prev => ({ 
      ...prev, 
      tags: currentTags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleRemoveParent = (parentId: string) => {
    if (node && onRemoveParent) {
      onRemoveParent(node.id, parentId)
    }
  }

  const handleParentSearchKeyDown = (e: React.KeyboardEvent) => {
    if (suggestedParents.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedParentIndex(prev => 
        prev < suggestedParents.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedParentIndex(prev => 
        prev > 0 ? prev - 1 : suggestedParents.length - 1
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const targetIndex = selectedParentIndex >= 0 ? selectedParentIndex : 0
      if (suggestedParents[targetIndex]) {
        handleAddParent(suggestedParents[targetIndex])
      }
    } else if (e.key === 'Escape') {
      setSuggestedParents([])
      setSelectedParentIndex(-1)
    }
  }

  const handleTagSearchKeyDown = (e: React.KeyboardEvent) => {
    if (suggestedTags.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedTagIndex(prev => 
        prev < suggestedTags.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedTagIndex(prev => 
        prev > 0 ? prev - 1 : suggestedTags.length - 1
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const targetIndex = selectedTagIndex >= 0 ? selectedTagIndex : 0
      if (suggestedTags[targetIndex]) {
        handleAddTag(suggestedTags[targetIndex])
      }
    } else if (e.key === 'Escape') {
      setSuggestedTags([])
      setSelectedTagIndex(-1)
    }
  }

  if (!isOpen || !node) return null

  return (
    <div className="fixed top-16 left-4 w-96 h-[calc(100vh-5rem)] bg-white dark:bg-black border border-gray-200 dark:border-[#191919] rounded-xl shadow-lg flex flex-col z-50">
      <div className="p-4 border-b border-gray-200 dark:border-[#191919] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {isAddingNewNode ? 'Add Node' : 'Edit Node'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900 dark:text-white">Title</label>
          <Input
            value={formData.title || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="border-gray-200 dark:border-[#191919] bg-white dark:bg-black text-gray-900 dark:text-white"
          />
        </div>

        {/* Kind */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900 dark:text-white">Type</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between border-gray-200 dark:border-[#191919] bg-white dark:bg-black hover:bg-accent hover:text-accent-foreground"
              >
                {formData.kind ? formData.kind.charAt(0).toUpperCase() + formData.kind.slice(1) : 'Note'}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] bg-white dark:bg-black border-gray-200 dark:border-[#191919]">
              {[
                { value: 'problem', label: 'Problem' },
                { value: 'solution', label: 'Solution' },
                { value: 'market', label: 'Market' },
                { value: 'tech', label: 'Technology' },
                { value: 'theme', label: 'Theme' },
                { value: 'note', label: 'Note' },
              ].map((option) => (
                <DropdownMenuItem 
                  key={option.value}
                  onClick={() => setFormData(prev => ({ ...prev, kind: option.value as NodeKind }))}
                  className="hover:bg-accent hover:text-accent-foreground"
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Body */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900 dark:text-white">Description</label>
          <Textarea
            value={formData.body || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
            className="min-h-[100px] resize-none border-gray-200 dark:border-[#191919] bg-white dark:bg-black text-gray-900 dark:text-white"
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900 dark:text-white">Tags</label>
          
          {/* Current Tags */}
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-[#191919] rounded-lg">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 text-xs rounded-md"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 ml-1"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Tag Search */}
          <div className="relative">
            <Input
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              onKeyDown={handleTagSearchKeyDown}
              className="border-gray-200 dark:border-[#191919] bg-white dark:bg-black text-gray-900 dark:text-white"
              placeholder="Search tags or type to create new..."
            />
            {suggestedTags.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-black border border-gray-200 dark:border-[#191919] rounded-lg shadow-lg z-10">
                {suggestedTags.map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddTag(tag)}
                    className={`w-full px-2 py-1.5 text-left first:rounded-t-lg last:rounded-b-lg transition-colors ${
                      index === selectedTagIndex 
                        ? 'bg-accent text-accent-foreground' 
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <div className={`text-xs ${tag.startsWith('Create "') ? 'font-medium text-green-600 dark:text-green-400' : ''}`}>
                      {tag}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Parent Nodes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900 dark:text-white">Parent Nodes</label>
          
          {/* Current Parent Nodes */}
          {currentParents.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-[#191919] rounded-lg">
              {currentParents.map((parent) => (
                <span
                  key={parent.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-900 dark:text-green-100 text-xs rounded-md"
                >
                  {parent.data.title}
                  <span className="text-green-700 dark:text-green-300 text-[10px] opacity-60 capitalize">
                    {parent.data.kind}
                  </span>
                  <button
                    onClick={() => handleRemoveParent(parent.id)}
                    className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 ml-1"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
          
          {/* Add selected nodes as parents */}
          {selectedNodes.length > 1 && node && selectedNodes.some(n => n.id !== node.id) && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                Selected nodes ({selectedNodes.filter(n => n.id !== node.id).length}):
              </div>
              <div className="space-y-1 mb-2">
                {selectedNodes.filter(n => n.id !== node.id).map((selectedNode) => (
                  <div key={selectedNode.id} className="text-xs text-blue-800 dark:text-blue-200">
                    • {selectedNode.data.title}
                  </div>
                ))}
              </div>
              <Button
                onClick={() => {
                  if (node) {
                    selectedNodes
                      .filter(n => n.id !== node.id)
                      .forEach(selectedNode => handleAddParent(selectedNode))
                  }
                }}
                size="sm"
                className="w-full bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                Add Selected as Parents
              </Button>
            </div>
          )}

          {/* Parent Search */}
          <div className="relative">
            <Input
              value={parentSearch}
              onChange={(e) => setParentSearch(e.target.value)}
              onKeyDown={handleParentSearchKeyDown}
              className="border-gray-200 dark:border-[#191919] bg-white dark:bg-black text-gray-900 dark:text-white"
              placeholder="Search to add parent nodes..."
            />
            {suggestedParents.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-black border border-gray-200 dark:border-[#191919] rounded-lg shadow-lg z-10">
                {suggestedParents.map((parentNode, index) => (
                  <button
                    key={parentNode.id}
                    onClick={() => handleAddParent(parentNode)}
                    className={`w-full px-2 py-1.5 text-left first:rounded-t-lg last:rounded-b-lg text-gray-900 dark:text-white transition-colors ${
                      index === selectedParentIndex 
                        ? 'bg-accent text-accent-foreground' 
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <div className="text-xs font-medium">{parentNode.data.title}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">{parentNode.data.kind}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scores */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-900 dark:text-white">Scores (1-5)</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Pain Killer</label>
              <Input
                type="number"
                min="1"
                max="5"
                value={formData.scorePainkiller || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  scorePainkiller: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                className="border-gray-200 dark:border-[#191919] bg-white dark:bg-black text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Founder Fit</label>
              <Input
                type="number"
                min="1"
                max="5"
                value={formData.scoreFounderFit || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  scoreFounderFit: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                className="border-gray-200 dark:border-[#191919] bg-white dark:bg-black text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Timing</label>
              <Input
                type="number"
                min="1"
                max="5"
                value={formData.scoreTiming || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  scoreTiming: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                className="border-gray-200 dark:border-[#191919] bg-white dark:bg-black text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Moat</label>
              <Input
                type="number"
                min="1"
                max="5"
                value={formData.scoreMoat || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  scoreMoat: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                className="border-gray-200 dark:border-[#191919] bg-white dark:bg-black text-gray-900 dark:text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-600 dark:text-gray-400">Practicality</label>
              <Input
                type="number"
                min="1"
                max="5"
                value={formData.scorePracticality || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  scorePracticality: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                className="border-gray-200 dark:border-[#191919] bg-white dark:bg-black text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-[#191919]">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button 
              onClick={handleSave}
              className="flex-1 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              {isAddingNewNode ? 'Add Node' : 'Save Changes'}
            </Button>
            <Button 
              onClick={onClose}
              variant="outline"
              className="border-gray-200 dark:border-[#191919] hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </Button>
          </div>
          {!isAddingNewNode && onDelete && (
            <Button 
              onClick={handleDelete}
              variant="outline"
              className="w-full border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Delete Node
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
