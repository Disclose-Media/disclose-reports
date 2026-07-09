import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const igAccountId = request.nextUrl.searchParams.get('igId') ?? '17841407870908848'
  const apiKey = process.env.WINDSOR_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'WINDSOR_API_KEY not set' })

  const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const dateTo = new Date().toISOString().slice(0, 10)

  const url = new URL('https://connectors.windsor.ai/instagram')
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('fields', 'date,account_id,account_name,views,reach_1d,total_interactions,likes,comments,saves,shares,follower_count_1d')
  url.searchParams.set('date_from', dateFrom)
  url.searchParams.set('date_to', dateTo)
  url.searchParams.set('_account_id', igAccountId)

  try {
    const res = await fetch(url.toString(), { cache: 'no-store' })
    const text = await res.text()
    let data: unknown = text
    try { data = JSON.parse(text) } catch (_e) { data = text }
    const rows = (data as { data?: unknown[] })?.data ?? []
    return NextResponse.json({ ok: true, httpStatus: res.status, rowCount: Array.isArray(rows) ? rows.length : 0, firstRow: Array.isArray(rows) ? rows[0] : null, data })
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) })
  }
}
