import type { DatePreset } from './meta'

const BASE = 'https://connectors.windsor.ai'
const KEY = process.env.WINDSOR_API_KEY!

export type WindsorOrganicSummary = {
  views: number
  viewers: number
  interactions: number
  linkClicks: number
  visits: number
  follows: number
  totalPageLikes: number
}

export type WindsorDailyPoint = {
  date: string
  impressions: number
  reach: number
  engagements: number
}

export type WindsorOrganicResult = {
  summary: WindsorOrganicSummary
  daily: WindsorDailyPoint[]
}

function presetToDates(preset: DatePreset): { dateFrom: string; dateTo: string } {
  const now = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const today = fmt(now)
  const daysAgo = (n: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() - n)
    return fmt(d)
  }
  switch (preset) {
    case 'today': return { dateFrom: today, dateTo: today }
    case 'yesterday': return { dateFrom: daysAgo(1), dateTo: daysAgo(1) }
    case 'last_7d': return { dateFrom: daysAgo(7), dateTo: today }
    case 'last_14d': return { dateFrom: daysAgo(14), dateTo: today }
    case 'last_30d': return { dateFrom: daysAgo(30), dateTo: today }
    case 'last_90d': return { dateFrom: daysAgo(90), dateTo: today }
    case 'this_month': {
      return { dateFrom: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), dateTo: today }
    }
    case 'last_month': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const e = new Date(now.getFullYear(), now.getMonth(), 0)
      return { dateFrom: fmt(s), dateTo: fmt(e) }
    }
    default: return { dateFrom: daysAgo(30), dateTo: today }
  }
}

export async function getWindsorOrganicData(
  pageId: string,
  period: DatePreset = 'last_30d'
): Promise<WindsorOrganicResult> {
  const { dateFrom, dateTo } = presetToDates(period)

  const url = new URL(`${BASE}/facebook_organic`)
  url.searchParams.set('api_key', KEY)
  url.searchParams.set(
    'fields',
    'date,page_impressions,page_impressions_unique,page_post_engagements,post_clicks,page_views_total,page_daily_follows,page_fans_daily'
  )
  url.searchParams.set('date_from', dateFrom)
  url.searchParams.set('date_to', dateTo)
  url.searchParams.set('_account_id', pageId)

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 300 } })
    if (!res.ok) throw new Error(`Windsor error: ${res.status}`)
    const json = await res.json()
    const rows: Record<string, unknown>[] = json.data ?? json.result ?? (Array.isArray(json) ? json : [])

    // Windsor returns 2 rows per date (page metrics row + post metrics row) — merge by date
    type DayAccum = {
      impressions: number; reach: number; engagements: number
      linkClicks: number; visits: number; follows: number; pageLikes: number
    }
    const byDate = new Map<string, DayAccum>()

    for (const row of rows) {
      const date = String(row.date ?? '')
      if (!date) continue
      if (!byDate.has(date)) {
        byDate.set(date, { impressions: 0, reach: 0, engagements: 0, linkClicks: 0, visits: 0, follows: 0, pageLikes: 0 })
      }
      const e = byDate.get(date)!
      if (row.page_impressions != null)        e.impressions  += Number(row.page_impressions) || 0
      if (row.page_impressions_unique != null)  e.reach        += Number(row.page_impressions_unique) || 0
      if (row.page_post_engagements != null)    e.engagements  += Number(row.page_post_engagements) || 0
      if (row.post_clicks != null)              e.linkClicks   += Number(row.post_clicks) || 0
      if (row.page_views_total != null)         e.visits       += Number(row.page_views_total) || 0
      if (row.page_daily_follows != null)       e.follows      += Number(row.page_daily_follows) || 0
      if (row.page_fans_daily != null)          e.pageLikes     = Math.max(e.pageLikes, Number(row.page_fans_daily) || 0)
    }

    const daily: WindsorDailyPoint[] = Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, impressions: v.impressions, reach: v.reach, engagements: v.engagements }))

    let views = 0, viewers = 0, interactions = 0, linkClicks = 0, visits = 0, follows = 0, totalPageLikes = 0
    for (const [, v] of byDate) {
      views        += v.impressions
      viewers      += v.reach
      interactions += v.engagements
      linkClicks   += v.linkClicks
      visits       += v.visits
      follows      += v.follows
      if (v.pageLikes > totalPageLikes) totalPageLikes = v.pageLikes
    }

    return {
      summary: { views, viewers, interactions, linkClicks, visits, follows, totalPageLikes },
      daily,
    }
  } catch {
    return {
      summary: { views: 0, viewers: 0, interactions: 0, linkClicks: 0, visits: 0, follows: 0, totalPageLikes: 0 },
      daily: [],
    }
  }
}
