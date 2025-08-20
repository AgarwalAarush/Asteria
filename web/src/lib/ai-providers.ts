export interface AIProvider {
  key: string
  name: string
  displayName: string
}

export const AI_PROVIDERS: AIProvider[] = [
  { key: 'openai', name: 'OpenAI', displayName: 'GPT-5' },
  { key: 'anthropic', name: 'Anthropic', displayName: 'Claude' },
  { key: 'gemini', name: 'Google', displayName: 'Gemini' },
  { key: 'grok', name: 'xAI', displayName: 'Grok' },
]

// Validation functions (extracted from SettingsDialog)
export const validateAPIKey = (provider: string, apiKey: string): { isValid: boolean; error?: string } => {
  if (!apiKey.trim()) {
    return { isValid: false }
  }

  switch (provider) {
    case 'openai':
      if (apiKey.startsWith('sk-') && apiKey.length >= 20) {
        return { isValid: true }
      }
      return { isValid: false, error: 'OpenAI API keys start with "sk-" and are at least 20 characters' }
    
    case 'anthropic':
      if (apiKey.startsWith('sk-ant-') && apiKey.length >= 20) {
        return { isValid: true }
      }
      return { isValid: false, error: 'Anthropic API keys start with "sk-ant-" and are at least 20 characters' }
    
    case 'gemini':
      if (apiKey.startsWith('AI') && apiKey.length >= 20) {
        return { isValid: true }
      }
      return { isValid: false, error: 'Google API keys typically start with "AI" and are at least 20 characters' }
    
    case 'grok':
      if (apiKey.startsWith('xai-') && apiKey.length >= 20) {
        return { isValid: true }
      }
      return { isValid: false, error: 'xAI API keys start with "xai-" and are at least 20 characters' }
    
    default:
      return { isValid: false, error: 'Unknown provider' }
  }
}

import { secureLoad } from '@/lib/secure-store'

export const getValidProviders = async (): Promise<AIProvider[]> => {
  const secret = (typeof window !== 'undefined')
    ? (localStorage.getItem('asteria-local-secret') || '')
    : ''
  const results: AIProvider[] = []
  for (const provider of AI_PROVIDERS) {
    let apiKey = ''
    if (secret) {
      try {
        apiKey = await secureLoad(provider.key, secret) || ''
      } catch {}
    }
    if (!apiKey && typeof window !== 'undefined') {
      apiKey = localStorage.getItem(`asteria-${provider.key}-key`) || ''
    }
    if (validateAPIKey(provider.key, apiKey).isValid) {
      results.push(provider)
    }
  }
  return results
}
