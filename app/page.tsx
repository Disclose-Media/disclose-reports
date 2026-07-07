import Link from 'next/link'
import { CLIENTS } from '@/lib/clients'
import { getAccountSummary } from '@/lib/meta'

async function ClientCard({ client }: { client: (typeof CLIENTS)[0] }) {
  let summary = null
  try {
    summary = await getAccountSummary(client.accountId)
  } catch {}

  return (
    <Link
      href={`/client/${client.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-[#B8860B] hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-medium text-gray-900 group-hover:text-[#B8860B] transition-colors">
            {client.name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {client.type === 'organic' ? 'Organic Page' : 'Meta Paid Ads'}
            {client.hasLeadGen && ' · Lead Gen'}
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          client.status === 'active'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {client.status}
        </span>
      </div>

      {summary ? (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-gray-400">Spend</p>
            <p className="text-sm font-medium text-[#B8860B]">
              ${parseFloat(summary.amount_spent || '0').toLocaleString('en-NZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Impressions</p>
            <p className="text-sm font-medium">
              {parseInt(summary.impressions || '0').toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">CTR</p>
            <p className="text-sm font-medium">{parseFloat(summary.ctr || '0').toFixed(2)}%</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div className="h-3 w-12 bg-gray-100 rounded animate-pulse mb-1" />
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      )}
    </Link>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Top nav */}
      <header className="bg-[#0D0D0D] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DMLogo />
          <div>
            <p className="text-white text-sm font-medium">Disclose Media</p>
            <p className="text-gray-500 text-xs">Client Reporting Portal</p>
          </div>
        </div>
        <span className="text-xs text-[#B8860B] border border-[#B8860B] px-3 py-1 rounded-full">
          Live · Meta Ads
        </span>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-gray-900">Client Dashboards</h1>
          <p className="text-sm text-gray-500 mt-1">
            Select a client to view their live Meta performance report
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CLIENTS.filter((c) => c.status === 'active').map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      </main>
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
