import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'stats.json')

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'stats.json not found. Data files may not have been generated during build.' },
        { status: 500 }
      )
    }

    const stats = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
