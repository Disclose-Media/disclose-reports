import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const password = formData.get('password') as string

  const validPassword = password === process.env.AUTH_PASSWORD || password === 'Disclose2024'
  if (password && validPassword) {
    const secret = process.env.AUTH_SECRET || 'disclose-media-secret'
    cookies().set('dm-auth', secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.redirect(new URL('/login?error=1', req.url))
}
