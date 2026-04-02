import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const filePath = path.join(process.cwd(), 'data', 'parcels', `${id}.json`)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Parcel not found' }, { status: 404 })
    }

    const parcel = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    return NextResponse.json(parcel)
  } catch (error) {
    console.error('Parcel fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch parcel. Data files may not have been generated during build.' },
      { status: 500 }
    )
  }
}
