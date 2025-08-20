'use client'

import { Plus } from 'lucide-react'
import { WebSearchToggle } from './WebSearchToggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface PlusButtonDropdownProps {
  webSearchEnabled: boolean
  onWebSearchToggle: (enabled: boolean) => void
}

export function PlusButtonDropdown({ webSearchEnabled, onWebSearchToggle }: PlusButtonDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-[#191919] hover:bg-gray-200 dark:hover:bg-[#262626] transition-colors">
          <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="mt-1 w-40 p-2 bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#262626] rounded-lg shadow-lg">
        <div className="space-y-2">
          <WebSearchToggle enabled={webSearchEnabled} onToggle={onWebSearchToggle} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
