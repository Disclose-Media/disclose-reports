import Link from 'next/link'
import { CLIENTS } from '@/lib/clients'
import { getAccountSummary } from '@/lib/meta'

async function ClientCard({ client }: { client: (typeof CLIENTS)[0] }) {
  let summary = null
  try {
    if (client.type === 'paid' && client.accountId) {
      summary = await getAccountSummary(client.accountId)
    }
  } catch {}

  return (
    <Link
      href={`/client/${client.id}`}
      className="group block bg-white border border-[#E8E4DC] rounded-[8px] p-5 hover:border-[#C8972D] hover:shadow-[0_4px_24px_rgba(200,151,45,0.08)] transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-3">
          <p
            className="font-bold text-[#111111] text-sm group-hover:text-[#C8972D] transition-colors truncate"
            style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.01em' }}
          >
            {client.name}
          </p>
          <p className="text-[11px] text-[#AAAAAA] mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
            {client.type === 'organic' ? 'Organic Page' : 'Meta Paid Ads'}
            {client.hasLeadGen && ' · Lead Gen'}
          </p>
        </div>
        <span className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full font-semibold tracking-wide ${
          client.status === 'active'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-[#F0EEE9] text-[#AAAAAA] border border-[#E8E4DC]'
        }`} style={{ fontFamily: 'Inter, sans-serif' }}>
          {client.status}
        </span>
      </div>

      {/* Gold rule */}
      <div className="h-px bg-[#E8E4DC] mb-4" />

      {client.type === 'organic' ? (
        <div className="flex items-center gap-2 py-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2" className="shrink-0">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span className="text-[11px] text-[#888888]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Facebook Page Insights · via Windsor
          </span>
        </div>
      ) : summary ? (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[9px] text-[#AAAAAA] uppercase tracking-[0.15em] mb-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>Spend</p>
            <p className="text-sm font-bold text-[#C8972D]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              ${parseFloat(summary.amount_spent || '0').toLocaleString('en-NZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-[#AAAAAA] uppercase tracking-[0.15em] mb-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>Impr.</p>
            <p className="text-sm font-semibold text-[#111111]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {parseInt(summary.impressions || '0').toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-[#AAAAAA] uppercase tracking-[0.15em] mb-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>CTR</p>
            <p className="text-sm font-semibold text-[#111111]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {parseFloat(summary.ctr || '0').toFixed(2)}%
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div className="h-2 w-10 bg-[#E8E4DC] rounded animate-pulse mb-2" />
              <div className="h-4 w-14 bg-[#E8E4DC] rounded animate-pulse" />
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-end">
        <span className="text-[10px] text-[#AAAAAA] group-hover:text-[#C8972D] transition-colors flex items-center gap-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          View report
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="translate-x-0 group-hover:translate-x-0.5 transition-transform">
            <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
    </Link>
  )
}

export default function HomePage() {
  const paidClients = CLIENTS.filter((c) => c.type === 'paid' && c.status === 'active')
  const organicClients = CLIENTS.filter((c) => c.type === 'organic' && c.status === 'active')

  return (
    <div className="min-h-screen bg-[#F8F6F2]">
      {/* Page hero — dark */}
      <div className="bg-[#111111] px-8 py-8">
        <p
          className="text-[10px] uppercase tracking-[0.18em] mb-2"
          style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: '#C8972D' }}
        >
          Performance Intelligence
        </p>
        <h1
          className="text-[26px] font-extrabold text-white leading-tight"
          style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}
        >
          Client Dashboards
        </h1>
        <p className="text-[13px] text-[#888888] mt-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
          Select a client to view their live performance report
        </p>
      </div>

      {/* Thin gold rule */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg, #C8972D 0%, rgba(200,151,45,0.2) 100%)' }} />

      <main className="px-8 py-10 max-w-6xl">
        {/* Paid clients */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div style={{ width: '2px', height: '16px', background: '#C8972D', borderRadius: '1px' }} />
            <h2
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#888888]"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Paid Media
            </h2>
            <span className="text-[10px] text-[#AAAAAA] bg-white border border-[#E8E4DC] px-2 py-0.5 rounded-full" style={{ fontFamily: 'Inter, sans-serif' }}>
              {paidClients.length} clients
            </span>
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
            <div className="flex items-center gap-3 mb-6">
              <div style={{ width: '2px', height: '16px', background: '#C8972D', borderRadius: '1px' }} />
              <h2
                className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#888888]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Organic
              </h2>
              <span className="text-[10px] text-[#AAAAAA] bg-white border border-[#E8E4DC] px-2 py-0.5 rounded-full" style={{ fontFamily: 'Inter, sans-serif' }}>
                {organicClients.length} clients
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {organicClients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[#E8E4DC] px-8 py-5 mt-4">
        <span className="text-[10px] text-[#AAAAAA] uppercase tracking-[0.15em]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Disclose Media · Confidential Reporting
        </span>
      </footer>
    </div>
  )
}
