import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { stage, priority, notes, nextAction, nextDate } = body

    const existing = await prisma.deal.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (stage !== undefined) data.stage = stage
    if (priority !== undefined) data.priority = priority
    if (notes !== undefined) data.notes = notes
    if (nextAction !== undefined) data.nextAction = nextAction
    if (nextDate !== undefined) data.nextDate = nextDate ? new Date(nextDate) : null

    const deal = await prisma.deal.update({
      where: { id },
      data,
    })

    return NextResponse.json(deal)
  } catch (error) {
    console.error('Deal update error:', error)
    return NextResponse.json(
      { error: 'Failed to update deal' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { type, content } = body

    if (!type || !content) {
      return NextResponse.json(
        { error: 'type and content are required' },
        { status: 400 }
      )
    }

    const existing = await prisma.deal.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    const activity = await prisma.activity.create({
      data: {
        dealId: id,
        type,
        content,
      },
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Activity create error:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}
