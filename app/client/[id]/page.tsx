import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getClient } from '@/lib/clients'
import { getCampaigns, getAds, getAccountSummary } from '@/lib/meta'
import { DashboardClient } from './DashboardClient'

export default async function ClientPage({ params }: { params: { id: string } }) {
  const client = getClient(params.id)
  if (!client) notFound()

  let summary = null
  let campaigns: Awaited<ReturnType<typeof getCampaigns>> = []
  let ads: Awaited<ReturnType<typeof getAds>> = []
  let error = null

  try {
    ;[summary, campaigns, ads] = await Promise.all([
      getAccountSummary(client.accountId),
      getCampaigns(client.accountId),
      getAds(client.accountId),
    ])
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : 'Failed to load data'
  }

  const now = new Date()
  const dateLabel = now.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-[#0D0D0D] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DMLogo />
          <div>
            <p className="text-white text-sm font-medium">Disclose Media</p>
            <p className="text-gray-500 text-xs">Client Reporting Portal</p>
          </div>
        </div>
        <Link href="/" className="text-xs text-gray-400 hover:text-white transition-colors">
          ← All clients
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Client title row */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-medium text-gray-900">{client.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {client.type === 'organic' ? 'Facebook Organic Page' : 'Meta Paid Ads'}
              {client.hasLeadGen && ' · Lead Generation'}
              {' · '}Last 30 days
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Live
            </span>
            <span className="text-xs text-gray-400">{dateLabel}</span>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-medium mb-1">Unable to load data</p>
            <p className="text-red-500 text-sm">{error}</p>
            <p className="text-gray-400 text-xs mt-3">
              Check that META_ACCESS_TOKEN is set correctly in your Vercel environment variables.
            </p>
          </div>
        ) : (
          <DashboardClient
            client={client}
            summary={summary}
            campaigns={campaigns}
            ads={ads}
          />
        )}
      </main>

      <footer className="border-t border-gray-200 px-6 py-4 mt-12 flex justify-between text-xs text-gray-400">
        <span>Disclose Media · Meta Performance Report</span>
        <span>{client.name} · Live Data</span>
      </footer>
    </div>
  )
}

function DMLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <rect width="34" height="34" rx="4" fill="#1a1a1a" />
      <polygon points="17,3 31,11 31,23 17,31 3,23 3,11" fill="none" stroke="#B8860B" strokeWidth="1.5" />
      <polygon points="17,8 26,13.5 26,20.5 17,26 8,20.5 8,13.5" fill="#B8860B" opacity="0.25" />
      <text x="17" y="21" textAnchor="middle" fontSize="8" fontWeight="700" fill="#B8860B" fontFamily="sans-serif">DM</text>
    </svg>
  )
}
