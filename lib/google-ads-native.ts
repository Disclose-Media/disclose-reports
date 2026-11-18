/**
 * Native Google Ads REST API v18 client.
 * Requires env vars: GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET,
 * GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_LOGIN_CUSTOMER_ID, GOOGLE_ADS_DEVELOPER_TOKEN
 */

import type { CustomRange } from './windsor'
import type { DatePreset } from './meta'
import type { GoogleAdsResult, GoogleAdsCampaign, GoogleAdsKeyword, GoogleAdsDevice, GoogleAdsGeo, GoogleAdsAdGroup, GoogleAdsHourly, GoogleAdsDayOfWeek } from './google-ads'

type Period = DatePreset | CustomRange

const GA_VERSION = 'v23'
const GA_BASE = `https://googleads.googleapis.com/${GA_VERSION}`

// ── Auth ─────────────────────────────────────────────────────────────────────

let _tokenCache: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  const now = Date.now()
  if (_tokenCache && _tokenCache.expiresAt > now + 60_000) return _tokenCache.token

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`OAuth token refresh failed: ${res.status}`)
  const data = await res.json() as { access_token: string; expires_in: number }
  _tokenCache = { token: data.access_token, expiresAt: now + data.expires_in * 1000 }
  return _tokenCache.token
}

// ── Core query ────────────────────────────────────────────────────────────────

async function gaqlSearch(customerId: string, query: string): Promise<Record<string, unknown>[]> {
  const accessToken = await getAccessToken()
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!

  const cleanId = customerId.replace(/-/g, '')

  const res = await fetch(`${GA_BASE}/customers/${cleanId}/googleAds:search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'login-customer-id': loginCustomerId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    console.error(`Google Ads API error ${res.status} for ${customerId}:`, err.slice(0, 300))
    return []
  }

  const data = await res.json() as { results?: Record<string, unknown>[] }
  return data.results ?? []
}

// ── Date helpers ──────────────────────────────────────────────────────────────

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

// ── Extra types ───────────────────────────────────────────────────────────────

export type GoogleAdsSearchTerm = {
  searchTerm: string
  matchType: string
  spend: number
  clicks: number
  impressions: number
  conversions: number
  ctr: number
  avgCpc: number
  conversionRate: number
  campaignName: string
}

export type GoogleAdsAd = {
  id: string
  campaignName: string
  adGroupName: string
  status: string
  headlines: string[]
  descriptions: string[]
  finalUrl: string
  spend: number
  clicks: number
  impressions: number
  conversions: number
  ctr: number
  avgCpc: number
}

export type GoogleAdsNativeResult = GoogleAdsResult & {
  searchTerms: GoogleAdsSearchTerm[]
  ads: GoogleAdsAd[]
}

// ── Main fetch ────────────────────────────────────────────────────────────────

export async function getGoogleAdsNativeData(
  accountId: string,
  period: Period = 'last_30d'
): Promise<GoogleAdsNativeResult | null> {
  const { dateFrom, dateTo } = periodToDates(period)
  const dateClause = `segments.date BETWEEN '${dateFrom}' AND '${dateTo}'`

  const [
    campRows,
    kwRows,
    searchTermRows,
    adRows,
    deviceRows,
    geoRows,
    adGroupRows,
    dailyRows,
    hourlyRows,
  ] = await Promise.all([
    // Campaigns
    gaqlSearch(accountId, `
      SELECT campaign.id, campaign.name, campaign.status,
        metrics.cost_micros, metrics.impressions, metrics.clicks,
        metrics.conversions, metrics.ctr, metrics.average_cpc,
        metrics.cost_per_conversion, metrics.conversion_rate,
        metrics.search_impression_share
      FROM campaign
      WHERE ${dateClause}
        AND campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
    `),

    // Keywords with Quality Score
    gaqlSearch(accountId, `
      SELECT campaign.name, ad_group.name,
        ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
        ad_group_criterion.quality_info.quality_score,
        ad_group_criterion.quality_info.search_predicted_ctr,
        ad_group_criterion.quality_info.ad_relevance,
        ad_group_criterion.quality_info.landing_page_experience,
        metrics.cost_micros, metrics.impressions, metrics.clicks,
        metrics.conversions, metrics.ctr, metrics.average_cpc
      FROM keyword_view
      WHERE ${dateClause}
        AND ad_group_criterion.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
      LIMIT 100
    `),

    // Search terms
    gaqlSearch(accountId, `
      SELECT campaign.name, search_term_view.search_term,
        search_term_view.status,
        metrics.cost_micros, metrics.impressions, metrics.clicks,
        metrics.conversions, metrics.ctr, metrics.average_cpc
      FROM search_term_view
      WHERE ${dateClause}
      ORDER BY metrics.cost_micros DESC
      LIMIT 100
    `).catch(() => []),

    // Responsive Search Ads
    gaqlSearch(accountId, `
      SELECT campaign.name, ad_group.name, ad_group_ad.ad.id,
        ad_group_ad.status,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        ad_group_ad.ad.final_urls,
        metrics.cost_micros, metrics.impressions, metrics.clicks,
        metrics.conversions, metrics.ctr, metrics.average_cpc
      FROM ad_group_ad
      WHERE ${dateClause}
        AND ad_group_ad.status != 'REMOVED'
        AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
      ORDER BY metrics.cost_micros DESC
      LIMIT 50
    `).catch(() => []),

    // Devices
    gaqlSearch(accountId, `
      SELECT campaign.id, segments.device,
        metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions
      FROM campaign
      WHERE ${dateClause}
        AND campaign.status != 'REMOVED'
    `),

    // Geographic (cities)
    gaqlSearch(accountId, `
      SELECT campaign.id, geographic_view.location_type,
        metrics.cost_micros, metrics.clicks, metrics.conversions,
        geographic_view.country_criterion_id
      FROM geographic_view
      WHERE ${dateClause}
      ORDER BY metrics.cost_micros DESC
      LIMIT 50
    `).catch(() => []),

    // Ad groups
    gaqlSearch(accountId, `
      SELECT campaign.id, campaign.name, ad_group.id, ad_group.name,
        metrics.cost_micros, metrics.impressions, metrics.clicks,
        metrics.conversions, metrics.ctr, metrics.average_cpc
      FROM ad_group
      WHERE ${dateClause}
        AND ad_group.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
    `),

    // Daily
    gaqlSearch(accountId, `
      SELECT campaign.id, segments.date,
        metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions
      FROM campaign
      WHERE ${dateClause}
        AND campaign.status != 'REMOVED'
    `),

    // Hourly
    gaqlSearch(accountId, `
      SELECT campaign.id, segments.hour,
        metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions
      FROM campaign
      WHERE ${dateClause}
        AND campaign.status != 'REMOVED'
    `),
  ])

  if (campRows.length === 0) return null

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const micros = (row: Record<string, unknown>, key = 'metrics.cost_micros') =>
    Number((row as Record<string, Record<string, unknown>>).metrics?.cost_micros ?? 0) / 1_000_000

  const metric = (row: Record<string, unknown>, path: string): number => {
    const parts = path.split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let v: any = row
    for (const p of parts) v = v?.[p]
    return Number(v) || 0
  }

  const str = (row: Record<string, unknown>, path: string): string => {
    const parts = path.split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let v: any = row
    for (const p of parts) v = v?.[p]
    return String(v ?? '')
  }

  // ── Campaigns ────────────────────────────────────────────────────────────────

  const campMap = new Map<string, GoogleAdsCampaign>()
  for (const row of campRows) {
    const id = str(row, 'campaign.id')
    if (!id) continue
    const spend = micros(row)
    const imps = metric(row, 'metrics.impressions')
    const clicks = metric(row, 'metrics.clicks')
    const convs = metric(row, 'metrics.conversions')
    const sis = metric(row, 'metrics.search_impression_share')
    campMap.set(id, {
      id,
      name: str(row, 'campaign.name'),
      status: str(row, 'campaign.status'),
      spend, impressions: imps, clicks, conversions: convs,
      ctr: imps > 0 ? (clicks / imps) * 100 : 0,
      avgCpc: clicks > 0 ? spend / clicks : 0,
      costPerConversion: convs > 0 ? spend / convs : 0,
      conversionRate: clicks > 0 ? (convs / clicks) * 100 : 0,
      searchImpressionShare: sis,
      keywords: [], devices: [], geo: [], adGroups: [], daily: [], hourly: [],
    })
  }

  // ── Keywords ─────────────────────────────────────────────────────────────────

  const keywords: (GoogleAdsKeyword & { qualityScore?: number })[] = []
  for (const row of kwRows) {
    const kw = str(row, 'ad_group_criterion.keyword.text').trim()
    if (!kw) continue
    const spend = micros(row)
    const clicks = metric(row, 'metrics.clicks')
    const imps = metric(row, 'metrics.impressions')
    const convs = metric(row, 'metrics.conversions')
    keywords.push({
      keyword: kw,
      spend, clicks, impressions: imps, conversions: convs,
      ctr: imps > 0 ? (clicks / imps) * 100 : 0,
      avgCpc: clicks > 0 ? spend / clicks : 0,
      conversionRate: clicks > 0 ? (convs / clicks) * 100 : 0,
      qualityScore: metric(row, 'ad_group_criterion.quality_info.quality_score') || undefined,
    })
  }

  // ── Search terms ─────────────────────────────────────────────────────────────

  const searchTerms: GoogleAdsSearchTerm[] = searchTermRows.map(row => {
    const spend = micros(row)
    const clicks = metric(row, 'metrics.clicks')
    const imps = metric(row, 'metrics.impressions')
    const convs = metric(row, 'metrics.conversions')
    return {
      searchTerm: str(row, 'search_term_view.search_term'),
      matchType: str(row, 'search_term_view.status'),
      campaignName: str(row, 'campaign.name'),
      spend, clicks, impressions: imps, conversions: convs,
      ctr: imps > 0 ? (clicks / imps) * 100 : 0,
      avgCpc: clicks > 0 ? spend / clicks : 0,
      conversionRate: clicks > 0 ? (convs / clicks) * 100 : 0,
    }
  }).filter(s => s.searchTerm)

  // ── Ads ──────────────────────────────────────────────────────────────────────

  const ads: GoogleAdsAd[] = adRows.map(row => {
    const spend = micros(row)
    const clicks = metric(row, 'metrics.clicks')
    const imps = metric(row, 'metrics.impressions')
    const convs = metric(row, 'metrics.conversions')

    // Extract RSA headlines/descriptions (array of {text, pinnedField?})
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rsaHeadlines: any[] = (row as any)?.adGroupAd?.ad?.responsiveSearchAd?.headlines ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rsaDescs: any[] = (row as any)?.adGroupAd?.ad?.responsiveSearchAd?.descriptions ?? []

    return {
      id: str(row, 'ad_group_ad.ad.id'),
      campaignName: str(row, 'campaign.name'),
      adGroupName: str(row, 'ad_group.name'),
      status: str(row, 'ad_group_ad.status'),
      headlines: rsaHeadlines.map((h: { text?: string }) => h.text ?? '').filter(Boolean),
      descriptions: rsaDescs.map((d: { text?: string }) => d.text ?? '').filter(Boolean),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      finalUrl: ((row as any)?.adGroupAd?.ad?.finalUrls?.[0]) ?? '',
      spend, clicks, impressions: imps, conversions: convs,
      ctr: imps > 0 ? (clicks / imps) * 100 : 0,
      avgCpc: clicks > 0 ? spend / clicks : 0,
    }
  }).filter(a => a.id)

  // ── Devices ──────────────────────────────────────────────────────────────────

  const devMap = new Map<string, GoogleAdsDevice>()
  for (const row of deviceRows) {
    const raw = str(row, 'segments.device')
    if (!raw) continue
    const label = raw === 'MOBILE' ? 'Mobile' : raw === 'DESKTOP' ? 'Desktop' : raw === 'TABLET' ? 'Tablet' : raw
    const ex = devMap.get(label) ?? { device: label, spend: 0, clicks: 0, impressions: 0, conversions: 0, conversionRate: 0 }
    ex.spend += micros(row); ex.clicks += metric(row, 'metrics.clicks')
    ex.impressions += metric(row, 'metrics.impressions'); ex.conversions += metric(row, 'metrics.conversions')
    devMap.set(label, ex)
  }
  const devices: GoogleAdsDevice[] = Array.from(devMap.values())
    .map(d => ({ ...d, conversionRate: d.clicks > 0 ? (d.conversions / d.clicks) * 100 : 0 }))
    .sort((a, b) => b.spend - a.spend)

  // ── Geo ──────────────────────────────────────────────────────────────────────

  const geoMap = new Map<string, GoogleAdsGeo>()
  for (const row of geoRows) {
    const city = str(row, 'geographic_view.country_criterion_id') || 'Unknown'
    const ex = geoMap.get(city) ?? { city, spend: 0, clicks: 0, conversions: 0 }
    ex.spend += micros(row); ex.clicks += metric(row, 'metrics.clicks'); ex.conversions += metric(row, 'metrics.conversions')
    geoMap.set(city, ex)
  }
  const geo: GoogleAdsGeo[] = Array.from(geoMap.values()).sort((a, b) => b.spend - a.spend).slice(0, 10)

  // ── Ad Groups ────────────────────────────────────────────────────────────────

  const agMap = new Map<string, GoogleAdsAdGroup>()
  for (const row of adGroupRows) {
    const name = str(row, 'ad_group.name').trim()
    if (!name) continue
    const ex = agMap.get(name) ?? { name, spend: 0, clicks: 0, impressions: 0, ctr: 0, avgCpc: 0, conversions: 0, conversionRate: 0 }
    ex.spend += micros(row); ex.clicks += metric(row, 'metrics.clicks')
    ex.impressions += metric(row, 'metrics.impressions'); ex.conversions += metric(row, 'metrics.conversions')
    agMap.set(name, ex)
  }
  const adGroups: GoogleAdsAdGroup[] = Array.from(agMap.values())
    .map(ag => ({ ...ag, ctr: ag.impressions > 0 ? (ag.clicks / ag.impressions) * 100 : 0, avgCpc: ag.clicks > 0 ? ag.spend / ag.clicks : 0, conversionRate: ag.clicks > 0 ? (ag.conversions / ag.clicks) * 100 : 0 }))
    .sort((a, b) => b.spend - a.spend)

  // ── Daily ────────────────────────────────────────────────────────────────────

  const dailyMap = new Map<string, { spend: number; clicks: number; impressions: number; conversions: number }>()
  for (const row of dailyRows) {
    const date = str(row, 'segments.date').slice(0, 10)
    if (!date) continue
    const ex = dailyMap.get(date) ?? { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
    ex.spend += micros(row); ex.clicks += metric(row, 'metrics.clicks')
    ex.impressions += metric(row, 'metrics.impressions'); ex.conversions += metric(row, 'metrics.conversions')
    dailyMap.set(date, ex)
  }
  const daily = Array.from(dailyMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v }))

  // ── Hourly ───────────────────────────────────────────────────────────────────

  const hourMap = new Map<number, { spend: number; clicks: number; impressions: number; conversions: number }>()
  for (const row of hourlyRows) {
    const h = metric(row, 'segments.hour')
    if (h < 0 || h > 23) continue
    const ex = hourMap.get(h) ?? { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
    ex.spend += micros(row); ex.clicks += metric(row, 'metrics.clicks')
    ex.impressions += metric(row, 'metrics.impressions'); ex.conversions += metric(row, 'metrics.conversions')
    hourMap.set(h, ex)
  }
  const hourly: GoogleAdsHourly[] = Array.from(hourMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([hour, v]) => ({ hour, ...v, ctr: v.impressions > 0 ? (v.clicks / v.impressions) * 100 : 0 }))

  // ── Day of week ──────────────────────────────────────────────────────────────

  const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dowMap = new Map<string, { spend: number; clicks: number; impressions: number; conversions: number }>()
  for (const row of daily) {
    const d = new Date(row.date + 'T12:00:00Z')
    const day = DOW[d.getUTCDay()]
    const ex = dowMap.get(day) ?? { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
    ex.spend += row.spend; ex.clicks += row.clicks; ex.impressions += row.impressions; ex.conversions += row.conversions
    dowMap.set(day, ex)
  }
  const dowOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const dayOfWeek: GoogleAdsDayOfWeek[] = dowOrder.filter(d => dowMap.has(d)).map(day => ({ day, ...dowMap.get(day)! }))

  // ── Summary ──────────────────────────────────────────────────────────────────

  const campaigns = Array.from(campMap.values()).filter(c => c.spend > 0 || c.clicks > 0).sort((a, b) => b.spend - a.spend)
  const summary = campaigns.reduce(
    (acc, c) => ({ spend: acc.spend + c.spend, impressions: acc.impressions + c.impressions, clicks: acc.clicks + c.clicks, conversions: acc.conversions + c.conversions, ctr: 0, avgCpc: 0, costPerConversion: 0, conversionRate: 0 }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, ctr: 0, avgCpc: 0, costPerConversion: 0, conversionRate: 0 }
  )
  summary.ctr = summary.impressions > 0 ? (summary.clicks / summary.impressions) * 100 : 0
  summary.avgCpc = summary.clicks > 0 ? summary.spend / summary.clicks : 0
  summary.costPerConversion = summary.conversions > 0 ? summary.spend / summary.conversions : 0
  summary.conversionRate = summary.clicks > 0 ? (summary.conversions / summary.clicks) * 100 : 0

  const activeCamps = campaigns.filter(c => c.searchImpressionShare > 0)
  const searchImpressionShare = activeCamps.length > 0 ? activeCamps.reduce((s, c) => s + c.searchImpressionShare, 0) / activeCamps.length : 0

  return {
    summary: { ...summary, searchImpressionShare },
    campaigns,
    keywords,
    devices,
    geo,
    adGroups,
    hourly,
    dayOfWeek,
    daily,
    searchTerms,
    ads,
  }
}

/** Returns true if native Google Ads API env vars are configured */
export function isGoogleAdsNativeConfigured(): boolean {
  return !!(
    process.env.GOOGLE_ADS_CLIENT_ID &&
    process.env.GOOGLE_ADS_CLIENT_SECRET &&
    process.env.GOOGLE_ADS_REFRESH_TOKEN &&
    process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID &&
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  )
}
