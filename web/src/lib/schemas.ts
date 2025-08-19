import { z } from 'zod'

// Node kinds from the planning document
export const NodeKindSchema = z.enum(['problem', 'solution', 'market', 'tech', 'theme', 'note'])

// Relations from the planning document
export const RelationSchema = z.enum(['solves', 'depends_on', 'competes_with', 'related', 'enables', 'contradicts'])

// Roles
export const RoleSchema = z.enum(['OWNER', 'EDITOR', 'VIEWER'])

// Score schema for idea nodes
export const ScoreSchema = z.object({
  painkiller: z.number().min(1).max(5).optional(),
  founderFit: z.number().min(1).max(5).optional(),
  timing: z.number().min(1).max(5).optional(),
  moat: z.number().min(1).max(5).optional(),
  practicality: z.number().min(1).max(5).optional()
}).partial().optional()

// Draft schemas for AI-generated content
export const IdeaNodeDraft = z.object({
  title: z.string().min(1),
  kind: NodeKindSchema,
  body: z.string().optional(),
  tags: z.array(z.string()).optional(),
  score: ScoreSchema
})

export const LinkSuggestion = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  relation: RelationSchema,
  confidence: z.number().min(0).max(1),
  rationale: z.string().optional()
})

// React Flow node data schema
export const ReactFlowNodeData = z.object({
  id: z.string(),
  title: z.string(),
  kind: NodeKindSchema,
  body: z.string().optional(),
  tags: z.array(z.string()).default([]),
  scorePainkiller: z.number().min(1).max(5).nullable().optional(),
  scoreFounderFit: z.number().min(1).max(5).nullable().optional(),
  scoreTiming: z.number().min(1).max(5).nullable().optional(),
  scoreMoat: z.number().min(1).max(5).nullable().optional(),
  scorePracticality: z.number().min(1).max(5).nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
})

// React Flow edge data schema
export const ReactFlowEdgeData = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  relation: RelationSchema,
  weight: z.number().nullable().optional()
})

// Export types
export type NodeKind = z.infer<typeof NodeKindSchema>
export type Relation = z.infer<typeof RelationSchema>
export type Role = z.infer<typeof RoleSchema>
export type Score = z.infer<typeof ScoreSchema>
export type IdeaNodeDraftType = z.infer<typeof IdeaNodeDraft>
export type LinkSuggestionType = z.infer<typeof LinkSuggestion>
export type ReactFlowNodeDataType = z.infer<typeof ReactFlowNodeData>
export type ReactFlowEdgeDataType = z.infer<typeof ReactFlowEdgeData>
