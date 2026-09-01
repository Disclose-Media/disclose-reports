import type { CustomRange } from './windsor'
import type { DatePreset } from './meta'

type Period = DatePreset | CustomRange

const BASE = 'https://connectors.windsor.ai'
const KEY = process.env.WINDSOR_API_KEY!

export type GoogleAdsCampaign = {
  id: string
  name: string
  status: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  avgCpc: number
  conversions: number
  costPerConversion: number
  conversionRate: number
  searchImpressionShare: number
}

export type GoogleAdsResult = {
  summary: {
    spend: number
    impressions: number
    clicks: number
    ctr: number
    avgCpc: number
    conversions: number
    costPerConversion: number
    conversionRate: number
  }
  campaigns: GoogleAdsCampaign[]
  daily: { date: string; spend: number; clicks: number; impressions: number; conversions: number }[]
}

function periodToDates(period: Period): { dateFrom: string; dateTo: string } {
  if (typeof period === 'object') return { dateFrom: period.from, dateTo: period.to }
  const now = new Date()
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const ago = (days: number) => { const d = new Date(now); d.setDate(d.getDate() - days); return d }

  if (period === 'today') return { dateFrom: fmt(now), dateTo: fmt(now) }
  if (period === 'last_7d') return { dateFrom: fmt(ago(7)), dateTo: fmt(now) }
  if (period === 'last_14d') return { dateFrom: fmt(ago(14)), dateTo: fmt(now) }
  if (period === 'last_30d') return { dateFrom: fmt(ago(30)), dateTo: fmt(now) }
  if (period === 'last_90d') return { dateFrom: fmt(ago(90)), dateTo: fmt(now) }
  if (period === 'this_month') {
    const s = new Date(now.getFullYear(), now.getMonth(), 1)
    return { dateFrom: fmt(s), dateTo: fmt(now) }
  }
  if (period === 'last_month') {
    const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const e = new Date(now.getFullYear(), now.getMonth(), 0)
    return { dateFrom: fmt(s), dateTo: fmt(e) }
  }
  return { dateFrom: fmt(ago(30)), dateTo: fmt(now) }
}

export async function getGoogleAdsData(accountId: string, period: Period = 'last_30d'): Promise<GoogleAdsResult | null> {
  const { dateFrom, dateTo } = periodToDates(period)

  const campaignUrl = new URL(`${BASE}/google_ads`)
  campaignUrl.searchParams.set('api_key', KEY)
  campaignUrl.searchParams.set('fields', 'campaign_id,campaign_name,campaign_status,cost,impressions,clicks,ctr,average_cpc,conversions,cost_per_conversion,conversion_rate,search_impression_share')
  campaignUrl.searchParams.set('date_from', dateFrom)
  campaignUrl.searchParams.set('date_to', dateTo)
  campaignUrl.searchParams.set('_account_id', accountId)

  const dailyUrl = new URL(`${BASE}/google_ads`)
  dailyUrl.searchParams.set('api_key', KEY)
  dailyUrl.searchParams.set('fields', 'date,cost,impressions,clicks,conversions')
  dailyUrl.searchParams.set('date_from', dateFrom)
  dailyUrl.searchParams.set('date_to', dateTo)
  dailyUrl.searchParams.set('_account_id', accountId)

  try {
    const [campRes, dailyRes] = await Promise.all([
      fetch(campaignUrl.toString(), { next: { revalidate: 300 } }),
      fetch(dailyUrl.toString(), { next: { revalidate: 300 } }),
    ])

    if (!campRes.ok) return null

    const campJson = await campRes.json()
    const campRows: Record<string, unknown>[] = campJson.data ?? campJson.result ?? (Array.isArray(campJson) ? campJson : [])

    // Aggregate by campaign_id
    const campMap = new Map<string, GoogleAdsCampaign>()
    for (const row of campRows) {
      const id = String(row.campaign_id ?? '')
      if (!id) continue
      const existing = campMap.get(id)
      const spend = Number(row.cost) || 0
      const imps = Number(row.impressions) || 0
      const clicks = Number(row.clicks) || 0
      const convs = Number(row.conversions) || 0
      if (existing) {
        existing.spend += spend
        existing.impressions += imps
        existing.clicks += clicks
        existing.conversions += convs
      } else {
        campMap.set(id, {
          id,
          name: String(row.campaign_name ?? ''),
          status: String(row.campaign_status ?? ''),
          spend,
          impressions: imps,
          clicks,
          ctr: Number(row.ctr) || 0,
          avgCpc: Number(row.average_cpc) || 0,
          conversions: convs,
          costPerConversion: Number(row.cost_per_conversion) || 0,
          conversionRate: Number(row.conversion_rate) || 0,
          searchImpressionShare: Number(row.search_impression_share) || 0,
        })
      }
    }

    // Recalculate derived metrics for aggregated campaigns
    const campaigns: GoogleAdsCampaign[] = Array.from(campMap.values()).map(c => ({
      ...c,
      ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
      avgCpc: c.clicks > 0 ? c.spend / c.clicks : 0,
      costPerConversion: c.conversions > 0 ? c.spend / c.conversions : 0,
      conversionRate: c.clicks > 0 ? (c.conversions / c.clicks) * 100 : 0,
    }))

    // Summary totals
    const summary = campaigns.reduce(
      (acc, c) => ({
        spend: acc.spend + c.spend,
        impressions: acc.impressions + c.impressions,
        clicks: acc.clicks + c.clicks,
        conversions: acc.conversions + c.conversions,
        ctr: 0, avgCpc: 0, costPerConversion: 0, conversionRate: 0,
      }),
      { spend: 0, impressions: 0, clicks: 0, conversions: 0, ctr: 0, avgCpc: 0, costPerConversion: 0, conversionRate: 0 }
    )
    summary.ctr = summary.impressions > 0 ? (summary.clicks / summary.impressions) * 100 : 0
    summary.avgCpc = summary.clicks > 0 ? summary.spend / summary.clicks : 0
    summary.costPerConversion = summary.conversions > 0 ? summary.spend / summary.conversions : 0
    summary.conversionRate = summary.clicks > 0 ? (summary.conversions / summary.clicks) * 100 : 0

    // Daily data
    let daily: GoogleAdsResult['daily'] = []
    if (dailyRes.ok) {
      const dailyJson = await dailyRes.json()
      const dailyRows: Record<string, unknown>[] = dailyJson.data ?? dailyJson.result ?? (Array.isArray(dailyJson) ? dailyJson : [])
      const dailyMap = new Map<string, { spend: number; clicks: number; impressions: number; conversions: number }>()
      for (const row of dailyRows) {
        const date = String(row.date ?? '').slice(0, 10)
        if (!date) continue
        const ex = dailyMap.get(date) ?? { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
        ex.spend += Number(row.cost) || 0
        ex.clicks += Number(row.clicks) || 0
        ex.impressions += Number(row.impressions) || 0
        ex.conversions += Number(row.conversions) || 0
        dailyMap.set(date, ex)
      }
      daily = Array.from(dailyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v }))
    }

    return { summary, campaigns, daily }
  } catch {
    return null
  }
}
