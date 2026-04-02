import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const parcel = await prisma.parcel.findUnique({
      where: { id },
      include: {
        listings: true,
        features: true,
        fitScore: true,
        deal: {
          include: {
            activities: { orderBy: { createdAt: 'desc' } },
          },
        },
        ownership: true,
      },
    })

    if (!parcel) {
      return NextResponse.json({ error: 'Parcel not found' }, { status: 404 })
    }

    return NextResponse.json(parcel)
  } catch (error) {
    console.error('Parcel fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch parcel' },
      { status: 500 }
    )
  }
}
