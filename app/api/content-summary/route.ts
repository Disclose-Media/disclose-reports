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

  const prompt = `You are a social media strategist writing a concise performance summary for a client report.

Client: ${clientName}
Platform: ${platform === 'facebook' ? 'Facebook' : 'Instagram'}
Period: ${period}
Total posts analysed: ${posts.length}

Top performing posts (by views):
${topPosts.map((p, i) => `${i + 1}. "${p.caption}..." — ${p.views.toLocaleString()} views, ${p.reach.toLocaleString()} reach, ${p.likes} likes${p.comments ? `, ${p.comments} comments` : ''}${p.shares ? `, ${p.shares} shares` : ''} [${p.type}, ${p.date}]`).join('\n')}

Lowest performing posts:
${bottomPosts.map((p, i) => `${i + 1}. "${p.caption}..." — ${p.views.toLocaleString()} views, ${p.reach.toLocaleString()} reach`).join('\n')}

Write a 3-sentence summary in this exact style (match the tone and structure precisely):
1. Sentence 1: Name the top performer with a short caption quote, its reach and views numbers.
2. Sentence 2: Describe the content themes across the rest of the period in one sentence.
3. Sentence 3: Identify what format or theme performed best and give a single forward-looking recommendation for next month.

Rules:
- Write in third person about the content, not second person ("the page" not "your page")
- Use exact numbers (e.g. "39,980 accounts" not "nearly 40,000")
- Keep it to exactly 3 sentences, no bullet points, no headers
- Be specific about content themes — don't be generic
- End with a clear, actionable content direction for next period`

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
        max_tokens: 300,
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
