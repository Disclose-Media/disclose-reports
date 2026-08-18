import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const auth = request.cookies.get('dm-auth')?.value
  const isLoginPage = pathname === '/login'
  const isPublic = pathname.startsWith('/share/') || pathname.startsWith('/api/')

  if (isPublic) return NextResponse.next()

  if (!auth && !isLoginPage) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  if (auth && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|dm-logo.*\\.png).*)'],
}
