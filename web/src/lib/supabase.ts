import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

// Client-side Supabase client
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables!')
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file')
    console.error('You can find these values in your Supabase dashboard: https://supabase.com/dashboard/project/_/settings/api')
    
    // Return a mock client for development
    return createBrowserClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-key'
    )
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Types for our database tables
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Convenience types
export type User = Tables<'User'>
export type Space = Tables<'Space'>
export type Node = Tables<'Node'>
export type Edge = Tables<'Edge'>
export type Tag = Tables<'Tag'>
export type NodeTag = Tables<'NodeTag'>
export type Snippet = Tables<'Snippet'>
export type SpaceMember = Tables<'SpaceMember'>

export type NodeKind = Enums<'NodeKind'>
export type Relation = Enums<'Relation'>
export type Role = Enums<'Role'>
