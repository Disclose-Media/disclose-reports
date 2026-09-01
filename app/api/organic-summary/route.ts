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

  const prompt = isFb
    ? `You are a social media strategist writing a concise organic performance summary for a client report.

Client: ${clientName}
Platform: Facebook
Period: ${period}

Facebook Page metrics:
- Impressions (views): ${metrics.views?.toLocaleString()}
- Unique Reach: ${metrics.viewers?.toLocaleString()}
- Total Interactions: ${metrics.interactions?.toLocaleString()}
- Engagement Rate: ${metrics.engagementRate}%
- Link Clicks: ${metrics.linkClicks?.toLocaleString()}
- Page Visits: ${metrics.visits?.toLocaleString()}
- New Followers: ${metrics.follows?.toLocaleString()}

Write 2 sentences maximum in this style:
- Sentence 1: State reach and impressions with a brief insight on what this indicates for organic visibility.
- Sentence 2: Describe interaction quality (engagement rate, link clicks, follows) and whether it reflects audience interest.

Rules: Third person ("the page", not "your page"). Use exact numbers. No bullet points. No headers. Conversational but professional.`
    : `You are a social media strategist writing a concise organic performance summary for a client report.

Client: ${clientName}
Platform: Instagram
Period: ${period}

Instagram metrics:
- Views: ${metrics.views?.toLocaleString()}
- Unique Reach: ${metrics.reach?.toLocaleString()}
- Total Interactions: ${metrics.interactions?.toLocaleString()}
- Likes: ${metrics.likes?.toLocaleString()}
- Comments: ${metrics.comments?.toLocaleString()}
- Saves: ${metrics.saves?.toLocaleString()}
- Shares: ${metrics.shares?.toLocaleString()}
- Engagement Rate: ${metrics.engagementRate}%
- Profile Visits: ${metrics.profileViews > 0 ? metrics.profileViews?.toLocaleString() : 'not available'}
- Link Clicks: ${metrics.linkClicks > 0 ? metrics.linkClicks?.toLocaleString() : 'not available'}
- New Followers: ${metrics.newFollows?.toLocaleString()}
- Username: ${metrics.username || ''}

Write 2 sentences maximum in this style:
- Sentence 1: State reach and views with interaction breakdown (likes, comments, saves, shares) — be specific with numbers.
- Sentence 2: Note profile visits/link clicks/new followers if available and what they suggest about intent or interest.

Rules: Third person ("the account", not "your account"). Include the @username if provided. Use exact numbers. No bullet points. No headers. Conversational but professional.`

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
