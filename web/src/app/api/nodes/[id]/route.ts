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

    // Perform deletion without complex transaction to avoid timeouts
    try {
      // Delete node-tag associations first
      const deletedNodeTags = await prisma.nodeTag.deleteMany({
        where: { nodeId }
      })
      console.log(`Deleted ${deletedNodeTags.count} node-tag associations for node ${nodeId}`)
    } catch (error) {
      console.warn(`Failed to delete node-tag associations for ${nodeId}:`, error)
    }
    
    try {
      // Delete edges involving this node
      const deletedEdges = await prisma.edge.deleteMany({
        where: {
          OR: [
            { sourceId: nodeId },
            { targetId: nodeId }
          ]
        }
      })
      console.log(`Deleted ${deletedEdges.count} edges for node ${nodeId}`)
    } catch (error) {
      console.warn(`Failed to delete edges for ${nodeId}:`, error)
    }
    
    // Delete the node itself (most important operation)
    try {
      const deletedNode = await prisma.node.delete({
        where: { id: nodeId }
      })
      console.log(`Successfully deleted node ${nodeId}`)
    } catch (error) {
      // If node deletion fails due to foreign key constraints, log and throw
      console.error(`Failed to delete node ${nodeId}:`, error)
      throw new Error(`Node deletion failed: ${error.message}`)
    }

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