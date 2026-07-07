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
      {/* Card header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="font-semibold text-white text-sm group-hover:text-[#C9973A] transition-colors font-[Montserrat,sans-serif]">
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

      {/* Stats */}
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

      {/* Arrow indicator */}
      <div className="mt-4 flex items-center justify-end">
        <span className="text-[10px] text-gray-600 group-hover:text-[#C9973A] transition-colors">
          View report →
        </span>
      </div>
    </Link>
  )
}

export default function HomePage() {
  const activeClients = CLIENTS.filter((c) => c.status === 'active')

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-[rgba(201,151,58,0.15)] bg-[#0A0A0A]">
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
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Live Data
            </span>
          </div>
        </div>
      </header>

      {/* Hero strip */}
      <div className="border-b border-[rgba(201,151,58,0.1)] bg-[#0D0D0D]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <p className="text-[10px] text-[#C9973A] uppercase tracking-[0.2em] mb-2">Performance Intelligence</p>
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Client Dashboards
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Live Meta Ads performance — select a client to view their full report
          </p>
        </div>
      </div>

      {/* Client grid */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgba(201,151,58,0.1)] mt-12">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DMLogo size={24} />
            <span className="text-xs text-gray-600">Disclose Media</span>
          </div>
          <span className="text-[10px] text-gray-700 uppercase tracking-wider">
            Confidential · Client Reporting
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
      <polygon
        points="20,4 36,13 36,27 20,36 4,27 4,13"
        fill="none"
        stroke="#C9973A"
        strokeWidth="1.5"
      />
      <polygon
        points="20,10 30,15.5 30,24.5 20,30 10,24.5 10,15.5"
        fill="url(#goldFill)"
        opacity="0.3"
      />
      <text
        x="20"
        y="23"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fill="#C9973A"
        fontFamily="Montserrat, sans-serif"
        letterSpacing="0.5"
      >
        DM
      </text>
      <defs>
        <linearGradient id="goldFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C9973A" />
          <stop offset="100%" stopColor="#E8B86D" />
        </linearGradient>
      </defs>
    </svg>
  )
}
