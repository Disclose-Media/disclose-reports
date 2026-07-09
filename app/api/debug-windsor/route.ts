import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const pageId = request.nextUrl.searchParams.get('pageId') ?? '996924450165919'
  const apiKey = process.env.WINDSOR_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'WINDSOR_API_KEY not set in Vercel env vars' })
  }

  const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const dateTo = new Date().toISOString().slice(0, 10)
  const fields = 'date,account_id,account_name,page_impressions,page_impressions_unique,page_post_engagements,post_clicks,page_views_total,page_daily_follows,page_fans_daily'
  const url = `https://connectors.windsor.ai/facebook_organic?api_key=${apiKey}&fields=${fields}&date_from=${dateFrom}&date_to=${dateTo}&_account_id=${pageId}`

  try {
    const res = await fetch(url, { cache: 'no-store' })
    const text = await res.text()
    let data: unknown = text
    try { data = JSON.parse(text) } catch (_e) { data = text }
    return NextResponse.json({ ok: true, pageId, dateFrom, dateTo, httpStatus: res.status, data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: msg })
  }
}
