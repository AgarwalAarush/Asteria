import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE - Delete a node and its associated edges and tags
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: nodeId } = await params

    await prisma.$transaction([
      // Delete node-tag associations
      prisma.nodeTag.deleteMany({
        where: { nodeId }
      }),
      // Delete edges involving this node
      prisma.edge.deleteMany({
        where: {
          OR: [
            { sourceId: nodeId },
            { targetId: nodeId }
          ]
        }
      }),
      // Delete the node itself
      prisma.node.delete({
        where: { id: nodeId }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete node:', error)
    return NextResponse.json({ error: 'Failed to delete node' }, { status: 500 })
  }
}