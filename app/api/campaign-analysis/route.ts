import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ analysis: null })

  const { campaign, ads, objective, clientName, period } = await req.json() as {
    campaign: Record<string, string | number>
    ads: Record<string, string | number>[]
    objective: string
    clientName: string
    period: string
  }

  const topAdByCtr = [...ads].sort((a, b) => parseFloat(String(b.ctr || 0)) - parseFloat(String(a.ctr || 0)))[0]
  const topAdBySpend = [...ads].sort((a, b) => parseFloat(String(b.amount_spent || 0)) - parseFloat(String(a.amount_spent || 0)))[0]
  const topAdByLeads = [...ads].sort((a, b) => (parseInt(String(b.lead || 0)) || 0) - (parseInt(String(a.lead || 0)) || 0))[0]

  const prompt = `You are a senior performance marketing strategist writing a campaign analysis for a client report.

Client: ${clientName}
Campaign: ${campaign.campaign_name}
Objective: ${objective}
Period: ${period}

Campaign metrics:
- Spend: $${parseFloat(String(campaign.amount_spent || 0)).toFixed(2)}
- Impressions: ${parseInt(String(campaign.impressions || 0)).toLocaleString()}
- Reach: ${parseInt(String(campaign.reach || 0)).toLocaleString()}
- Clicks: ${parseInt(String(campaign.clicks || 0)).toLocaleString()}
- CTR: ${parseFloat(String(campaign.ctr || 0)).toFixed(2)}%
- CPM: $${parseFloat(String(campaign.cpm || 0)).toFixed(2)}
- CPC: $${parseFloat(String(campaign.cpc || 0)).toFixed(2)}
- Leads: ${campaign.lead || 0}
- Landing Page Views: ${campaign.results?.toString().match(/\d+/)?.[0] || 0}
- Cost Per Lead: $${parseFloat(String(campaign.cost_per_action_type_lead || 0)).toFixed(2)}
- Frequency: ${(parseInt(String(campaign.impressions || 0)) > 0 && parseInt(String(campaign.reach || 0)) > 0) ? (parseInt(String(campaign.impressions || 0)) / parseInt(String(campaign.reach || 0))).toFixed(1) : '—'}x

Top ads:
- By CTR: "${topAdByCtr?.ad_name || topAdByCtr?.name || 'N/A'}" — ${parseFloat(String(topAdByCtr?.ctr || 0)).toFixed(2)}% CTR, $${parseFloat(String(topAdByCtr?.amount_spent || 0)).toFixed(2)} spend
- By Leads: "${topAdByLeads?.ad_name || topAdByLeads?.name || 'N/A'}" — ${topAdByLeads?.lead || 0} leads
- Top Spend: "${topAdBySpend?.ad_name || topAdBySpend?.name || 'N/A'}" — $${parseFloat(String(topAdBySpend?.amount_spent || 0)).toFixed(2)}

Write a structured campaign analysis with exactly these 4 parts. Each part should be 1-2 sentences:

OVERVIEW: What did this campaign achieve? State the key outcome (leads, traffic, reach) with exact numbers and spend efficiency.

HIGHLIGHTS: What worked well? Name the best performing ad and metric. Be specific.

OPPORTUNITIES: What could be improved? Identify the single highest-leverage opportunity.

RECOMMENDATION: One clear, actionable next step. Specific enough to execute immediately.

Format your response as JSON:
{"overview": "...", "highlights": "...", "opportunities": "...", "recommendation": "..."}`

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
