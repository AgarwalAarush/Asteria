'use client'

import { useState, useEffect } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import { getValidProviders, AIProvider } from '@/lib/ai-providers'

interface AIProviderDropdownProps {
  selectedProvider?: AIProvider
  onProviderChange: (provider: AIProvider) => void
  disabled?: boolean
}

export function AIProviderDropdown({ selectedProvider, onProviderChange, disabled }: AIProviderDropdownProps) {
  const [validProviders, setValidProviders] = useState<AIProvider[]>([])

  useEffect(() => {
    const providers = getValidProviders()
    setValidProviders(providers)
    
    // If no provider is selected and we have valid providers, select the first one
    if (!selectedProvider && providers.length > 0) {
      onProviderChange(providers[0])
    }
  }, [selectedProvider, onProviderChange])

  if (validProviders.length === 0) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400 p-2 rounded border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#191919]">
        No AI providers configured
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 px-3 text-xs border-gray-200 dark:border-[#262626] bg-white dark:bg-[#191919] text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#262626]"
        >
          {selectedProvider?.displayName || 'Select AI'}
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[var(--radix-dropdown-menu-trigger-width)] bg-white dark:bg-[#191919] border-gray-200 dark:border-[#262626]"
      >
        {validProviders.map((provider) => (
          <DropdownMenuItem
            key={provider.key}
            onClick={() => onProviderChange(provider)}
            className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#262626] text-xs"
          >
            {provider.displayName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
