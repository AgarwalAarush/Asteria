'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Node } from 'reactflow'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ReactFlowNodeDataType, NodeKind } from '@/lib/schemas'

const NODE_KIND_OPTIONS: { value: NodeKind; label: string; description: string }[] = [
  { value: 'problem', label: 'Problem', description: 'Issues and challenges to solve' },
  { value: 'solution', label: 'Solution', description: 'Potential solutions and approaches' },
  { value: 'market', label: 'Market', description: 'Market insights and opportunities' },
  { value: 'tech', label: 'Technology', description: 'Technical considerations and tools' },
  { value: 'theme', label: 'Theme', description: 'Overarching themes and concepts' },
  { value: 'note', label: 'Note', description: 'General notes and observations' },
]

interface NodeEditModalProps {
  node: Node<ReactFlowNodeDataType> | null
  isOpen: boolean
  onClose: () => void
  onSave: (nodeId: string, updates: Partial<ReactFlowNodeDataType>) => void
}

export function NodeEditModal({ node, isOpen, onClose, onSave }: NodeEditModalProps) {
  const [formData, setFormData] = useState<Partial<ReactFlowNodeDataType>>({})
  const [tags, setTags] = useState<string>('')
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize form data when node changes
  useEffect(() => {
    if (node) {
      setFormData(node.data)
      setTags(node.data.tags?.join(', ') || '')
      setHasChanges(false)
    }
  }, [node])

  const handleInputChange = (field: keyof ReactFlowNodeDataType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleTagsChange = (value: string) => {
    setTags(value)
    const tagArray = value.split(',').map(tag => tag.trim()).filter(Boolean)
    handleInputChange('tags', tagArray)
  }

  const handleSave = () => {
    if (!node || !hasChanges) return

    const updatedData = {
      ...formData,
      updatedAt: new Date().toISOString(),
    }

    onSave(node.id, updatedData)
    setHasChanges(false)
    onClose()
  }

  const handleCancel = () => {
    if (node) {
      setFormData(node.data)
      setTags(node.data.tags?.join(', ') || '')
      setHasChanges(false)
    }
    onClose()
  }

  const currentKind = NODE_KIND_OPTIONS.find(opt => opt.value === formData.kind)

  if (!node) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Node</DialogTitle>
          <DialogDescription>
            Make changes to your node. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Node Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Node Type</label>
            <select
              value={formData.kind || 'note'}
              onChange={(e) => handleInputChange('kind', e.target.value as NodeKind)}
              className="w-full p-2 border rounded-lg bg-background"
            >
              {NODE_KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {currentKind && (
              <p className="text-xs text-muted-foreground">
                {currentKind.description}
              </p>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter node title..."
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.body || ''}
                onChange={(e) => handleInputChange('body', e.target.value)}
                placeholder="Enter detailed description..."
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <Input
                value={tags}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="tag1, tag2, tag3..."
              />
              <p className="text-xs text-muted-foreground">
                Separate tags with commas
              </p>
            </div>
          </div>

          {/* Scoring */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Scoring (1-5 scale)</h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                { key: 'scorePainkiller', label: 'Painkiller', description: 'How urgent is this problem/solution?' },
                { key: 'scoreFounderFit', label: 'Founder Fit', description: 'How well does this align with your expertise?' },
                { key: 'scoreTiming', label: 'Timing', description: 'How timely is this opportunity?' },
                { key: 'scoreMoat', label: 'Moat', description: 'How defensible is this advantage?' },
                { key: 'scorePracticality', label: 'Practicality', description: 'How feasible is implementation?' },
              ].map(({ key, label, description }) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">{label}</label>
                    <span className="text-sm font-bold px-2 py-1 rounded bg-muted">
                      {formData[key as keyof ReactFlowNodeDataType] as number || 3}/5
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData[key as keyof ReactFlowNodeDataType] as number || 3}
                    onChange={(e) => handleInputChange(key as keyof ReactFlowNodeDataType, parseInt(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-sm font-medium text-muted-foreground">Metadata</h3>
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">Created:</span>
                <br />
                {new Date(formData.createdAt || '').toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Updated:</span>
                <br />
                {new Date(formData.updatedAt || '').toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <div className="text-xs text-muted-foreground">
            {hasChanges && 'You have unsaved changes'}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
