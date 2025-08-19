export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      User: {
        Row: {
          id: string
          email: string
          name: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Relationships: []
      }
      Space: {
        Row: {
          id: string
          name: string
          ownerId: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          ownerId: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          name?: string
          ownerId?: string
          createdAt?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Space_ownerId_fkey"
            columns: ["ownerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          }
        ]
      }
      SpaceMember: {
        Row: {
          id: string
          spaceId: string
          userId: string
          role: Database["public"]["Enums"]["Role"]
        }
        Insert: {
          id?: string
          spaceId: string
          userId: string
          role?: Database["public"]["Enums"]["Role"]
        }
        Update: {
          id?: string
          spaceId?: string
          userId?: string
          role?: Database["public"]["Enums"]["Role"]
        }
        Relationships: [
          {
            foreignKeyName: "SpaceMember_spaceId_fkey"
            columns: ["spaceId"]
            isOneToOne: false
            referencedRelation: "Space"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "SpaceMember_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          }
        ]
      }
      Node: {
        Row: {
          id: string
          spaceId: string
          title: string
          kind: Database["public"]["Enums"]["NodeKind"]
          body: string
          createdAt: string
          updatedAt: string
          scorePainkiller: number | null
          scoreFounderFit: number | null
          scoreTiming: number | null
          scoreMoat: number | null
          scorePracticality: number | null
        }
        Insert: {
          id?: string
          spaceId: string
          title: string
          kind: Database["public"]["Enums"]["NodeKind"]
          body?: string
          createdAt?: string
          updatedAt?: string
          scorePainkiller?: number | null
          scoreFounderFit?: number | null
          scoreTiming?: number | null
          scoreMoat?: number | null
          scorePracticality?: number | null
        }
        Update: {
          id?: string
          spaceId?: string
          title?: string
          kind?: Database["public"]["Enums"]["NodeKind"]
          body?: string
          createdAt?: string
          updatedAt?: string
          scorePainkiller?: number | null
          scoreFounderFit?: number | null
          scoreTiming?: number | null
          scoreMoat?: number | null
          scorePracticality?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Node_spaceId_fkey"
            columns: ["spaceId"]
            isOneToOne: false
            referencedRelation: "Space"
            referencedColumns: ["id"]
          }
        ]
      }
      Edge: {
        Row: {
          id: string
          spaceId: string
          sourceId: string
          targetId: string
          relation: Database["public"]["Enums"]["Relation"]
          weight: number | null
        }
        Insert: {
          id?: string
          spaceId: string
          sourceId: string
          targetId: string
          relation: Database["public"]["Enums"]["Relation"]
          weight?: number | null
        }
        Update: {
          id?: string
          spaceId?: string
          sourceId?: string
          targetId?: string
          relation?: Database["public"]["Enums"]["Relation"]
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Edge_spaceId_fkey"
            columns: ["spaceId"]
            isOneToOne: false
            referencedRelation: "Space"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Edge_sourceId_fkey"
            columns: ["sourceId"]
            isOneToOne: false
            referencedRelation: "Node"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Edge_targetId_fkey"
            columns: ["targetId"]
            isOneToOne: false
            referencedRelation: "Node"
            referencedColumns: ["id"]
          }
        ]
      }
      Tag: {
        Row: {
          id: string
          spaceId: string
          label: string
        }
        Insert: {
          id?: string
          spaceId: string
          label: string
        }
        Update: {
          id?: string
          spaceId?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "Tag_spaceId_fkey"
            columns: ["spaceId"]
            isOneToOne: false
            referencedRelation: "Space"
            referencedColumns: ["id"]
          }
        ]
      }
      NodeTag: {
        Row: {
          nodeId: string
          tagId: string
        }
        Insert: {
          nodeId: string
          tagId: string
        }
        Update: {
          nodeId?: string
          tagId?: string
        }
        Relationships: [
          {
            foreignKeyName: "NodeTag_nodeId_fkey"
            columns: ["nodeId"]
            isOneToOne: false
            referencedRelation: "Node"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "NodeTag_tagId_fkey"
            columns: ["tagId"]
            isOneToOne: false
            referencedRelation: "Tag"
            referencedColumns: ["id"]
          }
        ]
      }
      Snippet: {
        Row: {
          id: string
          spaceId: string
          url: string | null
          title: string | null
          quote: string
          date: string | null
          tags: string[]
          embedding: number[] | null
        }
        Insert: {
          id?: string
          spaceId: string
          url?: string | null
          title?: string | null
          quote: string
          date?: string | null
          tags?: string[]
          embedding?: number[] | null
        }
        Update: {
          id?: string
          spaceId?: string
          url?: string | null
          title?: string | null
          quote?: string
          date?: string | null
          tags?: string[]
          embedding?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "Snippet_spaceId_fkey"
            columns: ["spaceId"]
            isOneToOne: false
            referencedRelation: "Space"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      Role: "OWNER" | "EDITOR" | "VIEWER"
      NodeKind: "problem" | "solution" | "market" | "tech" | "theme" | "note"
      Relation: "solves" | "depends_on" | "competes_with" | "related" | "enables" | "contradicts"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
