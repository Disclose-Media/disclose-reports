import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const auth = request.cookies.get('dm-auth')?.value
  const secret = process.env.AUTH_SECRET

  const isAuthenticated = auth && secret && auth === secret
  const isLoginPage = pathname === '/login'

  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (!isAuthenticated && !isLoginPage) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|dm-logo.*\\.png).*)'],
}
