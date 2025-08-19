'use client'

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { ReactFlowNodeDataType, NodeKind } from '@/lib/schemas'

// Light/dark adaptive colors: light => white with black border; dark => #191919 with white text
const nodeKindColors: Record<NodeKind, { bg: string; border: string; text: string }> = {
  problem: { bg: 'bg-white dark:bg-[#191919]', border: 'border-black dark:border-gray-600', text: 'text-gray-900 dark:text-white' },
  solution: { bg: 'bg-white dark:bg-[#191919]', border: 'border-black dark:border-gray-600', text: 'text-gray-900 dark:text-white' },
  market: { bg: 'bg-white dark:bg-[#191919]', border: 'border-black dark:border-gray-600', text: 'text-gray-900 dark:text-white' },
  tech: { bg: 'bg-white dark:bg-[#191919]', border: 'border-black dark:border-gray-600', text: 'text-gray-900 dark:text-white' },
  theme: { bg: 'bg-white dark:bg-[#191919]', border: 'border-black dark:border-gray-600', text: 'text-gray-900 dark:text-white' },
  note: { bg: 'bg-white dark:bg-[#191919]', border: 'border-black dark:border-gray-600', text: 'text-gray-900 dark:text-white' },
}

// Professional node kind indicators
const nodeKindLabels: Record<NodeKind, string> = {
  problem: 'PROBLEM',
  solution: 'SOLUTION',
  market: 'MARKET',
  tech: 'TECH',
  theme: 'THEME',
  note: 'NOTE',
}

export function IdeaNodeCard({ data, selected }: NodeProps<ReactFlowNodeDataType>) {
  const colors = nodeKindColors[data.kind]
  const label = nodeKindLabels[data.kind]
  
  // Calculate average score if any scores exist
  const scores = [
    data.scorePainkiller,
    data.scoreFounderFit,
    data.scoreTiming,
    data.scoreMoat,
    data.scorePracticality,
  ].filter((score): score is number => score !== null && score !== undefined)
  
  const averageScore = scores.length > 0 
    ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10 
    : null

  return (
    <div
      className={`
        relative min-w-48 max-w-64 p-3 rounded-lg border shadow-sm
        ${colors.bg} ${colors.border} ${colors.text}
        ${selected ? 'ring-2 ring-gray-400 ring-offset-2' : ''}
        transition-all duration-200 hover:shadow
      `}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-gray-500 border-2 border-white"
      />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold tracking-widest opacity-80">
          {label}
        </span>
        {averageScore && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-current">
            {averageScore}/5
          </span>
        )}
      </div>
      
      {/* Title */}
      <h3 className="font-medium text-[12px] mb-1 leading-tight">
        {data.title}
      </h3>
      
      {/* Body preview */}
      {data.body && (
        <p className="text-[11px] opacity-70 mb-2 overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {data.body}
        </p>
      )}
      
      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {data.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-current font-medium"
            >
              {tag}
            </span>
          ))}
          {data.tags.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-current font-medium">
              +{data.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Aggregate Score bottom-right */}
      <div className="absolute bottom-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
        {(
          [
            data.scorePainkiller ?? 0,
            data.scoreFounderFit ?? 0,
            data.scoreTiming ?? 0,
            data.scoreMoat ?? 0,
            data.scorePracticality ?? 0,
          ].reduce((a,b)=>a+b,0)
        )}/25
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-gray-500 border-2 border-white"
      />
    </div>
  )
}
