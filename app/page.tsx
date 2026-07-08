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
      className="group block bg-[#141414] border border-[rgba(201,151,58,0.15)] rounded-xl p-5 hover:border-[rgba(201,151,58,0.5)] hover:bg-[#1a1a1a] transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="font-semibold text-white text-sm group-hover:text-[#C9973A] transition-colors" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {client.name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {client.type === 'organic' ? 'Organic Page' : 'Meta Paid Ads'}
            {client.hasLeadGen && ' · Lead Gen'}
          </p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide ${
          client.status === 'active'
            ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40'
            : 'bg-gray-800 text-gray-500'
        }`}>
          {client.status}
        </span>
      </div>

      {summary ? (
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[rgba(201,151,58,0.1)]">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Spend</p>
            <p className="text-sm font-semibold text-[#C9973A]">
              ${parseFloat(summary.amount_spent || '0').toLocaleString('en-NZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Impr.</p>
            <p className="text-sm font-medium text-gray-200">
              {parseInt(summary.impressions || '0').toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">CTR</p>
            <p className="text-sm font-medium text-gray-200">{parseFloat(summary.ctr || '0').toFixed(2)}%</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[rgba(201,151,58,0.1)]">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div className="h-2.5 w-10 bg-gray-800 rounded animate-pulse mb-1.5" />
              <div className="h-4 w-14 bg-gray-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-end">
        <span className="text-[10px] text-gray-600 group-hover:text-[#C9973A] transition-colors">
          View report →
        </span>
      </div>
    </Link>
  )
}

export default function HomePage() {
  const paidClients = CLIENTS.filter((c) => c.type === 'paid' && c.status === 'active')
  const organicClients = CLIENTS.filter((c) => c.type === 'organic' && c.status === 'active')

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Page header */}
      <div className="border-b border-[rgba(201,151,58,0.1)] bg-[#0D0D0D] px-6 py-8">
        <p className="text-[10px] text-[#C9973A] uppercase tracking-[0.2em] mb-2">Performance Intelligence</p>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Client Dashboards
        </h1>
        <p className="text-sm text-gray-500 mt-1">Select a client to view their live performance report</p>
      </div>

      <main className="px-6 py-8 max-w-5xl">
        {/* Paid clients */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-0.5 h-4 bg-[#C9973A] rounded-full" />
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Paid Media</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {paidClients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </div>

        {/* Organic clients */}
        {organicClients.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-0.5 h-4 bg-[#C9973A] rounded-full" />
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Organic</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {organicClients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[rgba(201,151,58,0.1)] px-6 py-4 mt-8">
        <span className="text-[10px] text-gray-700 uppercase tracking-wider">Disclose Media · Confidential Reporting</span>
      </footer>
    </div>
  )
}
