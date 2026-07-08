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
