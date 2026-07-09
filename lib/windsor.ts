import type { DatePreset } from './meta'

const BASE = 'https://connectors.windsor.ai'
const KEY = process.env.WINDSOR_API_KEY!

export type WindsorPost = {
  id: string
  platform: 'facebook' | 'instagram'
  type: 'photo' | 'video' | 'reel' | 'story' | 'text'
  caption: string
  thumbnailUrl: string
  publishedAt: string
  permalink: string
  reach: number
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
}

export async function getWindsorFacebookPosts(pageId: string, period: DatePreset = 'last_30d'): Promise<WindsorPost[]> {
  const { dateFrom, dateTo } = presetToDates(period)
  const url = new URL(`${BASE}/facebook_organic`)
  url.searchParams.set('api_key', KEY)
  url.searchParams.set('fields', 'account_id,post_id,post_message,post_created_time,full_picture,permalink_url,media_type,post_impressions_unique,post_impressions,post_reactions_total,post_clicks,post_engagements')
  url.searchParams.set('date_from', dateFrom)
  url.searchParams.set('date_to', dateTo)
  url.searchParams.set('_account_id', pageId)
  try {
    const res = await fetch(url.toString(), { next: { revalidate: 300 } })
    if (!res.ok) return []
    const json = await res.json()
    const rows: Record<string, unknown>[] = json.data ?? json.result ?? (Array.isArray(json) ? json : [])
    const seen = new Set<string>()
    const posts: WindsorPost[] = []
    for (const row of rows) {
      if (row.account_id != null && String(row.account_id) !== pageId) continue
      const id = String(row.post_id ?? '')
      if (!id || seen.has(id)) continue
      seen.add(id)
      const mediaType = String(row.media_type ?? '').toLowerCase()
      const type = mediaType === 'video' ? 'video' : mediaType === 'photo' ? 'photo' : 'text'
      posts.push({
        id, platform: 'facebook', type,
        caption: String(row.post_message ?? ''),
        thumbnailUrl: String(row.full_picture ?? ''),
        publishedAt: String(row.post_created_time ?? ''),
        permalink: String(row.permalink_url ?? ''),
        reach: Number(row.post_impressions_unique) || 0,
        views: Number(row.post_impressions) || 0,
        likes: Number(row.post_reactions_total) || 0,
        comments: 0,
        shares: 0,
        saves: 0,
      })
    }
    return posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  } catch { return [] }
}

export async function getWindsorInstagramPosts(igAccountId: string, period: DatePreset = 'last_30d'): Promise<WindsorPost[]> {
  const { dateFrom, dateTo } = presetToDates(period)
  const url = new URL(`${BASE}/instagram`)
  url.searchParams.set('api_key', KEY)
  url.searchParams.set('fields', 'account_id,media_id,media_caption,timestamp,media_url,media_thumbnail_url,media_permalink,media_type,media_reach,media_views,media_like_count,media_comments_count,media_saved,media_shares')
  url.searchParams.set('date_from', dateFrom)
  url.searchParams.set('date_to', dateTo)
  url.searchParams.set('_account_id', igAccountId)
  try {
    const res = await fetch(url.toString(), { next: { revalidate: 300 } })
    if (!res.ok) return []
    const json = await res.json()
    const rows: Record<string, unknown>[] = json.data ?? json.result ?? (Array.isArray(json) ? json : [])
    const seen = new Set<string>()
    const posts: WindsorPost[] = []
    for (const row of rows) {
      if (row.account_id != null && String(row.account_id) !== igAccountId) continue
      const id = String(row.media_id ?? '')
      if (!id || seen.has(id)) continue
      seen.add(id)
      const mediaType = String(row.media_type ?? '').toUpperCase()
      const type = mediaType === 'REEL' ? 'reel' : mediaType === 'VIDEO' ? 'video' : 'photo'
      posts.push({
        id, platform: 'instagram', type,
        caption: String(row.media_caption ?? ''),
        thumbnailUrl: String(row.media_thumbnail_url ?? row.media_url ?? ''),
        publishedAt: String(row.timestamp ?? ''),
        permalink: String(row.media_permalink ?? ''),
        reach: Number(row.media_reach) || 0,
        views: Number(row.media_views) || 0,
        likes: Number(row.media_like_count) || 0,
        comments: Number(row.media_comments_count) || 0,
        shares: Number(row.media_shares) || 0,
        saves: Number(row.media_saved) || 0,
      })
    }
    return posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  } catch { return [] }
}

export type WindsorInstagramSummary = {
  views: number
  reach: number
  interactions: number
  likes: number
  comments: number
  saves: number
  shares: number
  newFollows: number
  totalFollowers: number
  accountsEngaged: number
  linkClicks: number
  profileViews: number
  username: string
}

export type WindsorInstagramResult = {
  summary: WindsorInstagramSummary
  daily: Array<{ date: string; views: number; reach: number; interactions: number }>
  hasThirtyDayData: boolean
}

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

export async function getWindsorInstagramData(
  igAccountId: string,
  period: DatePreset = 'last_30d'
): Promise<WindsorInstagramResult> {
  const { dateFrom, dateTo } = presetToDates(period)

  // follower_count_1d only supports last 30 days — omit for older ranges
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const includeFollowers = new Date(dateFrom) >= thirtyDaysAgo

  const url = new URL(`${BASE}/instagram`)
  url.searchParams.set('api_key', KEY)
  // profile_links_taps, profile_views, and follower_count_1d all only support last 30 days
  const thirtyDayExtras = includeFollowers ? ',profile_links_taps,profile_views,follower_count_1d' : ''
  url.searchParams.set(
    'fields',
    `date,account_id,account_name,views,reach_1d,total_interactions,likes,comments,saves,shares${thirtyDayExtras}`
  )
  url.searchParams.set('date_from', dateFrom)
  url.searchParams.set('date_to', dateTo)
  url.searchParams.set('_account_id', igAccountId)

  const empty: WindsorInstagramResult = {
    summary: { views: 0, reach: 0, interactions: 0, likes: 0, comments: 0, saves: 0, shares: 0, newFollows: 0, totalFollowers: 0, accountsEngaged: 0, linkClicks: 0, profileViews: 0, username: '' },
    daily: [],
    hasThirtyDayData: includeFollowers,
  }

  try {
    const res = await fetch(url.toString(), { cache: 'no-store' })
    if (!res.ok) return empty
    const json = await res.json()
    const rows: Record<string, unknown>[] = json.data ?? json.result ?? (Array.isArray(json) ? json : [])

    type DayAccum = { views: number; reach: number; interactions: number; likes: number; comments: number; saves: number; shares: number; newFollows: number; linkClicks: number; profileViews: number }
    const byDate = new Map<string, DayAccum>()
    let totalFollowers = 0
    let username = ''

    for (const row of rows) {
      const date = String(row.date ?? '')
      if (!date) continue
      if (row.account_id != null && String(row.account_id) !== igAccountId) continue
      if (!username && row.account_name) username = String(row.account_name)
      if (!byDate.has(date)) {
        byDate.set(date, { views: 0, reach: 0, interactions: 0, likes: 0, comments: 0, saves: 0, shares: 0, newFollows: 0, linkClicks: 0, profileViews: 0 })
      }
      const e = byDate.get(date)!
      e.views        += Number(row.views) || 0
      e.reach        += Number(row.reach_1d) || 0
      e.interactions += Number(row.total_interactions) || 0
      e.likes        += Number(row.likes) || 0
      e.comments     += Number(row.comments) || 0
      e.saves        += Number(row.saves) || 0
      e.shares       += Number(row.shares) || 0
      e.newFollows   += Number(row.follower_count_1d) || 0
      e.linkClicks   += Number(row.profile_links_taps) || 0
      e.profileViews += Number(row.profile_views) || 0
    }

    const daily = Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, views: v.views, reach: v.reach, interactions: v.interactions }))

    let views = 0, reach = 0, interactions = 0, likes = 0, comments = 0, saves = 0, shares = 0, newFollows = 0, linkClicks = 0, profileViews = 0
    for (const v of Array.from(byDate.values())) {
      views        += v.views
      reach        += v.reach
      interactions += v.interactions
      likes        += v.likes
      comments     += v.comments
      saves        += v.saves
      shares       += v.shares
      newFollows   += v.newFollows
      linkClicks   += v.linkClicks
      profileViews += v.profileViews
    }

    return {
      summary: { views, reach, interactions, likes, comments, saves, shares, newFollows, totalFollowers, accountsEngaged: 0, linkClicks, profileViews, username },
      daily,
      hasThirtyDayData: includeFollowers,
    }
  } catch {
    return empty
  }
}

// --- Audience types ---

export type AudienceGenderAge = { ageGroup: string; women: number; men: number }
export type AudienceLocation = { name: string; value: number; pct: number }

export type WindsorIgAudienceData = {
  totalFollowers: number
  womenPct: number
  menPct: number
  genderAge: AudienceGenderAge[]
  topCities: AudienceLocation[]
  topCountries: AudienceLocation[]
}

export type WindsorFbAudienceData = {
  totalFans: number
  topCities: AudienceLocation[]
  topCountries: AudienceLocation[]
}

const COUNTRY_NAMES: Record<string, string> = {
  NZ: 'New Zealand', AU: 'Australia', GB: 'United Kingdom', US: 'United States',
  CA: 'Canada', DE: 'Germany', FR: 'France', JP: 'Japan', SG: 'Singapore',
  BR: 'Brazil', IN: 'India', IT: 'Italy', ES: 'Spain', NL: 'Netherlands',
  SE: 'Sweden', TH: 'Thailand', ZA: 'South Africa', IE: 'Ireland',
  RU: 'Russia', AR: 'Argentina', MY: 'Malaysia', ID: 'Indonesia',
  PT: 'Portugal', FJ: 'Fiji', DK: 'Denmark', HK: 'Hong Kong',
  NG: 'Nigeria', TR: 'Turkey', CO: 'Colombia', CL: 'Chile',
  AT: 'Austria', WS: 'Samoa', PH: 'Philippines', VN: 'Vietnam',
  PL: 'Poland', RO: 'Romania', CZ: 'Czech Republic', GR: 'Greece',
  MX: 'Mexico', NC: 'New Caledonia', PF: 'French Polynesia',
  SA: 'Saudi Arabia', AE: 'UAE', BE: 'Belgium', LK: 'Sri Lanka',
  KH: 'Cambodia', TW: 'Taiwan', BY: 'Belarus', ME: 'Montenegro',
  UG: 'Uganda', IL: 'Israel', GH: 'Ghana', UA: 'Ukraine',
  HU: 'Hungary', FI: 'Finland', TN: 'Tunisia', CY: 'Cyprus',
  KW: 'Kuwait',
}

async function windsorLifetimeFetch(connector: string, fields: string, accountId: string): Promise<Record<string, unknown>[]> {
  const url = new URL(`${BASE}/${connector}`)
  url.searchParams.set('api_key', KEY)
  url.searchParams.set('fields', fields)
  url.searchParams.set('_account_id', accountId)
  try {
    const res = await fetch(url.toString(), { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? json.result ?? (Array.isArray(json) ? json : [])) as Record<string, unknown>[]
  } catch { return [] }
}

function toLocations(arr: { name: string; value: number }[], top = 8): AudienceLocation[] {
  const sorted = arr.filter(r => r.name && r.value > 0).sort((a, b) => b.value - a.value).slice(0, top)
  const total = sorted.reduce((s, r) => s + r.value, 0)
  return sorted.map(r => ({ name: r.name, value: r.value, pct: total > 0 ? Math.round((r.value / total) * 1000) / 10 : 0 }))
}

export async function getWindsorIgAudience(igAccountId: string): Promise<WindsorIgAudienceData> {
  const empty: WindsorIgAudienceData = { totalFollowers: 0, womenPct: 0, menPct: 0, genderAge: [], topCities: [], topCountries: [] }
  try {
    const [gaRows, cityRows, countryRows] = await Promise.all([
      windsorLifetimeFetch('instagram', 'followers_count,audience_gender_age_name,audience_gender_age_size', igAccountId),
      windsorLifetimeFetch('instagram', 'city,audience_city_size', igAccountId),
      windsorLifetimeFetch('instagram', 'audience_country_name,audience_country_size', igAccountId),
    ])

    let totalFollowers = 0
    const gaMap = new Map<string, { women: number; men: number }>()

    for (const row of gaRows) {
      if (row.followers_count != null) totalFollowers = Number(row.followers_count) || 0
      if (row.audience_gender_age_name != null) {
        const [gender, age] = String(row.audience_gender_age_name).split('.')
        if (!age) continue
        if (!gaMap.has(age)) gaMap.set(age, { women: 0, men: 0 })
        const e = gaMap.get(age)!
        const size = Number(row.audience_gender_age_size) || 0
        if (gender === 'F') e.women += size
        else if (gender === 'M') e.men += size
      }
    }

    const AGE_ORDER = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']
    const genderAge: AudienceGenderAge[] = AGE_ORDER.filter(a => gaMap.has(a)).map(a => ({ ageGroup: a, women: gaMap.get(a)!.women, men: gaMap.get(a)!.men }))

    let totalWomen = 0, totalMen = 0
    for (const { women, men } of genderAge) { totalWomen += women; totalMen += men }
    const gTotal = totalWomen + totalMen
    const womenPct = gTotal > 0 ? Math.round((totalWomen / gTotal) * 1000) / 10 : 0
    const menPct = gTotal > 0 ? Math.round((totalMen / gTotal) * 1000) / 10 : 0

    const topCities = toLocations(cityRows.map(r => ({ name: String(r.city ?? ''), value: Number(r.audience_city_size) || 0 })))
    const topCountries = toLocations(countryRows.map(r => ({ name: COUNTRY_NAMES[String(r.audience_country_name ?? '')] ?? String(r.audience_country_name ?? ''), value: Number(r.audience_country_size) || 0 })))

    return { totalFollowers, womenPct, menPct, genderAge, topCities, topCountries }
  } catch { return empty }
}

export async function getWindsorFbAudience(pageId: string): Promise<WindsorFbAudienceData> {
  const empty: WindsorFbAudienceData = { totalFans: 0, topCities: [], topCountries: [] }
  try {
    // Windsor returns all connected pages mixed — include account_id and filter client-side
    const [cityRows, countryRows] = await Promise.all([
      windsorLifetimeFetch('facebook_organic', 'account_id,page_fans,page_fans_city_name,page_fans_city_value', pageId),
      windsorLifetimeFetch('facebook_organic', 'account_id,page_fans,page_fans_country_name,page_fans_country_value', pageId),
    ])

    const myCity = cityRows.filter(r => String(r.account_id) === pageId)
    const myCountry = countryRows.filter(r => String(r.account_id) === pageId)
    const totalFans = myCity.length > 0 ? Number(myCity[0].page_fans) || 0 : 0

    const topCities = toLocations(myCity.map(r => ({ name: String(r.page_fans_city_name ?? ''), value: Number(r.page_fans_city_value) || 0 })))
    const topCountries = toLocations(myCountry.map(r => ({ name: COUNTRY_NAMES[String(r.page_fans_country_name ?? '')] ?? String(r.page_fans_country_name ?? ''), value: Number(r.page_fans_country_value) || 0 })))

    return { totalFans, topCities, topCountries }
  } catch { return empty }
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
    'date,account_id,page_impressions,page_impressions_unique,page_post_engagements,post_clicks,page_views_total,page_daily_follows,page_fans_daily'
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
      // Filter to only rows for the requested page
      if (row.account_id != null && String(row.account_id) !== pageId) continue
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
    for (const v of Array.from(byDate.values())) {
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
