import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getClientByToken } from '@/lib/clients'
import {
  getCampaigns, getAds, getAccountSummary, getAdThumbnails,
  getLinkedIgAccount, getIgInsights,
  type DatePreset, type IgInsightsSummary,
} from '@/lib/meta'
import { getWindsorOrganicData } from '@/lib/windsor'
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
  let windsorOrganic = null
  let igInsights: IgInsightsSummary | null = null
  let error = null

  try {
    const hasPaid = client.type === 'paid' && !!client.accountId
    const hasWindsor = !!client.windsorPageId

    const igUserId = hasWindsor && client.type === 'paid'
      ? await getLinkedIgAccount(client.windsorPageId!).catch(() => null)
      : null

    const [summaryRes, campaignsRes, adsRes, thumbnailsRes, windsorRes, igRes] = await Promise.all([
      hasPaid ? getAccountSummary(client.accountId, period) : Promise.resolve(null),
      hasPaid ? getCampaigns(client.accountId, period) : Promise.resolve([]),
      hasPaid ? getAds(client.accountId, period) : Promise.resolve([]),
      hasPaid ? getAdThumbnails(client.accountId) : Promise.resolve({}),
      hasWindsor ? getWindsorOrganicData(client.windsorPageId!, period) : Promise.resolve(null),
      igUserId ? getIgInsights(igUserId, period).catch(() => null) : Promise.resolve(null),
    ])

    summary = summaryRes
    campaigns = campaignsRes as Awaited<ReturnType<typeof getCampaigns>>
    ads = adsRes as Awaited<ReturnType<typeof getAds>>
    thumbnails = thumbnailsRes as Record<string, string>
    windsorOrganic = windsorRes
    igInsights = igRes as IgInsightsSummary | null
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : 'Failed to load data'
  }

  const now = new Date()
  const dateLabel = now.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#F8F6F2]">

      <div className="bg-[#111111] px-8 pt-7 pb-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <img src="/dm-logo-white.png" alt="Disclose Media" className="h-7 w-auto object-contain" />
            <div>
              <p className="text-white text-[10px] font-bold tracking-[0.12em] uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Disclose Media
              </p>
              <p className="text-[9px] tracking-[0.18em] uppercase font-semibold" style={{ fontFamily: 'Montserrat, sans-serif', color: '#C8972D' }}>
                Reporting Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-[10px] text-emerald-400 border border-emerald-900/40 bg-emerald-900/20 px-3 py-1.5 rounded-full" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Live
            </span>
            <span className="text-[11px] text-[#666666]" style={{ fontFamily: 'Inter, sans-serif' }}>{dateLabel}</span>
          </div>
        </div>

        <p
          className="text-[10px] uppercase tracking-[0.18em] mb-2"
          style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: '#C8972D' }}
        >
          {client.type === 'organic' ? 'Organic · Facebook & Instagram' : 'Paid Media · Meta Ads'}
          {client.windsorPageId && client.type === 'paid' && ' · + Organic'}
          {client.hasLeadGen && ' · Lead Generation'}
        </p>

        <h1
          className="text-[26px] font-extrabold text-white leading-tight mb-5"
          style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}
        >
          {client.name}
        </h1>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Link
              key={preset.value}
              href={`/share/${params.token}?period=${preset.value}`}
              className={`text-[11px] px-3.5 py-1.5 rounded-full border transition-all duration-150 ${
                preset.value === period
                  ? 'bg-[#C8972D] border-[#C8972D] text-white font-bold'
                  : 'border-[#2A2A2A] text-[#888888] hover:border-[#C8972D] hover:text-[#C8972D]'
              }`}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {preset.label}
            </Link>
          ))}
        </div>
      </div>

      <div style={{ height: '2px', background: 'linear-gradient(90deg, #C8972D 0%, rgba(200,151,45,0.15) 100%)' }} />

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
            thumbnails={thumbnails}
            period={currentPreset.label}
            windsorOrganic={windsorOrganic}
            igInsights={igInsights}
          />
        )}
      </main>

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
