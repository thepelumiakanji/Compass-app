import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { IG_COOKIE, validateToken } from '@/lib/instagram'

export async function POST(req: Request) {
  const { token } = await req.json().catch(() => ({ token: '' }))
  if (!token || typeof token !== 'string' || token.length < 20) {
    return NextResponse.json(
      { error: 'Please paste a valid long-lived access token.' },
      { status: 400 },
    )
  }

  const result = await validateToken(token.trim())
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const cookieStore = await cookies()
  cookieStore.set(IG_COOKIE, token.trim(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 55, // ~55 days (long-lived token lifetime)
  })

  return NextResponse.json({ ok: true, username: result.username })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(IG_COOKIE)
  return NextResponse.json({ ok: true })
}
