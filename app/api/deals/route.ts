import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const deals = await prisma.deal.findMany({
      include: {
        parcel: {
          include: {
            fitScore: true,
            listings: { take: 1 },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(deals)
  } catch (error) {
    console.error('Deals fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    )
  }
}
