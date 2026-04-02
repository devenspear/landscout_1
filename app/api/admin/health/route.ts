import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'health.json')

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'health.json not found. Data files may not have been generated during build.' },
        { status: 500 }
      )
    }

    const health = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    return NextResponse.json(health)
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch health data' },
      { status: 500 }
    )
  }
}
