import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const parcel = await prisma.parcel.findUnique({
      where: { id: params.id },
      include: {
        fitScore: true,
        features: true,
        ownership: true,
        listings: {
          include: {
            source: true
          },
          orderBy: { lastSeenAt: 'desc' }
        },
        deals: {
          include: {
            activities: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        }
      }
    })
    
    if (!parcel) {
      return NextResponse.json({ error: 'Parcel not found' }, { status: 404 })
    }
    
    return NextResponse.json(parcel)
    
  } catch (error) {
    console.error('Parcel API error:', error)
    return NextResponse.json(
      { error: 'Failed to get parcel' },
      { status: 500 }
    )
  }
}