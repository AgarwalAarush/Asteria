'use client'

import React, { useState, useEffect } from 'react'
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
  allNodes: Node<ReactFlowNodeDataType>[]
  selectedNodes: Node<ReactFlowNodeDataType>[]
  onAddParent: (childId: string, parentId: string) => void
  isAddingNewNode?: boolean
}

export function NodeEditPanel({ 
  node, 
  isOpen, 
  onClose, 
  onSave, 
  allNodes,
  selectedNodes,
  onAddParent,
  isAddingNewNode = false
}: NodeEditPanelProps) {
  const [formData, setFormData] = useState<Partial<ReactFlowNodeDataType>>({})
  const [parentSearch, setParentSearch] = useState('')
  const [suggestedParents, setSuggestedParents] = useState<Node<ReactFlowNodeDataType>[]>([])
  const [selectedParentIndex, setSelectedParentIndex] = useState(-1)

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
  }, [node])

  useEffect(() => {
    if (parentSearch.trim()) {
      const filtered = allNodes.filter(n => 
        n.id !== node?.id && 
        n.data.title.toLowerCase().includes(parentSearch.toLowerCase())
      ).slice(0, 5)
      setSuggestedParents(filtered)
      setSelectedParentIndex(-1)
    } else {
      setSuggestedParents([])
      setSelectedParentIndex(-1)
    }
  }, [parentSearch, allNodes, node])

  const handleSave = () => {
    if (node) {
      onSave(node.id, formData)
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

  if (!isOpen || !node) return null

  return (
    <div className="fixed top-16 left-4 w-96 h-[calc(100vh-5rem)] bg-white dark:bg-black border border-gray-200 dark:border-[#191919] rounded-xl shadow-lg flex flex-col z-50">
      <div className="p-4 border-b border-gray-200 dark:border-[#191919] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Node</h2>
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
                className="w-full justify-between border-gray-200 dark:border-[#191919] bg-white dark:bg-black text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
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
                  className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
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
          <label className="text-sm font-medium text-gray-900 dark:text-white">Tags (comma-separated)</label>
          <Input
            value={formData.tags?.join(', ') || ''}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
            }))}
            className="border-gray-200 dark:border-[#191919] bg-white dark:bg-black text-gray-900 dark:text-white"
            placeholder="tag1, tag2, tag3"
          />
        </div>

        {/* Parent Nodes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900 dark:text-white">Add Parent Nodes</label>
          
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

          <div className="relative">
            <Input
              value={parentSearch}
              onChange={(e) => setParentSearch(e.target.value)}
              onKeyDown={handleParentSearchKeyDown}
              className="border-gray-200 dark:border-[#191919] bg-white dark:bg-black text-gray-900 dark:text-white"
              placeholder="Search for parent nodes..."
            />
            {suggestedParents.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-black border border-gray-200 dark:border-[#191919] rounded-lg shadow-lg z-10">
                {suggestedParents.map((parentNode, index) => (
                  <button
                    key={parentNode.id}
                    onClick={() => handleAddParent(parentNode)}
                    className={`w-full px-2 py-1.5 text-left first:rounded-t-lg last:rounded-b-lg text-gray-900 dark:text-white transition-colors ${
                      index === selectedParentIndex 
                        ? 'bg-blue-100 dark:bg-blue-900/50' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
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
            className="border-gray-200 dark:border-[#191919] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
