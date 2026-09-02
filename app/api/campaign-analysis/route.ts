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

  const topAdByCtr = [...ads].sort((a, b) => parseFloat(String(b.ctr || 0)) - parseFloat(String(a.ctr || 0)))[0]
  const topAdByLeads = [...ads].sort((a, b) => (parseInt(String(b.lead || 0)) || 0) - (parseInt(String(a.lead || 0)) || 0))[0]

  // Use pre-computed values from the UI (exact match to KPI tiles) if provided
  const spend = computedMetrics?.spend ?? parseFloat(String(campaign.amount_spent || 0))
  const impressions = computedMetrics?.impressions ?? parseInt(String(campaign.impressions || 0))
  const reach = computedMetrics?.reach ?? parseInt(String(campaign.reach || 0))
  const clicks = computedMetrics?.clicks ?? parseInt(String(campaign.clicks || 0))
  const ctr = computedMetrics?.ctr ?? parseFloat(String(campaign.ctr || 0))
  const cpm = computedMetrics?.cpm ?? parseFloat(String(campaign.cpm || 0))
  const cpc = computedMetrics?.cpc ?? parseFloat(String(campaign.cpc || 0))
  const leads = computedMetrics?.leads ?? parseInt(String(campaign.lead || 0))
  const lpv = computedMetrics?.lpv ?? 0
  const cpl = computedMetrics?.cpl ?? 0
  const cplpv = computedMetrics?.cplpv ?? 0
  const frequency = computedMetrics?.frequency ?? (impressions > 0 && reach > 0 ? impressions / reach : 0)

  const isLeadForm = leads > 0 && (lpv === 0 || leads >= lpv)

  const prompt = `You are a senior performance marketing strategist writing a campaign analysis for a client report.

Client: ${clientName}
Campaign: ${campaign.campaign_name}
Objective: ${objective}
Period: ${period}
Campaign type: ${isLeadForm ? 'Meta Lead Form (prospects submit details directly within Meta, no landing page involved)' : 'Landing Page (traffic sent to external website)'}

Campaign metrics (these are the EXACT numbers shown in the report — use them verbatim):
- Spend: $${spend.toFixed(2)}
- Impressions: ${impressions.toLocaleString()}
- Reach: ${reach.toLocaleString()}
- Clicks: ${clicks.toLocaleString()}
- CTR: ${ctr.toFixed(2)}%
- CPM: $${cpm.toFixed(2)}
- CPC: $${cpc.toFixed(2)}
- Leads: ${leads}
${isLeadForm ? '- Lead form type: Native Meta lead forms (no landing page conversion rate applies)' : `- Landing Page Views: ${lpv}\n- LPV Conversion Rate: ${lpv > 0 ? ((leads / lpv) * 100).toFixed(1) : 0}%\n- Cost Per LPV: $${cplpv.toFixed(2)}`}
- Cost Per Lead: ${cpl > 0 ? `$${cpl.toFixed(2)}` : 'N/A'}
- Frequency: ${frequency > 0 ? frequency.toFixed(1) : 'N/A'}x

Top performing ads:
- Best CTR: "${topAdByCtr?.ad_name || topAdByCtr?.name || 'N/A'}" (${parseFloat(String(topAdByCtr?.ctr || 0)).toFixed(2)}% CTR, $${parseFloat(String(topAdByCtr?.amount_spent || 0)).toFixed(2)} spend)
- Most Leads: "${topAdByLeads?.ad_name || topAdByLeads?.name || 'N/A'}" (${topAdByLeads?.lead || 0} leads, $${parseFloat(String(topAdByLeads?.amount_spent || 0)).toFixed(2)} spend)

IMPORTANT: ${isLeadForm ? 'This is a Meta lead form campaign. Do NOT mention landing page views or conversion rates. Leads were captured via native Meta forms.' : 'This is a landing page campaign.'}

Write a structured campaign analysis with exactly 3 parts, 1-2 sentences each. Analyse only the data above.

OVERVIEW: State the campaign total result (total leads or traffic) with exact spend and cost-per-result from the metrics above.
HIGHLIGHTS: Name the best performing ad and one standout metric. Be specific with exact numbers.
OPPORTUNITIES: One data-backed opportunity from the numbers above.

Rules:
- Use ONLY the exact numbers from "Campaign metrics" above. Never use ad-level numbers in the OVERVIEW.
- No em dashes (do not use the character —). Use commas or full stops instead.
- Plain text only. No markdown, no bullet points.

Format your response as JSON:
{"overview": "...", "highlights": "...", "opportunities": "..."}`

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
