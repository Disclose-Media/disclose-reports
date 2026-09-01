import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const accountId = request.nextUrl.searchParams.get('accountId') ?? '647548016018133'
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'META_ACCESS_TOKEN not set' })

  const [insightsRes, campaignsRes] = await Promise.all([
    fetch(`https://graph.facebook.com/v20.0/act_${accountId}/insights?fields=campaign_id,campaign_name,spend&date_preset=last_month&level=campaign&limit=50&access_token=${token}`, { cache: 'no-store' }),
    fetch(`https://graph.facebook.com/v20.0/act_${accountId}/campaigns?fields=id,name,objective&limit=100&access_token=${token}`, { cache: 'no-store' }),
  ])

  return NextResponse.json({
    insights: await insightsRes.json(),
    campaigns: await campaignsRes.json(),
  })
}
