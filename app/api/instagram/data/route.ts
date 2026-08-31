import { NextResponse } from 'next/server'
import { fetchInstagramData, getAccessToken } from '@/lib/instagram'

export async function GET() {
  const token = await getAccessToken()
  if (!token) {
    return NextResponse.json(
      { error: 'not_connected' },
      { status: 401 },
    )
  }
  try {
    const data = await fetchInstagramData(token)
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed to load Instagram data.' },
      { status: 502 },
    )
  }
}
