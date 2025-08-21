import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE - Delete a node and its associated edges and tags
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: nodeId } = await params

    console.log(`Attempting to delete node: ${nodeId}`)

    // Check if node exists first
    const nodeExists = await prisma.node.findUnique({
      where: { id: nodeId }
    })

    if (!nodeExists) {
      console.log(`Node ${nodeId} not found`)
      return NextResponse.json({ error: 'Node not found' }, { status: 404 })
    }

    // Perform deletion in transaction with proper error handling
    await prisma.$transaction(async (tx) => {
      // Delete node-tag associations first
      const deletedNodeTags = await tx.nodeTag.deleteMany({
        where: { nodeId }
      })
      console.log(`Deleted ${deletedNodeTags.count} node-tag associations for node ${nodeId}`)
      
      // Delete edges involving this node
      const deletedEdges = await tx.edge.deleteMany({
        where: {
          OR: [
            { sourceId: nodeId },
            { targetId: nodeId }
          ]
        }
      })
      console.log(`Deleted ${deletedEdges.count} edges for node ${nodeId}`)
      
      // Delete the node itself
      const deletedNode = await tx.node.delete({
        where: { id: nodeId }
      })
      console.log(`Successfully deleted node ${nodeId}`)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete node:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    return NextResponse.json({ 
      error: 'Failed to delete node', 
      details: error.message 
    }, { status: 500 })
  }
}