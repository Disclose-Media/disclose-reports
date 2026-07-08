'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { paidClients, organicClients } from '@/lib/clients'
import { useState } from 'react'

export function Sidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const period = searchParams.get('period') || 'last_30d'
  const [mobileOpen, setMobileOpen] = useState(false)

  const activeId = pathname.startsWith('/client/') ? pathname.split('/')[2] : null

  const NavItem = ({ client }: { client: (typeof paidClients)[0] }) => {
    const isActive = activeId === client.id
    return (
      <Link
        href={`/client/${client.id}?period=${period}`}
        onClick={() => setMobileOpen(false)}
        className={`group flex items-center gap-2.5 px-3 py-2 rounded-md text-[11px] font-medium transition-all duration-150 border-l-2 ${
          isActive
            ? 'bg-[rgba(200,151,45,0.12)] text-[#C8972D] border-[#C8972D] pl-[10px]'
            : 'text-[#888888] hover:text-white hover:bg-[#1C1C1C] border-transparent'
        }`}
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
          isActive ? 'bg-[#C8972D]' : 'bg-[#333333] group-hover:bg-[#666666]'
        }`} />
        <span className="truncate">{client.name}</span>
      </Link>
    )
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#111111]">
      {/* Logo & brand */}
      <div className="px-5 pt-6 pb-5 border-b border-[#1E1E1E]">
        <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
          <img src="/dm-logo-white.png" alt="Disclose Media" className="h-7 w-auto object-contain" />
        </Link>
        <div className="mt-3">
          <p className="text-white text-[11px] font-bold tracking-[0.12em] uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Disclose Media
          </p>
          <p className="text-[9px] tracking-[0.18em] uppercase mt-0.5 font-semibold" style={{ fontFamily: 'Montserrat, sans-serif', color: '#C8972D' }}>
            Reporting Portal
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[11px] font-medium transition-all duration-150 border-l-2 ${
            pathname === '/'
              ? 'bg-[rgba(200,151,45,0.12)] text-[#C8972D] border-[#C8972D] pl-[10px]'
              : 'text-[#888888] hover:text-white hover:bg-[#1C1C1C] border-transparent'
          }`}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="0" y="0" width="5" height="5" rx="1" />
            <rect x="7" y="0" width="5" height="5" rx="1" />
            <rect x="0" y="7" width="5" height="5" rx="1" />
            <rect x="7" y="7" width="5" height="5" rx="1" />
          </svg>
          <span>All Clients</span>
        </Link>

        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] px-3 mb-2 font-semibold" style={{ fontFamily: 'Montserrat, sans-serif', color: '#C8972D' }}>
            Paid Media
          </p>
          <div className="space-y-0.5">
            {paidClients.map((c) => <NavItem key={c.id} client={c} />)}
          </div>
        </div>

        {organicClients.length > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] px-3 mb-2 font-semibold" style={{ fontFamily: 'Montserrat, sans-serif', color: '#C8972D' }}>
              Organic
            </p>
            <div className="space-y-0.5">
              {organicClients.map((c) => <NavItem key={c.id} client={c} />)}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[#1E1E1E] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[9px] text-[#666666] uppercase tracking-[0.15em]" style={{ fontFamily: 'Inter, sans-serif' }}>Live</span>
          </div>
          <span className="text-[9px] text-[#444444]" style={{ fontFamily: 'Inter, sans-serif' }}>Meta Ads API</span>
        </div>
        <form action="/logout" method="POST">
          <button type="submit" className="w-full text-left text-[10px] text-[#555555] hover:text-[#888888] transition-colors flex items-center gap-2 py-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M4 1H2a1 1 0 00-1 1v7a1 1 0 001 1h2M7.5 8L10 5.5 7.5 3M10 5.5H4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign out
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#111111] border border-[#222222] rounded-lg p-2.5 text-[#C8972D] shadow-lg"
        aria-label="Open menu"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect y="2" width="16" height="1.5" rx="0.75" fill="currentColor" />
          <rect y="7.25" width="11" height="1.5" rx="0.75" fill="currentColor" />
          <rect y="12.5" width="16" height="1.5" rx="0.75" fill="currentColor" />
        </svg>
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/70 z-40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      <div className={`lg:hidden fixed left-0 top-0 bottom-0 w-56 z-50 transition-transform duration-200 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </div>

      <div className="hidden lg:block w-52 shrink-0 bg-[#111111] min-h-screen fixed left-0 top-0 bottom-0 border-r border-[#1E1E1E]">
        {sidebarContent}
      </div>
    </>
  )
}
