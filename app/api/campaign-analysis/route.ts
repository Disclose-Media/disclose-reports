import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ analysis: null })

  const { campaign, ads, objective, clientName, period, computedMetrics } = await req.json() as {
    campaign: Record<string, string | number>
    ads: Record<string, string | number>[]
    objective: string
    clientName: string
    period: string
    computedMetrics?: {
      spend: number; impressions: number; reach: number; clicks: number
      ctr: number; cpm: number; cpc: number; leads: number; lpv: number
      cpl: number; cplpv: number; frequency: number
    }
  }

  // ALWAYS use computedMetrics — these are the exact values shown in the KPI tiles.
  // If computedMetrics is absent (legacy), fall back to raw fields.
  const spend    = computedMetrics?.spend    ?? parseFloat(String(campaign.amount_spent ?? 0))
  const impressions = computedMetrics?.impressions ?? parseInt(String(campaign.impressions ?? 0))
  const reach    = computedMetrics?.reach    ?? parseInt(String(campaign.reach ?? 0))
  const clicks   = computedMetrics?.clicks   ?? parseInt(String(campaign.clicks ?? 0))
  const ctr      = computedMetrics?.ctr      ?? parseFloat(String(campaign.ctr ?? 0))
  const cpm      = computedMetrics?.cpm      ?? parseFloat(String(campaign.cpm ?? 0))
  const cpc      = computedMetrics?.cpc      ?? parseFloat(String(campaign.cpc ?? 0))
  const leads    = computedMetrics?.leads    ?? 0
  const lpv      = computedMetrics?.lpv      ?? 0
  const cpl      = computedMetrics?.cpl      ?? 0
  const cplpv    = computedMetrics?.cplpv    ?? 0
  const frequency = computedMetrics?.frequency ?? (impressions > 0 && reach > 0 ? impressions / reach : 0)

  // Objective type
  const isLeadForm = objective === 'leads' || (leads > 0 && lpv === 0)
  const isTraffic  = objective === 'traffic' || (lpv > 0 && leads === 0)

  // Top ads
  const topAdByCtr   = [...ads].sort((a, b) => parseFloat(String(b.ctr ?? 0)) - parseFloat(String(a.ctr ?? 0)))[0]
  const topAdByLeads = [...ads].sort((a, b) => (Number(b.lead ?? 0)) - (Number(a.lead ?? 0)))[0]
  const topAdByLpv   = [...ads].sort((a, b) => {
    const av = String(a.results && typeof a.results === 'object' ? (a.results as Record<string,string>).value : '0')
    const bv = String(b.results && typeof b.results === 'object' ? (b.results as Record<string,string>).value : '0')
    return parseInt(bv || '0') - parseInt(av || '0')
  })[0]

  const resultLine = isLeadForm
    ? `Leads: ${leads} | Cost Per Lead: ${cpl > 0 ? '$' + cpl.toFixed(2) : 'N/A'}`
    : isTraffic
    ? `Landing Page Views: ${lpv} | Cost Per LPV: ${cplpv > 0 ? '$' + cplpv.toFixed(2) : 'N/A'}`
    : `Impressions: ${impressions.toLocaleString()} | Reach: ${reach.toLocaleString()}`

  const topAdLine = isLeadForm
    ? `Best lead ad: "${topAdByLeads?.ad_name || topAdByLeads?.name || 'N/A'}" with ${topAdByLeads?.lead ?? 0} leads at $${parseFloat(String(topAdByLeads?.amount_spent ?? 0)).toFixed(2)} spend`
    : `Best CTR ad: "${topAdByCtr?.ad_name || topAdByCtr?.name || 'N/A'}" with ${parseFloat(String(topAdByCtr?.ctr ?? 0)).toFixed(2)}% CTR at $${parseFloat(String(topAdByCtr?.amount_spent ?? 0)).toFixed(2)} spend`

  const prompt = `You are writing a campaign performance summary for a client report. Use ONLY the numbers below — do not invent, round, or substitute any figure.

CLIENT: ${clientName}
CAMPAIGN: ${campaign.campaign_name || campaign.name}
PERIOD: ${period}

KEY RESULTS (use these exact numbers — no others):
- Spend: $${spend.toFixed(2)}
- ${resultLine}
- CTR: ${ctr.toFixed(2)}%
- CPC: $${cpc.toFixed(2)}
- CPM: $${cpm.toFixed(2)}
- Impressions: ${impressions.toLocaleString()}
- Reach: ${reach.toLocaleString()}
- Frequency: ${frequency > 0 ? frequency.toFixed(1) + 'x' : 'N/A'}

TOP AD: ${topAdLine}

Write exactly 3 short sections. Each is 1-2 sentences. Return JSON only.

OVERVIEW: State the primary result (${isLeadForm ? `${leads} leads` : isTraffic ? `${lpv} landing page views` : `${impressions.toLocaleString()} impressions`}) and total spend. Be direct and positive.
HIGHLIGHTS: Name the top ad and one standout metric. Use exact numbers.
OPPORTUNITIES: One specific, data-backed recommendation.

RULES:
- Use ONLY the numbers listed above. NEVER use a different number.
- ${isLeadForm ? 'This is a lead generation campaign. Do not mention landing page views.' : isTraffic ? `This is a traffic/landing page campaign. LPV = ${lpv}. Do NOT say 0 landing page views. Do NOT say "undefined". The result is ${lpv} landing page views.` : 'This is an awareness campaign.'}
- No em dashes. No markdown. No bullet points. Positive tone only.

Respond with ONLY this JSON (no other text):
{"overview":"...","highlights":"...","opportunities":"..."}`

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
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    const text = data?.content?.[0]?.text ?? null
    if (!text) return NextResponse.json({ analysis: null })
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    return NextResponse.json({ analysis })
  } catch {
    return NextResponse.json({ analysis: null })
  }
}
