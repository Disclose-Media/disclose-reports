import { NextRequest, NextResponse } from 'next/server'
import type { WindsorPost } from '@/lib/windsor'

export async function POST(req: NextRequest) {
  const { posts, platform, clientName, period } = await req.json() as {
    posts: WindsorPost[]
    platform: 'facebook' | 'instagram'
    clientName: string
    period: string
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ summary: null })
  if (!posts || posts.length === 0) return NextResponse.json({ summary: null })

  const topPosts = [...posts]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map(p => ({
      caption: p.caption.slice(0, 120),
      views: p.views,
      reach: p.reach,
      likes: p.likes,
      comments: p.comments,
      shares: p.shares,
      saves: p.saves,
      type: p.type,
      date: p.publishedAt.slice(0, 10),
    }))

  const bottomPosts = [...posts]
    .sort((a, b) => a.views - b.views)
    .slice(0, 3)
    .map(p => ({
      caption: p.caption.slice(0, 80),
      views: p.views,
      reach: p.reach,
    }))

  const prompt = `You are a social media strategist writing a detailed content performance summary for a client report.

Client: ${clientName}
Platform: ${platform === 'facebook' ? 'Facebook' : 'Instagram'}
Period: ${period}
Total posts analysed: ${posts.length}

Top performing posts (by views):
${topPosts.map((p, i) => `${i + 1}. "${p.caption}..." — ${p.views.toLocaleString()} views, ${p.reach.toLocaleString()} reach, ${p.likes} likes${p.comments ? `, ${p.comments} comments` : ''}${p.shares ? `, ${p.shares} shares` : ''}${p.saves ? `, ${p.saves} saves` : ''} [${p.type}, ${p.date}]`).join('\n')}

Lowest performing posts:
${bottomPosts.map((p, i) => `${i + 1}. "${p.caption}..." — ${p.views.toLocaleString()} views, ${p.reach.toLocaleString()} reach`).join('\n')}

Write exactly 3 separate paragraphs, separated by a blank line. Each paragraph is 1-2 sentences.

Paragraph 1 — Top performer: Quote a snippet of the caption, state exact views and reach, explain what made it stand out.
Paragraph 2 — What worked and what didn't: Compare the themes/formats of strong vs weak performers. Use exact numbers.
Paragraph 3 — Content direction: One specific, data-backed observation about what the audience responds to.

Rules:
- Plain text only — no markdown, no #, no bullets, no headers
- Third person ("the page", "the account")
- Exact numbers always (e.g. "3,881 views" not "nearly 4K")
- Blank line between each paragraph`

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
    const summary = data?.content?.[0]?.text ?? null
    return NextResponse.json({ summary })
  } catch {
    return NextResponse.json({ summary: null })
  }
}
