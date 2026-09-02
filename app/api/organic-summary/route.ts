import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ summary: null })

  const { platform, clientName, period, metrics } = await req.json() as {
    platform: 'facebook' | 'instagram'
    clientName: string
    period: string
    metrics: Record<string, number | string>
  }

  const isFb = platform === 'facebook'

  // Only include metrics that have real values (> 0)
  const fbLines = [
    `- Impressions: ${metrics.views?.toLocaleString()}`,
    `- Unique Reach: ${metrics.viewers?.toLocaleString()}`,
    `- Total Interactions: ${metrics.interactions?.toLocaleString()}`,
    `- Engagement Rate: ${metrics.engagementRate}%`,
    Number(metrics.linkClicks) > 0 ? `- Link Clicks: ${metrics.linkClicks?.toLocaleString()}` : null,
    Number(metrics.visits) > 0 ? `- Page Visits: ${metrics.visits?.toLocaleString()}` : null,
    Number(metrics.follows) > 0 ? `- New Followers: ${metrics.follows?.toLocaleString()}` : null,
  ].filter(Boolean).join('\n')

  const igLines = [
    `- Views: ${metrics.views?.toLocaleString()}`,
    `- Unique Reach: ${metrics.reach?.toLocaleString()}`,
    `- Total Interactions: ${metrics.interactions?.toLocaleString()}`,
    `- Likes: ${metrics.likes?.toLocaleString()}`,
    Number(metrics.comments) > 0 ? `- Comments: ${metrics.comments?.toLocaleString()}` : null,
    Number(metrics.saves) > 0 ? `- Saves: ${metrics.saves?.toLocaleString()}` : null,
    Number(metrics.shares) > 0 ? `- Shares: ${metrics.shares?.toLocaleString()}` : null,
    `- Engagement Rate: ${metrics.engagementRate}%`,
    Number(metrics.newFollows) > 0 ? `- New Followers: ${metrics.newFollows?.toLocaleString()}` : null,
    metrics.username ? `- Username: ${metrics.username}` : null,
  ].filter(Boolean).join('\n')

  const prompt = isFb
    ? `You are a social media strategist writing a positive, client-friendly organic performance summary.

Client: ${clientName}
Platform: Facebook
Period: ${period}

Available metrics:
${fbLines}

Write 1-2 sentences maximum.
- Focus only on the metrics listed above. Do not mention or reference any metric not listed.
- Frame everything positively. Highlight what is working well.
- Use exact numbers from the metrics above.
- Third person ("the page", not "your page"). No bullet points. No headers. Conversational but professional.
- No em dashes (do not use the character —). No negative language. No suggestions that content needs improvement.`
    : `You are a social media strategist writing a positive, client-friendly organic performance summary.

Client: ${clientName}
Platform: Instagram
Period: ${period}

Available metrics:
${igLines}

Write exactly 1-2 sentences.
- Focus ONLY on the metrics listed above. Do not reference or mention any metric not in the list above.
- Frame everything positively. Celebrate what the numbers show.
- Use exact numbers. Include @username if provided.
- Third person. No bullet points. No headers. No em dashes (do not use the character —).
- Never say anything is "unavailable", "limited", "not available", or suggest the content needs improvement.`

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
    const data = await res.json()
    return NextResponse.json({ summary: data?.content?.[0]?.text ?? null })
  } catch {
    return NextResponse.json({ summary: null })
  }
}
