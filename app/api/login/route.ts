import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const password = formData.get('password') as string

  if (password === 'Disclose2024') {
    cookies().set('dm-auth', 'logged-in', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
return NextResponse.redirect(new URL('/', req.url), 303)  }

  return NextResponse.redirect(new URL('/login?error=1', req.url))
}
