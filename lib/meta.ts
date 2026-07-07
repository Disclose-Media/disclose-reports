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

export async function getCampaigns(
  accountId: string,
  datePreset: DatePreset = 'last_30d'
): Promise<CampaignInsight[]> {
  const fields = [
    'name',
    'status',
    'amount_spent',
    'impressions',
    'reach',
    'clicks',
    'cpm',
    'cpc',
    'ctr',
    'results',
    'cost_per_result',
    'lead',
    'cost_per_action_type:lead',
  ].join(',')

  const data = await graphFetch(`act_${accountId}/campaigns`, {
    fields,
    date_preset: datePreset,
    level: 'campaign',
    limit: '50',
  })

  return (data.data || []).filter((c: CampaignInsight) => c.amount_spent && c.amount_spent !== '0')
}

export async function getAds(
  accountId: string,
  datePreset: DatePreset = 'last_30d'
): Promise<AdInsight[]> {
  const fields = [
    'name',
    'campaign_id',
    'adset_id',
    'amount_spent',
    'impressions',
    'reach',
    'clicks',
    'cpm',
    'cpc',
    'ctr',
    'results',
    'cost_per_result',
    'lead',
    'cost_per_action_type:lead',
  ].join(',')

  const data = await graphFetch(`act_${accountId}/ads`, {
    fields,
    date_preset: datePreset,
    level: 'ad',
    limit: '100',
    filtering: JSON.stringify([{ field: 'ad.effective_status', operator: 'IN', value: ['ACTIVE', 'PAUSED'] }]),
  })

  return data.data || []
}

export async function getAccountSummary(
  accountId: string,
  datePreset: DatePreset = 'last_30d'
) {
  const fields = [
    'amount_spent',
    'impressions',
    'reach',
    'clicks',
    'cpm',
    'cpc',
    'ctr',
    'lead',
    'results',
    'cost_per_result',
  ].join(',')

  const data = await graphFetch(`act_${accountId}/insights`, {
    fields,
    date_preset: datePreset,
    level: 'account',
  })

  return data.data?.[0] || null
}
