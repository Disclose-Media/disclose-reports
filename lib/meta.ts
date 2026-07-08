const BASE = 'https://graph.facebook.com/v20.0'
const TOKEN = process.env.META_ACCESS_TOKEN!

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last_7d'
  | 'last_14d'
  | 'last_30d'
  | 'last_month'
  | 'this_month'
  | 'last_90d'

export type CampaignInsight = {
  id: string
  name: string
  status: string
  amount_spent: string
  impressions: string
  reach: string
  clicks: string
  cpm: string
  cpc: string
  ctr: string
  results?: { value: string }
  cost_per_result?: { value: string }
  lead?: string
  cost_per_action_type_lead?: string
  date_start: string
  date_stop: string
}

export type AdInsight = CampaignInsight & {
  campaign_id: string
  adset_id: string
  thumbnail_url?: string
}

async function graphFetch(path: string, params: Record<string, string>) {
  const url = new URL(`${BASE}/${path}`)
  url.searchParams.set('access_token', TOKEN)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  const res = await fetch(url.toString(), { next: { revalidate: 300 } })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Meta API error: ${err}`)
  }
  return res.json()
}

const INSIGHT_FIELDS = [
  'campaign_id',
  'campaign_name',
  'adset_id',
  'adset_name',
  'ad_id',
  'ad_name',
  'spend',
  'impressions',
  'reach',
  'clicks',
  'cpm',
  'cpc',
  'ctr',
  'actions',
  'cost_per_action_type',
  'date_start',
  'date_stop',
].join(',')

function extractActions(actions: { action_type: string; value: string }[] | undefined, type: string): string {
  return actions?.find((a) => a.action_type === type)?.value || '0'
}

function extractCostPerAction(cpa: { action_type: string; value: string }[] | undefined, type: string): string {
  return cpa?.find((a) => a.action_type === type)?.value || '0'
}

export async function getCampaigns(
  accountId: string,
  datePreset: DatePreset = 'last_30d'
): Promise<CampaignInsight[]> {
  const data = await graphFetch(`act_${accountId}/insights`, {
    fields: INSIGHT_FIELDS,
    date_preset: datePreset,
    level: 'campaign',
    limit: '50',
  })

  return (data.data || [])
    .filter((r: Record<string, unknown>) => parseFloat(String(r.spend || '0')) > 0)
    .map((r: Record<string, unknown>) => {
      const actions = r.actions as { action_type: string; value: string }[] | undefined
      const cpa = r.cost_per_action_type as { action_type: string; value: string }[] | undefined
      const lpv = extractActions(actions, 'landing_page_view')
      const leads = extractActions(actions, 'lead')
      const cplpv = extractCostPerAction(cpa, 'landing_page_view')
      const cpl = extractCostPerAction(cpa, 'lead')
      return {
        id: String(r.campaign_id),
        name: String(r.campaign_name),
        status: 'ACTIVE',
        amount_spent: String(r.spend || '0'),
        impressions: String(r.impressions || '0'),
        reach: String(r.reach || '0'),
        clicks: String(r.clicks || '0'),
        cpm: String(r.cpm || '0'),
        cpc: String(r.cpc || '0'),
        ctr: String(r.ctr || '0'),
        results: lpv !== '0' ? { value: lpv } : undefined,
        cost_per_result: cplpv !== '0' ? { value: cplpv } : undefined,
        lead: leads,
        cost_per_action_type_lead: cpl,
        date_start: String(r.date_start || ''),
        date_stop: String(r.date_stop || ''),
      } as CampaignInsight
    })
}

export async function getAds(
  accountId: string,
  datePreset: DatePreset = 'last_30d'
): Promise<AdInsight[]> {
  const data = await graphFetch(`act_${accountId}/insights`, {
    fields: INSIGHT_FIELDS,
    date_preset: datePreset,
    level: 'ad',
    limit: '100',
  })

  return (data.data || []).map((r: Record<string, unknown>) => {
    const actions = r.actions as { action_type: string; value: string }[] | undefined
    const cpa = r.cost_per_action_type as { action_type: string; value: string }[] | undefined
    const lpv = extractActions(actions, 'landing_page_view')
    const leads = extractActions(actions, 'lead')
    const cplpv = extractCostPerAction(cpa, 'landing_page_view')
    const cpl = extractCostPerAction(cpa, 'lead')
    return {
      id: String(r.ad_id),
      name: String(r.ad_name),
      campaign_id: String(r.campaign_id),
      adset_id: String(r.adset_id),
      status: 'ACTIVE',
      amount_spent: String(r.spend || '0'),
      impressions: String(r.impressions || '0'),
      reach: String(r.reach || '0'),
      clicks: String(r.clicks || '0'),
      cpm: String(r.cpm || '0'),
      cpc: String(r.cpc || '0'),
      ctr: String(r.ctr || '0'),
      results: lpv !== '0' ? { value: lpv } : undefined,
      cost_per_result: cplpv !== '0' ? { value: cplpv } : undefined,
      lead: leads,
      cost_per_action_type_lead: cpl,
      date_start: String(r.date_start || ''),
      date_stop: String(r.date_stop || ''),
    } as AdInsight
  })
}

export async function getAdThumbnails(accountId: string): Promise<Record<string, string>> {
  try {
    const data = await graphFetch(`act_${accountId}/ads`, {
      fields: 'id,creative{thumbnail_url}',
      limit: '100',
    })
    const map: Record<string, string> = {}
    for (const ad of data.data || []) {
      if (ad.creative?.thumbnail_url) {
        map[String(ad.id)] = ad.creative.thumbnail_url
      }
    }
    return map
  } catch {
    return {}
  }
}

// ── Organic / Page Insights ──────────────────────────────────────────────────

export type PageInsightsSummary = {
  views: number
  viewers: number
  interactions: number
  linkClicks: number
  visits: number
  follows: number
}

export type IgInsightsSummary = {
  views: number
  reach: number
  profileVisits: number
  follows: number
  totalFollowers: number
  username: string
}

function presetToSinceUntil(preset: DatePreset): { since: number; until: number } {
  const now = new Date()
  const until = Math.floor(now.getTime() / 1000)
  const daysAgo = (d: number) => Math.floor((now.getTime() - d * 86400 * 1000) / 1000)
  switch (preset) {
    case 'today': return { since: daysAgo(1), until }
    case 'yesterday': return { since: daysAgo(2), until: daysAgo(1) }
    case 'last_7d': return { since: daysAgo(7), until }
    case 'last_14d': return { since: daysAgo(14), until }
    case 'last_30d': return { since: daysAgo(30), until }
    case 'last_90d': return { since: daysAgo(90), until }
    case 'this_month': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1)
      return { since: Math.floor(s.getTime() / 1000), until }
    }
    case 'last_month': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const e = new Date(now.getFullYear(), now.getMonth(), 0)
      return { since: Math.floor(s.getTime() / 1000), until: Math.floor(e.getTime() / 1000) }
    }
    default: return { since: daysAgo(30), until }
  }
}

function sumMetric(data: unknown[], name: string): number {
  const m = (data || []).find((m: unknown) => (m as { name: string }).name === name) as
    | { values: { value: number | string }[] }
    | undefined
  if (!m) return 0
  return (m.values || []).reduce((sum, v) => sum + (Number(v.value) || 0), 0)
}

export async function getPageInsights(
  pageId: string,
  period: DatePreset = 'last_30d'
): Promise<PageInsightsSummary> {
  const { since, until } = presetToSinceUntil(period)
  const [dailyData, reachData] = await Promise.all([
    graphFetch(`${pageId}/insights`, {
      metric: 'page_impressions,page_post_engagements,page_website_clicks,page_fan_adds_unique,page_views_total',
      period: 'day',
      since: String(since),
      until: String(until),
    }).catch(() => ({ data: [] })),
    graphFetch(`${pageId}/insights`, {
      metric: 'page_impressions_unique',
      period: 'days_28',
    }).catch(() => ({ data: [] })),
  ])
  return {
    views: sumMetric(dailyData.data, 'page_impressions'),
    viewers: (reachData.data as { values: { value: number }[] }[])?.[0]?.values?.slice(-1)[0]?.value || 0,
    interactions: sumMetric(dailyData.data, 'page_post_engagements'),
    linkClicks: sumMetric(dailyData.data, 'page_website_clicks'),
    visits: sumMetric(dailyData.data, 'page_views_total'),
    follows: sumMetric(dailyData.data, 'page_fan_adds_unique'),
  }
}

export async function getLinkedIgAccount(pageId: string): Promise<string | null> {
  try {
    const data = await graphFetch(pageId, { fields: 'instagram_business_account' })
    return (data as { instagram_business_account?: { id: string } }).instagram_business_account?.id || null
  } catch {
    return null
  }
}

export async function getIgInsights(
  igUserId: string,
  period: DatePreset = 'last_30d'
): Promise<IgInsightsSummary> {
  const { since, until } = presetToSinceUntil(period)
  const [dailyData, accountData] = await Promise.all([
    graphFetch(`${igUserId}/insights`, {
      metric: 'impressions,reach,profile_views,follower_count',
      period: 'day',
      since: String(since),
      until: String(until),
    }).catch(() => ({ data: [] })),
    graphFetch(igUserId, { fields: 'followers_count,username' }).catch(() => ({})),
  ])
  const acc = accountData as { followers_count?: number; username?: string }
  return {
    views: sumMetric(dailyData.data, 'impressions'),
    reach: sumMetric(dailyData.data, 'reach'),
    profileVisits: sumMetric(dailyData.data, 'profile_views'),
    follows: sumMetric(dailyData.data, 'follower_count'),
    totalFollowers: acc.followers_count || 0,
    username: acc.username || '',
  }
}

export async function getAccountSummary(
  accountId: string,
  datePreset: DatePreset = 'last_30d'
) {
  const data = await graphFetch(`act_${accountId}/insights`, {
    fields: [
      'spend',
      'impressions',
      'reach',
      'clicks',
      'cpm',
      'cpc',
      'ctr',
      'actions',
      'cost_per_action_type',
    ].join(','),
    date_preset: datePreset,
    level: 'account',
  })

  const r = data.data?.[0]
  if (!r) return null
  return {
    amount_spent: r.spend || '0',
    impressions: r.impressions || '0',
    reach: r.reach || '0',
    clicks: r.clicks || '0',
    cpm: r.cpm || '0',
    cpc: r.cpc || '0',
    ctr: r.ctr || '0',
  }
}

// ── Content Posts ────────────────────────────────────────────────────────────

export type PostItem = {
  id: string
  platform: 'facebook' | 'instagram'
  type: 'photo' | 'video' | 'reel' | 'story' | 'text'
  caption: string
  thumbnailUrl: string
  publishedAt: string
  reach: number
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
}

export async function getFacebookPosts(pageId: string, period: DatePreset = 'last_30d'): Promise<PostItem[]> {
  const { since, until } = presetToSinceUntil(period)
  try {
    const data = await graphFetch(`${pageId}/published_posts`, {
      fields: 'id,message,story,created_time,full_picture,attachments{media_type}',
      since: String(since),
      until: String(until),
      limit: '25',
    })
    const posts = data.data || []
    if (posts.length === 0) return []

    // Fetch insights for each post in parallel (batch of 25)
    const withInsights = await Promise.all(
      posts.map(async (post: Record<string, unknown>) => {
        try {
          const ins = await graphFetch(`${post.id}/insights`, {
            metric: 'post_impressions,post_impressions_unique,post_engaged_users,post_clicks,post_reactions_by_type_total',
            period: 'lifetime',
          })
          const metric = (name: string) =>
            ((ins.data || []) as { name: string; values: { value: number }[] }[])
              .find((m) => m.name === name)?.values?.[0]?.value || 0
          const attachType = (post.attachments as { data?: { media_type?: string }[] } | undefined)?.data?.[0]?.media_type
          const type: PostItem['type'] =
            attachType === 'video' ? 'video' : attachType === 'photo' ? 'photo' : 'text'
          return {
            id: String(post.id),
            platform: 'facebook' as const,
            type,
            caption: String(post.message || post.story || ''),
            thumbnailUrl: String(post.full_picture || ''),
            publishedAt: String(post.created_time || ''),
            reach: metric('post_impressions_unique'),
            views: metric('post_impressions'),
            likes: metric('post_reactions_by_type_total'),
            comments: 0,
            shares: 0,
            saves: 0,
          } as PostItem
        } catch {
          return null
        }
      })
    )
    return withInsights.filter(Boolean) as PostItem[]
  } catch {
    return []
  }
}

export async function getInstagramPosts(igUserId: string, period: DatePreset = 'last_30d'): Promise<PostItem[]> {
  const { since, until } = presetToSinceUntil(period)
  try {
    const data = await graphFetch(`${igUserId}/media`, {
      fields: 'id,caption,media_type,timestamp,thumbnail_url,media_url,like_count,comments_count',
      since: String(since),
      until: String(until),
      limit: '25',
    })
    const posts = data.data || []
    if (posts.length === 0) return []

    const withInsights = await Promise.all(
      posts.map(async (post: Record<string, unknown>) => {
        try {
          const mediaType = String(post.media_type || '').toLowerCase()
          const isStory = false // stories come from a different endpoint
          const metric_names = mediaType === 'video'
            ? 'impressions,reach,saved,likes,comments,shares,plays'
            : 'impressions,reach,saved,likes,comments,shares'
          const ins = await graphFetch(`${post.id}/insights`, {
            metric: metric_names,
            period: 'lifetime',
          })
          const metric = (name: string) =>
            ((ins.data || []) as { name: string; values: { value: number }[] }[])
              .find((m) => m.name === name)?.values?.[0]?.value || 0
          const type: PostItem['type'] =
            mediaType === 'video' ? (String(post.media_url || '').includes('reel') ? 'reel' : 'video') :
            isStory ? 'story' : 'photo'
          return {
            id: String(post.id),
            platform: 'instagram' as const,
            type,
            caption: String(post.caption || ''),
            thumbnailUrl: String(post.thumbnail_url || post.media_url || ''),
            publishedAt: String(post.timestamp || ''),
            reach: metric('reach'),
            views: metric('impressions'),
            likes: metric('likes') || Number(post.like_count || 0),
            comments: metric('comments') || Number(post.comments_count || 0),
            shares: metric('shares'),
            saves: metric('saved'),
          } as PostItem
        } catch {
          return null
        }
      })
    )
    return withInsights.filter(Boolean) as PostItem[]
  } catch {
    return []
  }
}
