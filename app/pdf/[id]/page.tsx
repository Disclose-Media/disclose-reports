import { notFound } from 'next/navigation'
import { getClient } from '@/lib/clients'
import { getCampaigns, getAds, getAccountSummary, type DatePreset } from '@/lib/meta'
import type { CustomRange } from '@/lib/windsor'
import { PdfClient } from './PdfClient'

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: 'last_7d' },
  { label: 'Last 14 Days', value: 'last_14d' },
  { label: 'Last 30 Days', value: 'last_30d' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'Last 90 Days', value: 'last_90d' },
]

export default async function PdfPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { period?: string; from?: string; to?: string }
}) {
  const client = getClient(params.id)
  if (!client || client.type === 'organic' || !client.accountId) notFound()

  const rawPeriod = searchParams.period || 'last_30d'
  const isCustom = rawPeriod === 'custom' && !!searchParams.from && !!searchParams.to
  const period: DatePreset | CustomRange = isCustom
    ? { from: searchParams.from!, to: searchParams.to! }
    : (rawPeriod as DatePreset)
  const periodLabel = isCustom
    ? `${searchParams.from} to ${searchParams.to}`
    : PRESETS.find(p => p.value === rawPeriod)?.label ?? rawPeriod

  const [summary, campaigns, ads] = await Promise.all([
    getAccountSummary(client.accountId, period),
    getCampaigns(client.accountId, period),
    getAds(client.accountId, period),
  ])

  const generatedDate = new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <PdfClient
      client={client}
      campaigns={campaigns}
      ads={ads}
      summary={summary}
      period={periodLabel}
      generatedDate={generatedDate}
    />
  )
}
