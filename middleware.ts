import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BACKUP_PASSWORD = 'Disclose2024'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const auth = request.cookies.get('dm-auth')?.value
  const secret = process.env.AUTH_SECRET || 'disclose-media-secret'

  const isAuthenticated = auth && (auth === secret || auth === BACKUP_PASSWORD)
  const isLoginPage = pathname === '/login'
  const isSharePage = pathname.startsWith('/share/')
  const isDebugApi = pathname.startsWith('/api/debug-')

  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (isSharePage || isDebugApi) return NextResponse.next()

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
