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
            ? 'bg-[rgba(200,151,45,0.08)] text-[#C8972D] border-[#C8972D] pl-[10px]'
            : 'text-[#888888] hover:text-[#111111] hover:bg-[#F8F6F2] border-transparent'
        }`}
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
          isActive ? 'bg-[#C8972D]' : 'bg-[#D8D4CC] group-hover:bg-[#AAAAAA]'
        }`} />
        <span className="truncate">{client.name}</span>
      </Link>
    )
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#E8E4DC]">
      {/* Logo & brand */}
      <div className="px-5 pt-6 pb-5 border-b border-[#E8E4DC]">
        <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
          <img
            src="/dm-logo-dark.png"
            alt="Disclose Media"
            className="h-7 w-auto object-contain"
          />
        </Link>
        <div className="mt-3">
          <p
            className="text-[#111111] text-[11px] font-bold tracking-[0.12em] uppercase"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Disclose Media
          </p>
          <p
            className="text-[9px] tracking-[0.18em] uppercase mt-0.5"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#C8972D', fontWeight: 600 }}
          >
            Reporting Portal
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* Home */}
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[11px] font-medium transition-all duration-150 border-l-2 ${
            pathname === '/'
              ? 'bg-[rgba(200,151,45,0.08)] text-[#C8972D] border-[#C8972D] pl-[10px]'
              : 'text-[#888888] hover:text-[#111111] hover:bg-[#F8F6F2] border-transparent'
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

        {/* Paid Media */}
        <div>
          <p
            className="text-[9px] uppercase tracking-[0.18em] px-3 mb-2"
            style={{ fontFamily: 'Montserrat, sans-serif', color: '#C8972D', fontWeight: 600 }}
          >
            Paid Media
          </p>
          <div className="space-y-0.5">
            {paidClients.map((c) => <NavItem key={c.id} client={c} />)}
          </div>
        </div>

        {/* Organic */}
        {organicClients.length > 0 && (
          <div>
            <p
              className="text-[9px] uppercase tracking-[0.18em] px-3 mb-2"
              style={{ fontFamily: 'Montserrat, sans-serif', color: '#C8972D', fontWeight: 600 }}
            >
              Organic
            </p>
            <div className="space-y-0.5">
              {organicClients.map((c) => <NavItem key={c.id} client={c} />)}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[#E8E4DC]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[9px] text-[#AAAAAA] uppercase tracking-[0.15em]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Live
            </span>
          </div>
          <span className="text-[9px] text-[#CCCCCC]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Meta Ads API
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white border border-[#E8E4DC] rounded-lg p-2.5 text-[#C8972D] shadow-sm"
        aria-label="Open menu"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect y="2" width="16" height="1.5" rx="0.75" fill="currentColor" />
          <rect y="7.25" width="11" height="1.5" rx="0.75" fill="currentColor" />
          <rect y="12.5" width="16" height="1.5" rx="0.75" fill="currentColor" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed left-0 top-0 bottom-0 w-56 z-50 transition-transform duration-200 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-52 shrink-0 min-h-screen fixed left-0 top-0 bottom-0">
        {sidebarContent}
      </div>
    </>
  )
}
