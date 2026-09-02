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

AUTHORITATIVE ACCOUNT TOTALS — use ONLY these numbers, no others:
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

CRITICAL: You MUST use the exact numbers above. Do not invent, round differently, or use any other figures.
- Total spend is EXACTLY $${s.spend.toFixed(2)} — do not write a different dollar amount.
- Total clicks is EXACTLY ${s.clicks.toLocaleString()} — do not write a different click count.
${hasConversions ? `- Total conversions is EXACTLY ${s.conversions} — do not write a different conversion count.` : ''}

Write exactly 2 sentences:
1. Overall account performance with key numbers (spend, clicks, ${hasConversions ? 'conversions' : 'CTR'}).
2. The standout insight: best performing campaign or most significant metric trend.

Rules:
- Positive tone only. Focus on what is working and what the numbers achieved. Never suggest the results were poor or underperforming.
- Never mention metrics that have zero or no data — only use metrics that have real values.
- No em dashes (do not use the character —). Plain text only. Exact numbers from the data above only.`

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
    const summary: string | null = json?.content?.[0]?.text ?? null
    if (!summary) return NextResponse.json({ summary: null })

    // Reject if the AI used numbers that contradict the actual totals.
    // A hallucinated summary is worse than no summary — return null so the
    // component shows nothing rather than wrong data.
    const spendStr = s.spend.toFixed(2)
    const clicksStr = s.clicks.toLocaleString()
    // Check that the summary mentions the real spend (allow minor rounding: $2409 or $2,409)
    const spendInt = Math.round(s.spend)
    const summaryLower = summary.toLowerCase()
    const mentionsCorrectSpend = summary.includes(spendStr) || summary.includes(`$${spendInt}`) || summary.includes(`$${spendInt.toLocaleString()}`)
    const mentionsCorrectClicks = summary.includes(clicksStr) || summary.includes(String(s.clicks))
    if (!mentionsCorrectSpend || !mentionsCorrectClicks) {
      return NextResponse.json({ summary: null })
    }

    return NextResponse.json({ summary })
  } catch {
    return NextResponse.json({ summary: null })
  }
}
