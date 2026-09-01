import { NextRequest, NextResponse } from 'next/server'
import type { GoogleAdsResult } from '@/lib/google-ads'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ summary: null })

  const { data, clientName, period } = await req.json() as {
    data: GoogleAdsResult
    clientName?: string
    period?: string
  }

  if (!data) return NextResponse.json({ summary: null })

  const { summary: s, campaigns } = data
  const hasConversions = s.conversions > 0
  const topCampaign = [...campaigns].sort((a, b) => b.spend - a.spend)[0]
  const topConvCampaign = hasConversions ? [...campaigns].sort((a, b) => b.conversions - a.conversions)[0] : null

  const prompt = `You are a senior Google Ads strategist writing a 2-sentence performance snapshot for a client report. Write in third person, use exact numbers, no bullet points.

Client: ${clientName ?? 'this account'}
Period: ${period ?? 'this period'}

Account totals:
- Spend: $${s.spend.toFixed(2)}
- Impressions: ${s.impressions.toLocaleString()}
- Clicks: ${s.clicks.toLocaleString()}
- CTR: ${s.ctr.toFixed(2)}%
- Avg CPC: $${s.avgCpc.toFixed(2)}
${hasConversions ? `- Conversions: ${s.conversions}
- Cost per conversion: $${s.costPerConversion.toFixed(2)}
- Conversion rate: ${s.conversionRate.toFixed(2)}%` : ''}

Top campaign by spend: ${topCampaign?.name ?? 'N/A'} ($${topCampaign?.spend.toFixed(2) ?? 0} spend, ${topCampaign?.clicks ?? 0} clicks)
${topConvCampaign ? `Top campaign by conversions: ${topConvCampaign.name} (${topConvCampaign.conversions} conversions at $${topConvCampaign.costPerConversion.toFixed(2)}/conv)` : ''}

Write exactly 2 sentences:
1. Overall account performance with key numbers (spend, clicks, ${hasConversions ? 'conversions' : 'CTR'}).
2. The standout insight — best performing campaign or most significant metric trend.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const json = await res.json()
    const summary = json?.content?.[0]?.text ?? null
    return NextResponse.json({ summary })
  } catch {
    return NextResponse.json({ summary: null })
  }
}
