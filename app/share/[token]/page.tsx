import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getClientByToken } from '@/lib/clients'
import { getCampaigns, getAds, getAccountSummary, getAdThumbnails, type DatePreset } from '@/lib/meta'
import { DashboardClient } from '@/app/(main)/client/[id]/DashboardClient'

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: 'last_7d' },
  { label: '14 Days', value: 'last_14d' },
  { label: '30 Days', value: 'last_30d' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: '90 Days', value: 'last_90d' },
]

export default async function SharePage({
  params,
  searchParams,
}: {
  params: { token: string }
  searchParams: { period?: string }
}) {
  const client = getClientByToken(params.token)
  if (!client) notFound()

  const period = (searchParams.period as DatePreset) || 'last_30d'
  const currentPreset = PRESETS.find((p) => p.value === period) || PRESETS[3]

  let summary = null
  let campaigns: Awaited<ReturnType<typeof getCampaigns>> = []
  let ads: Awaited<ReturnType<typeof getAds>> = []
  let thumbnails: Record<string, string> = {}
  let error = null

  try {
    ;[summary, campaigns, ads, thumbnails] = await Promise.all([
      getAccountSummary(client.accountId, period),
      getCampaigns(client.accountId, period),
      getAds(client.accountId, period),
      getAdThumbnails(client.accountId),
    ])
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : 'Failed to load data'
  }

  const now = new Date()
  const dateLabel = now.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#F8F6F2]">

      {/* Header — no navigation, just branding + client name */}
      <div className="bg-white border-b border-[#E8E4DC]">
        {/* Gold rule top */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, #C8972D 0%, #F0D080 50%, #C8972D 100%)' }} />

        <div className="px-8 py-5 flex items-center justify-between flex-wrap gap-4">
          {/* DM logo + branding */}
          <div className="flex items-center gap-4">
            <img src="/dm-logo-dark.png" alt="Disclose Media" className="h-7 w-auto object-contain" />
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#111111]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Disclose Media
              </p>
              <p
                className="text-[9px] uppercase tracking-[0.15em]"
                style={{ fontFamily: 'Montserrat, sans-serif', color: '#C8972D', fontWeight: 600 }}
              >
                Performance Report
              </p>
            </div>
          </div>

          {/* Live indicator + date */}
          <div className="flex items-center gap-3">
            <span
              className="flex items-center gap-2 text-[10px] text-emerald-700 border border-emerald-200 bg-emerald-50 px-3 py-1.5 rounded-full"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Live data
            </span>
            <span className="text-[11px] text-[#AAAAAA]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {dateLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Client title bar */}
      <div className="bg-white border-b border-[#E8E4DC] px-8 pt-6 pb-5">
        <p
          className="text-[10px] uppercase tracking-[0.18em] mb-1.5"
          style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: '#C8972D' }}
        >
          {client.type === 'organic' ? 'Organic · Facebook Page' : 'Paid Media · Meta Ads'}
          {client.hasLeadGen && ' · Lead Generation'}
        </p>
        <h1
          className="text-[24px] font-extrabold text-[#111111] mb-4"
          style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}
        >
          {client.name}
        </h1>

        {/* Date presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Link
              key={preset.value}
              href={`/share/${params.token}?period=${preset.value}`}
              className={`text-[11px] px-3.5 py-1.5 rounded-full border transition-all duration-150 ${
                preset.value === period
                  ? 'bg-[#C8972D] border-[#C8972D] text-white font-bold'
                  : 'border-[#E8E4DC] text-[#888888] hover:border-[#C8972D] hover:text-[#C8972D]'
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

      {/* Dashboard content */}
      <main className="px-8 py-8">
        {error ? (
          <div className="bg-white border border-red-100 rounded-[8px] p-8 text-center max-w-lg mx-auto">
            <p className="text-[#111111] font-semibold mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Unable to load data
            </p>
            <p className="text-[#888888] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>
          </div>
        ) : (
          <DashboardClient
            client={client}
            summary={summary}
            campaigns={campaigns}
            ads={ads}
            thumbnails={thumbnails}
            period={currentPreset.label}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E4DC] px-8 py-5 mt-4 flex items-center justify-between flex-wrap gap-3">
        <span className="text-[10px] text-[#AAAAAA] uppercase tracking-[0.15em]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {client.name} · Confidential Report
        </span>
        <span className="text-[10px] text-[#CCCCCC]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Powered by Disclose Media
        </span>
      </footer>
    </div>
  )
}
