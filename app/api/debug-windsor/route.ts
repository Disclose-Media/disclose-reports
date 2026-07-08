import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const pageId = req.nextUrl.searchParams.get('pageId') || '996924450165919'
  const apiKey = process.env.WINDSOR_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'WINDSOR_API_KEY not set' }, { status: 500 })
  }

  const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const dateTo = new Date().toISOString().slice(0, 10)

  const fields = [
    'date', 'page_impressions', 'page_impressions_unique',
    'page_post_engagements', 'post_clicks', 'page_views_total',
    'page_daily_follows', 'page_fans_daily',
  ].join(',')

  const url = `https://connectors.windsor.ai/facebook_organic?api_key=${apiKey}&fields=${fields}&date_from=${dateFrom}&date_to=${dateTo}&_account_id=${pageId}`

  const res = await fetch(url, { cache: 'no-store' })
  const text = await res.text()

  let json: unknown
  try { json = JSON.parse(text) } catch { json = text }

  return NextResponse.json({ pageId, dateFrom, dateTo, status: res.status, data: json })
}
