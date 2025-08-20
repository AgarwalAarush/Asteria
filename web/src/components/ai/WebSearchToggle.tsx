'use client'

import { Globe, X } from 'lucide-react'

interface WebSearchToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

export function WebSearchToggle({ enabled, onToggle }: WebSearchToggleProps) {
  return (
    <div className="flex items-center gap-1">
      {enabled ? (
        <button
          onClick={() => onToggle(false)}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        >
          <Globe className="h-3 w-3" />
          Web Search
          <X className="h-3 w-3" />
        </button>
      ) : (
        <button
          onClick={() => onToggle(true)}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#262626] rounded transition-colors"
        >
          <Globe className="h-3 w-3" />
          Web Search
        </button>
      )}
    </div>
  )
}
