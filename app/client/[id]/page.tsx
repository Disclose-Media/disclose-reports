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
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-[rgba(201,151,58,0.15)] bg-[#0A0A0A] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DMLogo />
            <div>
              <p className="text-white text-sm font-semibold tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                DISCLOSE MEDIA
              </p>
              <p className="text-gray-500 text-[10px] tracking-widest uppercase">Client Reporting Portal</p>
            </div>
          </div>
          <Link href="/" className="text-[11px] text-gray-500 hover:text-[#C9973A] transition-colors">
            ← All Clients
          </Link>
        </div>
      </header>

      {/* Client hero */}
      <div className="border-b border-[rgba(201,151,58,0.1)] bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <p className="text-[10px] text-[#C9973A] uppercase tracking-[0.2em] mb-2">
            {client.type === 'organic' ? 'Organic · Facebook Page' : 'Paid Media · Meta Ads'}
            {client.hasLeadGen && ' · Lead Generation'}
          </p>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {client.name}
            </h1>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 tracking-wider uppercase border border-emerald-800/40 bg-emerald-900/20 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Live
              </span>
              <span className="text-[11px] text-gray-500">{dateLabel}</span>
            </div>
          </div>

          {/* Date preset selector */}
          <div className="flex flex-wrap gap-2 mt-5">
            {PRESETS.map((preset) => (
              <Link
                key={preset.value}
                href={`/client/${client.id}?period=${preset.value}`}
                className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
                  preset.value === period
                    ? 'bg-[#C9973A] border-[#C9973A] text-black font-semibold'
                    : 'border-[rgba(201,151,58,0.2)] text-gray-400 hover:border-[rgba(201,151,58,0.5)] hover:text-[#C9973A]'
                }`}
              >
                {preset.label}
              </Link>
            ))}
          </div>
          <p className="text-[11px] text-gray-600 mt-2">Showing: {currentPreset.label}</p>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {error ? (
          <div className="bg-[#141414] border border-red-900/40 rounded-xl p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-red-900/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-red-400 text-lg">!</span>
            </div>
            <p className="text-red-400 font-medium mb-1">Unable to load data</p>
            <p className="text-gray-600 text-sm">{error}</p>
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

      {/* Footer */}
      <footer className="border-t border-[rgba(201,151,58,0.1)] mt-12">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DMLogo size={24} />
            <span className="text-xs text-gray-600">Disclose Media</span>
          </div>
          <span className="text-[10px] text-gray-700 uppercase tracking-wider">
            {client.name} · Confidential Report
          </span>
        </div>
      </footer>
    </div>
  )
}

function DMLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="6" fill="#141414" />
      <polygon points="20,4 36,13 36,27 20,36 4,27 4,13" fill="none" stroke="#C9973A" strokeWidth="1.5" />
      <polygon points="20,10 30,15.5 30,24.5 20,30 10,24.5 10,15.5" fill="#C9973A" opacity="0.2" />
      <text x="20" y="23" textAnchor="middle" fontSize="9" fontWeight="700" fill="#C9973A" fontFamily="Montserrat, sans-serif">DM</text>
    </svg>
  )
}
