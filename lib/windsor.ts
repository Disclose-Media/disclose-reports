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
  username: string
}

export type WindsorInstagramResult = {
  summary: WindsorInstagramSummary
  daily: Array<{ date: string; views: number; reach: number; interactions: number }>
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

  const url = new URL(`${BASE}/instagram`)
  url.searchParams.set('api_key', KEY)
  url.searchParams.set(
    'fields',
    'date,account_id,account_name,views,reach_1d,total_interactions,likes,comments,saves,shares,follower_count_1d,accounts_engaged'
  )
  url.searchParams.set('date_from', dateFrom)
  url.searchParams.set('date_to', dateTo)
  url.searchParams.set('_account_id', igAccountId)

  const empty: WindsorInstagramResult = {
    summary: { views: 0, reach: 0, interactions: 0, likes: 0, comments: 0, saves: 0, shares: 0, newFollows: 0, totalFollowers: 0, accountsEngaged: 0, username: '' },
    daily: [],
  }

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 300 } })
    if (!res.ok) return empty
    const json = await res.json()
    const rows: Record<string, unknown>[] = json.data ?? json.result ?? (Array.isArray(json) ? json : [])

    type DayAccum = { views: number; reach: number; interactions: number; likes: number; comments: number; saves: number; shares: number; newFollows: number; accountsEngaged: number }
    const byDate = new Map<string, DayAccum>()
    let totalFollowers = 0
    let username = ''

    for (const row of rows) {
      const date = String(row.date ?? '')
      if (!date) continue
      if (row.account_id != null && String(row.account_id) !== igAccountId) continue
      if (!username && row.account_name) username = String(row.account_name)
      if (!byDate.has(date)) {
        byDate.set(date, { views: 0, reach: 0, interactions: 0, likes: 0, comments: 0, saves: 0, shares: 0, newFollows: 0, accountsEngaged: 0 })
      }
      const e = byDate.get(date)!
      e.views          += Number(row.views) || 0
      e.reach          += Number(row.reach_1d) || 0
      e.interactions   += Number(row.total_interactions) || 0
      e.likes          += Number(row.likes) || 0
      e.comments       += Number(row.comments) || 0
      e.saves          += Number(row.saves) || 0
      e.shares         += Number(row.shares) || 0
      e.newFollows     += Number(row.follower_count_1d) || 0
      e.accountsEngaged += Number(row.accounts_engaged) || 0
    }

    const daily = Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, views: v.views, reach: v.reach, interactions: v.interactions }))

    let views = 0, reach = 0, interactions = 0, likes = 0, comments = 0, saves = 0, shares = 0, newFollows = 0, accountsEngaged = 0
    for (const v of Array.from(byDate.values())) {
      views           += v.views
      reach           += v.reach
      interactions    += v.interactions
      likes           += v.likes
      comments        += v.comments
      saves           += v.saves
      shares          += v.shares
      newFollows      += v.newFollows
      accountsEngaged += v.accountsEngaged
    }

    return {
      summary: { views, reach, interactions, likes, comments, saves, shares, newFollows, totalFollowers, accountsEngaged, username },
      daily,
    }
  } catch {
    return empty
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
