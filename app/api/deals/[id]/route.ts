import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { stage, priority, notes, nextAction, nextDate } = body

    // Load deals to find existing deal
    const filePath = path.join(process.cwd(), 'data', 'deals.json')
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'deals.json not found. Data files may not have been generated during build.' },
        { status: 500 }
      )
    }

    const deals = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const existing = deals.find((d: { id: string }) => d.id === id)

    if (!existing) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // Return optimistic response with updated fields
    // (We cannot write to files on Vercel serverless, so the client
    // should handle this optimistically)
    const updated = {
      ...existing,
      ...(stage !== undefined && { stage }),
      ...(priority !== undefined && { priority }),
      ...(notes !== undefined && { notes }),
      ...(nextAction !== undefined && { nextAction }),
      ...(nextDate !== undefined && { nextDate }),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(updated)
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

    // Verify deal exists
    const filePath = path.join(process.cwd(), 'data', 'deals.json')
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'deals.json not found. Data files may not have been generated during build.' },
        { status: 500 }
      )
    }

    const deals = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const existing = deals.find((d: { id: string }) => d.id === id)

    if (!existing) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // Return optimistic response for the new activity
    const activity = {
      id: `activity_${Date.now()}`,
      dealId: id,
      type,
      content,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Activity create error:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}
