'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Key, Settings as SettingsIcon, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SettingsTab = 'api-keys' | 'general'

interface APIKeyValidation {
  isValid: boolean
  isValidating: boolean
  error?: string
}

interface APIKeyStates {
  openai: APIKeyValidation
  anthropic: APIKeyValidation
  gemini: APIKeyValidation
  grok: APIKeyValidation
}

const validateAPIKey = (provider: string, apiKey: string): APIKeyValidation => {
  if (!apiKey.trim()) {
    return { isValid: false, isValidating: false }
  }

  switch (provider) {
    case 'openai':
      if (apiKey.startsWith('sk-') && apiKey.length >= 20) {
        return { isValid: true, isValidating: false }
      }
      return { isValid: false, isValidating: false, error: 'OpenAI API keys start with "sk-" and are at least 20 characters' }
    
    case 'anthropic':
      if (apiKey.startsWith('sk-ant-') && apiKey.length >= 20) {
        return { isValid: true, isValidating: false }
      }
      return { isValid: false, isValidating: false, error: 'Anthropic API keys start with "sk-ant-" and are at least 20 characters' }
    
    case 'gemini':
      if (apiKey.startsWith('AI') && apiKey.length >= 20) {
        return { isValid: true, isValidating: false }
      }
      return { isValid: false, isValidating: false, error: 'Google API keys typically start with "AI" and are at least 20 characters' }
    
    case 'grok':
      if (apiKey.startsWith('xai-') && apiKey.length >= 20) {
        return { isValid: true, isValidating: false }
      }
      return { isValid: false, isValidating: false, error: 'xAI API keys start with "xai-" and are at least 20 characters' }
    
    default:
      return { isValid: false, isValidating: false, error: 'Unknown provider' }
  }
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('api-keys')
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    gemini: '',
    grok: '',
  })
  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false,
    gemini: false,
    grok: false,
  })
  const [validationStates, setValidationStates] = useState<APIKeyStates>({
    openai: { isValid: false, isValidating: false },
    anthropic: { isValid: false, isValidating: false },
    gemini: { isValid: false, isValidating: false },
    grok: { isValid: false, isValidating: false },
  })
  const [isSaving, setIsSaving] = useState(false)

  // Load API keys from localStorage on mount
  useEffect(() => {
    if (open) {
      const stored = {
        openai: localStorage.getItem('asteria-openai-key') || '',
        anthropic: localStorage.getItem('asteria-anthropic-key') || '',
        gemini: localStorage.getItem('asteria-gemini-key') || '',
        grok: localStorage.getItem('asteria-grok-key') || '',
      }
      setApiKeys(stored)
      
      // Validate loaded keys
      const validations: APIKeyStates = {
        openai: validateAPIKey('openai', stored.openai),
        anthropic: validateAPIKey('anthropic', stored.anthropic),
        gemini: validateAPIKey('gemini', stored.gemini),
        grok: validateAPIKey('grok', stored.grok),
      }
      setValidationStates(validations)
    }
  }, [open])

  const handleApiKeyChange = (provider: keyof typeof apiKeys, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }))
    
    // Validate the key as user types
    const validation = validateAPIKey(provider, value)
    setValidationStates(prev => ({
      ...prev,
      [provider]: validation
    }))
  }

  const toggleKeyVisibility = (provider: keyof typeof showKeys) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save to localStorage
      Object.entries(apiKeys).forEach(([provider, key]) => {
        if (key.trim()) {
          localStorage.setItem(`asteria-${provider}-key`, key)
        } else {
          localStorage.removeItem(`asteria-${provider}-key`)
        }
      })
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      alert('API keys saved successfully!')
    } catch (error) {
      console.error('Error saving API keys:', error)
      alert('Error saving API keys. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const getValidationIcon = (validation: APIKeyValidation) => {
    if (validation.isValidating) {
      return <AlertCircle className="h-4 w-4 text-yellow-500 animate-pulse" />
    }
    if (validation.isValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    if (validation.error) {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    return null
  }

  const apiProviders = [
    {
      key: 'openai' as const,
      label: 'OpenAI API Key',
      placeholder: 'sk-...',
      description: 'Get your API key from',
      link: 'https://platform.openai.com/api-keys',
      linkText: 'OpenAI Platform'
    },
    {
      key: 'anthropic' as const,
      label: 'Anthropic API Key',
      placeholder: 'sk-ant-...',
      description: 'Get your API key from',
      link: 'https://console.anthropic.com/',
      linkText: 'Anthropic Console'
    },
    {
      key: 'gemini' as const,
      label: 'Google Gemini API Key',
      placeholder: 'AI...',
      description: 'Get your API key from',
      link: 'https://makersuite.google.com/app/apikey',
      linkText: 'Google AI Studio'
    },
    {
      key: 'grok' as const,
      label: 'xAI Grok API Key',
      placeholder: 'xai-...',
      description: 'Get your API key from',
      link: 'https://console.x.ai/',
      linkText: 'xAI Console'
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[180vw] w-[180vw] max-h-[85vh] overflow-hidden bg-[#191919] border-[#262626] text-white">
        <div className="flex h-[75vh]">
          {/* Sidebar */}
          <div className="w-56 border-r border-[#262626] pr-6">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('api-keys')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === 'api-keys'
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-gray-300 hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Key className="mr-3 h-4 w-4" />
                API Keys
              </button>
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === 'general'
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-gray-300 hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <SettingsIcon className="mr-3 h-4 w-4" />
                General
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 pl-8 overflow-y-auto">
            {activeTab === 'api-keys' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    API Keys
                  </h3>
                  <p className="text-sm text-gray-400">
                    Configure your API keys for AI providers. Keys are stored locally and validated automatically.
                  </p>
                </div>

                <div className="grid gap-8">
                  {apiProviders.map((provider) => (
                    <div key={provider.key} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-white">
                          {provider.label}
                        </label>
                        {getValidationIcon(validationStates[provider.key])}
                      </div>
                      
                      <div className="relative">
                        <Input
                          type={showKeys[provider.key] ? 'text' : 'password'}
                          placeholder={provider.placeholder}
                          value={apiKeys[provider.key]}
                          onChange={(e) => handleApiKeyChange(provider.key, e.target.value)}
                          className={`pr-12 bg-[#191919] border-[#262626] text-white placeholder:text-gray-500 focus:border-[#404040] focus:ring-0 transition-colors ${
                            validationStates[provider.key].error ? 'border-red-500' : 
                            validationStates[provider.key].isValid ? 'border-green-500' : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => toggleKeyVisibility(provider.key)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors"
                        >
                          {showKeys[provider.key] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      
                      {validationStates[provider.key].error && (
                        <p className="text-xs text-red-400">
                          {validationStates[provider.key].error}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-400">
                        {provider.description}{' '}
                        <a
                          href={provider.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors underline"
                        >
                          {provider.linkText}
                        </a>
                      </p>
                    </div>
                  ))}
                </div>

                <Separator className="bg-[#262626]" />

                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-400">
                    {Object.values(validationStates).filter(v => v.isValid).length} of {apiProviders.length} keys configured
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-white text-black hover:bg-gray-200 disabled:opacity-50 transition-all duration-200"
                  >
                    {isSaving ? 'Saving...' : 'Save API Keys'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    General Settings
                  </h3>
                  <p className="text-sm text-gray-400">
                    Application preferences and configuration options.
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="rounded-lg border border-[#262626] p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-white">Theme</h4>
                        <p className="text-xs text-gray-400">Choose your preferred theme</p>
                      </div>
                      <div className="text-sm text-gray-400">Auto-detect</div>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border border-[#262626] p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-white">Auto-save</h4>
                        <p className="text-xs text-gray-400">Automatically save changes to your graph</p>
                      </div>
                      <div className="text-sm text-gray-400">Enabled</div>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border border-[#262626] p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-white">Export format</h4>
                        <p className="text-xs text-gray-400">Default format for graph exports</p>
                      </div>
                      <div className="text-sm text-gray-400">JSON</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}