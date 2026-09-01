import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const pageId = request.nextUrl.searchParams.get('pageId') ?? '437554069630323'
  const token = process.env.META_ACCESS_TOKEN

  if (!token) return NextResponse.json({ error: 'META_ACCESS_TOKEN not set' })

  const since = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
  const until = Math.floor(Date.now() / 1000)

  try {
    const url = `https://graph.facebook.com/v20.0/${pageId}/insights?metric=page_impressions,page_impressions_unique,page_post_engagements,page_website_clicks,page_fan_adds_unique,page_views_total&period=day&since=${since}&until=${until}&access_token=${token}`
    const res = await fetch(url, { cache: 'no-store' })
    const data = await res.json()
    return NextResponse.json({ ok: res.ok, pageId, httpStatus: res.status, data })
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: String(err) })
  }
}
