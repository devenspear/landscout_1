import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'deals.json')

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'deals.json not found. Data files may not have been generated during build.' },
        { status: 500 }
      )
    }

    const deals = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    return NextResponse.json(deals)
  } catch (error) {
    console.error('Deals fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    )
  }
}
