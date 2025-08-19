'use client'

import React from 'react'
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow'
import { ReactFlowEdgeDataType, Relation } from '@/lib/schemas'

// Professional grayscale color mapping for different relations
const relationColors: Record<Relation, string> = {
  solves: '#1f2937', // dark gray
  depends_on: '#374151', // medium-dark gray
  competes_with: '#4b5563', // medium gray
  related: '#6b7280', // light gray
  enables: '#374151', // medium-dark gray
  contradicts: '#9ca3af', // lighter gray
}

// Relation labels
const relationLabels: Record<Relation, string> = {
  solves: 'solves',
  depends_on: 'depends on',
  competes_with: 'competes with',
  related: 'related to',
  enables: 'enables',
  contradicts: 'contradicts',
}

export function RelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<ReactFlowEdgeDataType>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const color = data ? relationColors[data.relation] : relationColors.related
  const label = data ? relationLabels[data.relation] : 'related to'
  const weight = data?.weight

  return (
    <>
      <path
        id={id}
        style={{
          stroke: color,
          strokeWidth: selected ? 3 : 2,
          strokeOpacity: weight ? Math.max(0.3, weight) : 0.7,
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd="url(#react-flow__arrowclosed)"
      />
      
      {/* Edge label */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            borderColor: color,
            color: color,
          }}
          className={`
            text-xs px-2 py-1 rounded border bg-white shadow-sm font-medium
            ${selected ? 'ring-2 ring-gray-400' : ''}
            transition-all duration-200
          `}
        >
          {label}
          {weight && (
            <span className="ml-1 opacity-60">
              ({Math.round(weight * 100)}%)
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
