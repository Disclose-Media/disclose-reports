import { NextResponse } from 'next/server'

export async function GET(): Promise<NextResponse> {
  const KEY = process.env.WINDSOR_API_KEY
  if (!KEY) return NextResponse.json({ error: 'WINDSOR_API_KEY not set' })

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const until = new Date().toISOString().slice(0, 10)

  const url = `https://connectors.windsor.ai/facebook_organic?api_key=${KEY}&date_from=${since}&date_to=${until}&fields=account_id,account_name&limit=100`
  const res = await fetch(url, { cache: 'no-store' })
  const data = await res.json()

  // Deduplicate by account_id
  const seen = new Set()
  const accounts = []
  for (const row of (data.data || [])) {
    const id = row.account_id
    if (id && !seen.has(id)) {
      seen.add(id)
      accounts.push({ account_id: id, account_name: row.account_name })
    }
  }

  return NextResponse.json({ accounts, raw_error: data.error })
}
