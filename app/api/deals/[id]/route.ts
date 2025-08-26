import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    const { stage, priority, notes, nextAction, nextActionDate } = body
    
    const deal = await prisma.deal.update({
      where: { id: params.id },
      data: {
        stage,
        priority,
        notes,
        nextAction,
        nextActionDate: nextActionDate ? new Date(nextActionDate) : null,
        updatedAt: new Date()
      }
    })
    
    // Log the stage change as an activity
    if (stage) {
      await prisma.activity.create({
        data: {
          dealId: params.id,
          userId,
          type: 'status_change',
          description: `Stage changed to ${stage}`
        }
      })
    }
    
    return NextResponse.json(deal)
    
  } catch (error) {
    console.error('Deal update API error:', error)
    return NextResponse.json(
      { error: 'Failed to update deal' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    const { type, description } = body
    
    const activity = await prisma.activity.create({
      data: {
        dealId: params.id,
        userId,
        type,
        description
      }
    })
    
    return NextResponse.json(activity)
    
  } catch (error) {
    console.error('Deal activity API error:', error)
    return NextResponse.json(
      { error: 'Failed to add activity' },
      { status: 500 }
    )
  }
}