import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getClient } from '@/lib/clients'
import { getCampaigns, getAds, getAccountSummary, type DatePreset } from '@/lib/meta'
import { DashboardClient } from './DashboardClient'

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: 'last_7d' },
  { label: '14 Days', value: 'last_14d' },
  { label: '30 Days', value: 'last_30d' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: '90 Days', value: 'last_90d' },
]

export default async function ClientPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { period?: string }
}) {
  const client = getClient(params.id)
  if (!client) notFound()

  const period = (searchParams.period as DatePreset) || 'last_30d'
  const currentPreset = PRESETS.find((p) => p.value === period) || PRESETS[3]

  let summary = null
  let campaigns: Awaited<ReturnType<typeof getCampaigns>> = []
  let ads: Awaited<ReturnType<typeof getAds>> = []
  let error = null

  try {
    ;[summary, campaigns, ads] = await Promise.all([
      getAccountSummary(client.accountId, period),
      getCampaigns(client.accountId, period),
      getAds(client.accountId, period),
    ])
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : 'Failed to load data'
  }

  const now = new Date()
  const dateLabel = now.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#F8F6F2]">
      {/* Client hero — dark chrome */}
      <div className="bg-[#111111] px-8 pt-8 pb-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4">
          <Link href="/" className="text-[10px] text-[#555555] hover:text-[#888888] transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
            All Clients
          </Link>
          <span className="text-[#333333]">›</span>
          <span className="text-[10px] text-[#888888]" style={{ fontFamily: 'Inter, sans-serif' }}>
            {client.name}
          </span>
        </div>

        <p
          className="text-[10px] uppercase tracking-[0.18em] mb-2"
          style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: '#C8972D' }}
        >
          {client.type === 'organic' ? 'Organic · Facebook Page' : 'Paid Media · Meta Ads'}
          {client.hasLeadGen && ' · Lead Generation'}
        </p>

        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <h1
            className="text-[26px] font-extrabold text-white leading-tight"
            style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}
          >
            {client.name}
          </h1>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-[10px] text-emerald-400 border border-emerald-900/40 bg-emerald-900/20 px-3 py-1.5 rounded-full" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Live
            </span>
            <span className="text-[11px] text-[#555555]" style={{ fontFamily: 'Inter, sans-serif' }}>{dateLabel}</span>
          </div>
        </div>

        {/* Date preset selector */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Link
              key={preset.value}
              href={`/client/${client.id}?period=${preset.value}`}
              className={`text-[11px] px-3.5 py-1.5 rounded-full border transition-all duration-150 ${
                preset.value === period
                  ? 'bg-[#C8972D] border-[#C8972D] text-[#111111] font-bold'
                  : 'border-[#2A2A2A] text-[#666666] hover:border-[#C8972D] hover:text-[#C8972D]'
              }`}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {preset.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Gold rule */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg, #C8972D 0%, rgba(200,151,45,0.15) 100%)' }} />

      {/* Main content */}
      <main className="px-8 py-8">
        {error ? (
          <div className="bg-white border border-red-100 rounded-[8px] p-8 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-3">
              <span className="text-red-500 text-sm font-bold">!</span>
            </div>
            <p className="text-[#111111] font-semibold mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Unable to load data</p>
            <p className="text-[#888888] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>
          </div>
        ) : (
          <DashboardClient
            client={client}
            summary={summary}
            campaigns={campaigns}
            ads={ads}
            period={currentPreset.label}
          />
        )}
      </main>

      <footer className="border-t border-[#E8E4DC] px-8 py-5 mt-4">
        <span className="text-[10px] text-[#AAAAAA] uppercase tracking-[0.15em]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {client.name} · Confidential Report
        </span>
      </footer>
    </div>
  )
}
