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

function sumField(rows: Record<string, unknown>[], field: string): number {
  return rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0)
}

export async function getWindsorOrganicData(
  pageId: string,
  period: DatePreset = 'last_30d'
): Promise<WindsorOrganicSummary> {
  const { dateFrom, dateTo } = presetToDates(period)

  const url = new URL(`${BASE}/facebook_organic`)
  url.searchParams.set('api_key', KEY)
  url.searchParams.set('fields', 'page_impressions,page_impressions_unique,page_post_engagements,post_clicks,page_views_total,page_daily_follows')
  url.searchParams.set('date_from', dateFrom)
  url.searchParams.set('date_to', dateTo)
  url.searchParams.set('_account_id', pageId)

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 300 } })
    if (!res.ok) throw new Error(`Windsor error: ${res.status}`)
    const json = await res.json()
    const rows: Record<string, unknown>[] = json.data ?? json.result ?? (Array.isArray(json) ? json : [])
    return {
      views: sumField(rows, 'page_impressions'),
      viewers: sumField(rows, 'page_impressions_unique'),
      interactions: sumField(rows, 'page_post_engagements'),
      linkClicks: sumField(rows, 'post_clicks'),
      visits: sumField(rows, 'page_views_total'),
      follows: sumField(rows, 'page_daily_follows'),
    }
  } catch {
    return { views: 0, viewers: 0, interactions: 0, linkClicks: 0, visits: 0, follows: 0 }
  }
}
