import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ReactFlowNodeDataType, ReactFlowEdgeDataType } from '@/lib/schemas'

// Default space ID for now
const DEFAULT_SPACE_ID = 'default-space'

// Get or create default space
async function getOrCreateDefaultSpace() {
  let space = await prisma.space.findFirst({
    where: { id: DEFAULT_SPACE_ID }
  })

  if (!space) {
    // Create default user if needed
    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 'default-user',
          email: 'user@example.com',
          name: 'Default User'
        }
      })
    }

    // Create default space
    space = await prisma.space.create({
      data: {
        id: DEFAULT_SPACE_ID,
        name: 'Default Space',
        ownerId: user.id
      }
    })
  }

  return space
}

// GET - Load all nodes and edges
export async function GET() {
  try {
    await getOrCreateDefaultSpace()

    const [dbNodes, dbEdges] = await Promise.all([
      prisma.node.findMany({
        where: { spaceId: DEFAULT_SPACE_ID },
        include: { tags: { include: { tag: true } } }
      }),
      prisma.edge.findMany({
        where: { spaceId: DEFAULT_SPACE_ID }
      })
    ])

    // Convert DB nodes to React Flow nodes
    const nodes = dbNodes.map(dbNode => ({
      id: dbNode.id,
      type: 'ideaNode',
      position: { x: 0, y: 0 }, // Will be positioned by layout algorithm
      data: {
        id: dbNode.id,
        title: dbNode.title,
        kind: dbNode.kind as ReactFlowNodeDataType['kind'],
        body: dbNode.body,
        tags: dbNode.tags.map(nt => nt.tag.label),
        scorePainkiller: dbNode.scorePainkiller ?? undefined,
        scoreFounderFit: dbNode.scoreFounderFit ?? undefined,
        scoreTiming: dbNode.scoreTiming ?? undefined,
        scoreMoat: dbNode.scoreMoat ?? undefined,
        scorePracticality: dbNode.scorePracticality ?? undefined,
        createdAt: dbNode.createdAt.toISOString(),
        updatedAt: dbNode.updatedAt.toISOString(),
      }
    }))

    // Convert DB edges to React Flow edges  
    const edges = dbEdges.map(dbEdge => ({
      id: dbEdge.id,
      source: dbEdge.sourceId,
      target: dbEdge.targetId,
      type: 'relationEdge',
      data: {
        id: dbEdge.id,
        source: dbEdge.sourceId,
        target: dbEdge.targetId,
        relation: dbEdge.relation as ReactFlowEdgeDataType['relation'],
        weight: dbEdge.weight,
      }
    }))

    return NextResponse.json({ nodes, edges })
  } catch (error) {
    console.error('Failed to load graph data:', error)
    return NextResponse.json({ error: 'Failed to load graph data' }, { status: 500 })
  }
}

// POST - Save nodes and edges
export async function POST(request: NextRequest) {
  try {
    const { nodes, edges } = await request.json()
    
    await getOrCreateDefaultSpace()

    // Save nodes
    for (const node of nodes) {
      const nodeData = node.data
      
      // Upsert the node
      await prisma.node.upsert({
        where: { id: node.id },
        update: {
          title: nodeData.title,
          kind: nodeData.kind,
          body: nodeData.body,
          scorePainkiller: nodeData.scorePainkiller ?? null,
          scoreFounderFit: nodeData.scoreFounderFit ?? null,
          scoreTiming: nodeData.scoreTiming ?? null,
          scoreMoat: nodeData.scoreMoat ?? null,
          scorePracticality: nodeData.scorePracticality ?? null,
          updatedAt: new Date(),
        },
        create: {
          id: node.id,
          spaceId: DEFAULT_SPACE_ID,
          title: nodeData.title,
          kind: nodeData.kind,
          body: nodeData.body,
          scorePainkiller: nodeData.scorePainkiller ?? null,
          scoreFounderFit: nodeData.scoreFounderFit ?? null,
          scoreTiming: nodeData.scoreTiming ?? null,
          scoreMoat: nodeData.scoreMoat ?? null,
          scorePracticality: nodeData.scorePracticality ?? null,
          createdAt: new Date(nodeData.createdAt),
          updatedAt: new Date(),
        }
      })

      // Handle tags
      if (nodeData.tags && nodeData.tags.length > 0) {
        // First, remove all existing tag associations
        await prisma.nodeTag.deleteMany({
          where: { nodeId: node.id }
        })

        // Create or get tags and associate them
        for (const tagLabel of nodeData.tags) {
          const tag = await prisma.tag.upsert({
            where: {
              spaceId_label: {
                spaceId: DEFAULT_SPACE_ID,
                label: tagLabel
              }
            },
            update: {},
            create: {
              spaceId: DEFAULT_SPACE_ID,
              label: tagLabel
            }
          })

          await prisma.nodeTag.create({
            data: {
              nodeId: node.id,
              tagId: tag.id
            }
          })
        }
      } else {
        // Remove all tag associations if no tags
        await prisma.nodeTag.deleteMany({
          where: { nodeId: node.id }
        })
      }
    }

    // Save edges
    for (const edge of edges) {
      const edgeData = edge.data

      await prisma.edge.upsert({
        where: { id: edge.id },
        update: {
          sourceId: edge.source,
          targetId: edge.target,
          relation: edgeData.relation,
          weight: edgeData.weight,
        },
        create: {
          id: edge.id,
          spaceId: DEFAULT_SPACE_ID,
          sourceId: edge.source,
          targetId: edge.target,
          relation: edgeData.relation,
          weight: edgeData.weight,
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save graph data:', error)
    return NextResponse.json({ error: 'Failed to save graph data' }, { status: 500 })
  }
}