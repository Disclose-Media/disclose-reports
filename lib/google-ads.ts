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
  // Per-campaign breakdown data
  keywords: GoogleAdsKeyword[]
  devices: GoogleAdsDevice[]
  geo: GoogleAdsGeo[]
  adGroups: GoogleAdsAdGroup[]
  daily: { date: string; spend: number; clicks: number; impressions: number; conversions: number }[]
  hourly: GoogleAdsHourly[]
}

export type GoogleAdsKeyword = {
  keyword: string
  spend: number
  clicks: number
  impressions: number
  ctr: number
  avgCpc: number
  conversions: number
  conversionRate: number
}

export type GoogleAdsDevice = {
  device: string
  spend: number
  clicks: number
  impressions: number
  conversions: number
  conversionRate: number
}

export type GoogleAdsGeo = {
  city: string
  spend: number
  clicks: number
  conversions: number
}

export type GoogleAdsAdGroup = {
  name: string
  spend: number
  clicks: number
  impressions: number
  ctr: number
  avgCpc: number
  conversions: number
  conversionRate: number
}

export type GoogleAdsHourly = {
  hour: number
  spend: number
  clicks: number
  impressions: number
  conversions: number
  ctr: number
}

export type GoogleAdsDayOfWeek = {
  day: string
  spend: number
  clicks: number
  impressions: number
  conversions: number
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
    searchImpressionShare: number
  }
  campaigns: GoogleAdsCampaign[]
  keywords: GoogleAdsKeyword[]
  devices: GoogleAdsDevice[]
  geo: GoogleAdsGeo[]
  adGroups: GoogleAdsAdGroup[]
  hourly: GoogleAdsHourly[]
  dayOfWeek: GoogleAdsDayOfWeek[]
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

function buildUrl(fields: string, dateFrom: string, dateTo: string, accountId: string): string {
  const url = new URL(`${BASE}/google_ads`)
  url.searchParams.set('api_key', KEY)
  // Always include account_id so we can filter rows client-side
  // Windsor ignores _account_id for Google Ads and returns all connected accounts
  url.searchParams.set('fields', fields.includes('account_id') ? fields : `account_id,${fields}`)
  url.searchParams.set('date_from', dateFrom)
  url.searchParams.set('date_to', dateTo)
  url.searchParams.set('_account_id', accountId)
  return url.toString()
}

// Normalise account ID for comparison: strip dashes, leading zeros, whitespace
function normaliseId(id: string): string {
  return String(id).replace(/[-\s]/g, '').replace(/^0+/, '')
}

async function fetchRows(url: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) return []
  const json = await res.json()
  return json.data ?? json.result ?? (Array.isArray(json) ? json : [])
}

// Filter rows to only those belonging to this client's account
function filterByAccount(rows: Record<string, unknown>[], accountId: string): Record<string, unknown>[] {
  const norm = normaliseId(accountId)
  return rows.filter(row => {
    const rowId = String(row.account_id ?? row.customer_id ?? '')
    return rowId === '' || normaliseId(rowId) === norm
  })
}

export async function getGoogleAdsData(accountId: string, period: Period = 'last_30d'): Promise<GoogleAdsResult | null> {
  const { dateFrom, dateTo } = periodToDates(period)

  const [campRows, dailyRows, kwRows, deviceRows, geoRows, adGroupRows, hourlyRows] = await Promise.all([
    fetchRows(buildUrl('campaign_id,campaign_name,campaign_status,cost,impressions,clicks,ctr,average_cpc,conversions,cost_per_conversion,conversion_rate,search_impression_share', dateFrom, dateTo, accountId)),
    fetchRows(buildUrl('date,campaign_id,cost,impressions,clicks,conversions', dateFrom, dateTo, accountId)),
    fetchRows(buildUrl('campaign_id,keyword_text,cost,impressions,clicks,conversions', dateFrom, dateTo, accountId)).catch(() => []),
    fetchRows(buildUrl('campaign_id,device,cost,impressions,clicks,conversions', dateFrom, dateTo, accountId)).catch(() => []),
    fetchRows(buildUrl('campaign_id,city,cost,clicks,conversions', dateFrom, dateTo, accountId)).catch(() => []),
    fetchRows(buildUrl('campaign_id,ad_group_name,cost,impressions,clicks,conversions', dateFrom, dateTo, accountId)).catch(() => []),
    fetchRows(buildUrl('campaign_id,hour_of_day,cost,impressions,clicks,conversions', dateFrom, dateTo, accountId)).catch(() => []),
  ])

  // Filter every result set to only this client's account rows
  const filteredCamp = filterByAccount(campRows, accountId)
  const filteredDaily = filterByAccount(dailyRows, accountId)
  const filteredKw = filterByAccount(kwRows, accountId)
  const filteredDevice = filterByAccount(deviceRows, accountId)
  const filteredGeo = filterByAccount(geoRows, accountId)
  const filteredAdGroups = filterByAccount(adGroupRows, accountId)
  const filteredHourly = filterByAccount(hourlyRows, accountId)

  if (filteredCamp.length === 0 && filteredDaily.length === 0) return null

  // Campaigns
  const campMap = new Map<string, GoogleAdsCampaign>()
  for (const row of filteredCamp) {
    const id = String(row.campaign_id ?? '')
    if (!id) continue
    const existing = campMap.get(id)
    const spend = Number(row.cost) || 0
    const imps = Number(row.impressions) || 0
    const clicks = Number(row.clicks) || 0
    const convs = Number(row.conversions) || 0
    if (existing) {
      existing.spend += spend; existing.impressions += imps
      existing.clicks += clicks; existing.conversions += convs
    } else {
      campMap.set(id, { id, name: String(row.campaign_name ?? ''), status: String(row.campaign_status ?? ''), spend, impressions: imps, clicks, ctr: 0, avgCpc: 0, conversions: convs, costPerConversion: 0, conversionRate: 0, searchImpressionShare: Number(row.search_impression_share) || 0, keywords: [], devices: [], geo: [], adGroups: [], daily: [], hourly: [] })
    }
  }

  // Helper: group sub-rows by campaign_id and return per-campaign map
  function groupByCampaign<T>(rows: Record<string, unknown>[], build: (row: Record<string, unknown>) => T | null): Map<string, T[]> {
    const map = new Map<string, T[]>()
    for (const row of rows) {
      const cid = String(row.campaign_id ?? '')
      const item = build(row)
      if (!item) continue
      if (!map.has(cid)) map.set(cid, [])
      map.get(cid)!.push(item)
    }
    return map
  }

  // Build per-campaign keyword rollup
  function buildCampaignKeywords(rows: Record<string, unknown>[]): GoogleAdsKeyword[] {
    const m = new Map<string, GoogleAdsKeyword>()
    for (const row of rows) {
      const kw = String(row.keyword_text ?? row.keyword ?? '').trim()
      if (!kw || kw === '--') continue
      const ex = m.get(kw) ?? { keyword: kw, spend: 0, clicks: 0, impressions: 0, ctr: 0, avgCpc: 0, conversions: 0, conversionRate: 0 }
      ex.spend += Number(row.cost) || 0; ex.clicks += Number(row.clicks) || 0
      ex.impressions += Number(row.impressions) || 0; ex.conversions += Number(row.conversions) || 0
      m.set(kw, ex)
    }
    return Array.from(m.values()).map(k => ({ ...k, ctr: k.impressions > 0 ? (k.clicks / k.impressions) * 100 : 0, avgCpc: k.clicks > 0 ? k.spend / k.clicks : 0, conversionRate: k.clicks > 0 ? (k.conversions / k.clicks) * 100 : 0 })).sort((a, b) => b.spend - a.spend).slice(0, 15)
  }

  function buildCampaignDevices(rows: Record<string, unknown>[]): GoogleAdsDevice[] {
    const m = new Map<string, GoogleAdsDevice>()
    for (const row of rows) {
      const raw = String(row.device ?? '').trim()
      if (!raw) continue
      const label = raw.toLowerCase().includes('mobile') ? 'Mobile' : raw.toLowerCase().includes('computer') ? 'Desktop' : raw.toLowerCase().includes('tablet') ? 'Tablet' : raw
      const ex = m.get(label) ?? { device: label, spend: 0, clicks: 0, impressions: 0, conversions: 0, conversionRate: 0 }
      ex.spend += Number(row.cost) || 0; ex.clicks += Number(row.clicks) || 0
      ex.impressions += Number(row.impressions) || 0; ex.conversions += Number(row.conversions) || 0
      m.set(label, ex)
    }
    return Array.from(m.values()).map(d => ({ ...d, conversionRate: d.clicks > 0 ? (d.conversions / d.clicks) * 100 : 0 })).sort((a, b) => b.spend - a.spend)
  }

  function buildCampaignGeo(rows: Record<string, unknown>[]): GoogleAdsGeo[] {
    const m = new Map<string, GoogleAdsGeo>()
    for (const row of rows) {
      const city = String(row.city ?? '').trim()
      if (!city || city === '(not set)') continue
      const ex = m.get(city) ?? { city, spend: 0, clicks: 0, conversions: 0 }
      ex.spend += Number(row.cost) || 0; ex.clicks += Number(row.clicks) || 0; ex.conversions += Number(row.conversions) || 0
      m.set(city, ex)
    }
    return Array.from(m.values()).sort((a, b) => b.spend - a.spend).slice(0, 10)
  }

  function buildCampaignAdGroups(rows: Record<string, unknown>[]): GoogleAdsAdGroup[] {
    const m = new Map<string, GoogleAdsAdGroup>()
    for (const row of rows) {
      const name = String(row.ad_group_name ?? row.adgroup_name ?? '').trim()
      if (!name) continue
      const ex = m.get(name) ?? { name, spend: 0, clicks: 0, impressions: 0, ctr: 0, avgCpc: 0, conversions: 0, conversionRate: 0 }
      ex.spend += Number(row.cost) || 0; ex.clicks += Number(row.clicks) || 0
      ex.impressions += Number(row.impressions) || 0; ex.conversions += Number(row.conversions) || 0
      m.set(name, ex)
    }
    return Array.from(m.values()).map(ag => ({ ...ag, ctr: ag.impressions > 0 ? (ag.clicks / ag.impressions) * 100 : 0, avgCpc: ag.clicks > 0 ? ag.spend / ag.clicks : 0, conversionRate: ag.clicks > 0 ? (ag.conversions / ag.clicks) * 100 : 0 })).sort((a, b) => b.spend - a.spend)
  }

  function buildCampaignDaily(rows: Record<string, unknown>[]) {
    const m = new Map<string, { spend: number; clicks: number; impressions: number; conversions: number }>()
    for (const row of rows) {
      const date = String(row.date ?? '').slice(0, 10)
      if (!date) continue
      const ex = m.get(date) ?? { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
      ex.spend += Number(row.cost) || 0; ex.clicks += Number(row.clicks) || 0
      ex.impressions += Number(row.impressions) || 0; ex.conversions += Number(row.conversions) || 0
      m.set(date, ex)
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v }))
  }

  function buildCampaignHourly(rows: Record<string, unknown>[]): GoogleAdsHourly[] {
    const m = new Map<number, { spend: number; clicks: number; impressions: number; conversions: number }>()
    for (const row of rows) {
      const h = Number(row.hour_of_day ?? row.hour ?? -1)
      if (h < 0 || h > 23) continue
      const ex = m.get(h) ?? { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
      ex.spend += Number(row.cost) || 0; ex.clicks += Number(row.clicks) || 0
      ex.impressions += Number(row.impressions) || 0; ex.conversions += Number(row.conversions) || 0
      m.set(h, ex)
    }
    return Array.from(m.entries()).sort(([a], [b]) => a - b).map(([hour, v]) => ({ hour, ...v, ctr: v.impressions > 0 ? (v.clicks / v.impressions) * 100 : 0 }))
  }

  // Group all sub-data by campaign_id
  const kwByCamp = groupByCampaign(filteredKw, r => r)
  const devByCamp = groupByCampaign(filteredDevice, r => r)
  const geoByCamp = groupByCampaign(filteredGeo, r => r)
  const agByCamp = groupByCampaign(filteredAdGroups, r => r)
  const dailyByCamp = groupByCampaign(filteredDaily, r => r)
  const hourlyByCamp = groupByCampaign(filteredHourly, r => r)

  const campaigns: GoogleAdsCampaign[] = Array.from(campMap.values()).map(c => ({
    ...c,
    ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
    avgCpc: c.clicks > 0 ? c.spend / c.clicks : 0,
    costPerConversion: c.conversions > 0 ? c.spend / c.conversions : 0,
    conversionRate: c.clicks > 0 ? (c.conversions / c.clicks) * 100 : 0,
    keywords: buildCampaignKeywords(kwByCamp.get(c.id) ?? []),
    devices: buildCampaignDevices(devByCamp.get(c.id) ?? []),
    geo: buildCampaignGeo(geoByCamp.get(c.id) ?? []),
    adGroups: buildCampaignAdGroups(agByCamp.get(c.id) ?? []),
    daily: buildCampaignDaily(dailyByCamp.get(c.id) ?? []),
    hourly: buildCampaignHourly(hourlyByCamp.get(c.id) ?? []),
  })).filter(c => c.spend > 0 || c.clicks > 0).sort((a, b) => b.spend - a.spend)

  // Summary
  const summary = campaigns.reduce(
    (acc, c) => ({ spend: acc.spend + c.spend, impressions: acc.impressions + c.impressions, clicks: acc.clicks + c.clicks, conversions: acc.conversions + c.conversions, ctr: 0, avgCpc: 0, costPerConversion: 0, conversionRate: 0 }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, ctr: 0, avgCpc: 0, costPerConversion: 0, conversionRate: 0 }
  )
  summary.ctr = summary.impressions > 0 ? (summary.clicks / summary.impressions) * 100 : 0
  summary.avgCpc = summary.clicks > 0 ? summary.spend / summary.clicks : 0
  summary.costPerConversion = summary.conversions > 0 ? summary.spend / summary.conversions : 0
  summary.conversionRate = summary.clicks > 0 ? (summary.conversions / summary.clicks) * 100 : 0

  // Account-level daily (all campaigns combined)
  const allDailyMap = new Map<string, { spend: number; clicks: number; impressions: number; conversions: number }>()
  for (const row of filteredDaily) {
    const date = String(row.date ?? '').slice(0, 10)
    if (!date) continue
    const ex = allDailyMap.get(date) ?? { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
    ex.spend += Number(row.cost) || 0; ex.clicks += Number(row.clicks) || 0
    ex.impressions += Number(row.impressions) || 0; ex.conversions += Number(row.conversions) || 0
    allDailyMap.set(date, ex)
  }
  const daily = Array.from(allDailyMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v }))

  // Account-level rollups (all campaigns combined)
  const keywords = buildCampaignKeywords(filteredKw)
  const devices = buildCampaignDevices(filteredDevice)
  const geo = buildCampaignGeo(filteredGeo)
  const adGroups = buildCampaignAdGroups(filteredAdGroups)

  // Account-level hourly
  const allHourMap = new Map<number, { spend: number; clicks: number; impressions: number; conversions: number }>()
  for (const row of filteredHourly) {
    const h = Number(row.hour_of_day ?? row.hour ?? -1)
    if (h < 0 || h > 23) continue
    const ex = allHourMap.get(h) ?? { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
    ex.spend += Number(row.cost) || 0; ex.clicks += Number(row.clicks) || 0
    ex.impressions += Number(row.impressions) || 0; ex.conversions += Number(row.conversions) || 0
    allHourMap.set(h, ex)
  }
  const hourly: GoogleAdsHourly[] = Array.from(allHourMap.entries()).sort(([a], [b]) => a - b).map(([hour, v]) => ({ hour, ...v, ctr: v.impressions > 0 ? (v.clicks / v.impressions) * 100 : 0 }))

  // Day of week (account-level, derived from daily)
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

  // Summary search impression share
  const activeCamps = campaigns.filter(c => c.searchImpressionShare > 0)
  const searchImpressionShare = activeCamps.length > 0 ? activeCamps.reduce((s, c) => s + c.searchImpressionShare, 0) / activeCamps.length : 0

  return { summary: { ...summary, searchImpressionShare }, campaigns, keywords, devices, geo, adGroups, hourly, dayOfWeek, daily }
}
