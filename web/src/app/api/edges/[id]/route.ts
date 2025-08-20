import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE - Delete an edge
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: edgeId } = await params

    // Use deleteMany to avoid errors when edge doesn't exist
    const result = await prisma.edge.deleteMany({
      where: { id: edgeId }
    })

    // Log if no edge was found but still return success
    if (result.count === 0) {
      console.log(`Edge ${edgeId} not found, but operation completed successfully`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete edge:', error)
    return NextResponse.json({ error: 'Failed to delete edge' }, { status: 500 })
  }
}