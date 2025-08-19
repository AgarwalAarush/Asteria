'use client'

import React from 'react'
import { EdgeProps, getBezierPath, MarkerType } from 'reactflow'
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
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const color = data ? relationColors[data.relation] : relationColors.related
  const weight = data?.weight

  return (
    <path
      id={id}
      style={{
        stroke: color,
        strokeWidth: selected ? 3 : 2,
        strokeOpacity: weight ? Math.max(0.3, weight) : 0.7,
      }}
      className="react-flow__edge-path"
      d={edgePath}
      markerEnd={MarkerType.ArrowClosed}
    />
  )
}
