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
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
          isActive
            ? 'bg-[rgba(201,151,58,0.15)] text-[#C9973A] border border-[rgba(201,151,58,0.3)]'
            : 'text-gray-500 hover:text-gray-200 hover:bg-[#1E1E1E]'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-[#C9973A]' : 'bg-gray-700'}`} />
        <span className="truncate">{client.name}</span>
      </Link>
    )
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[rgba(201,151,58,0.15)]">
        <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
          <DMLogo />
          <div>
            <p className="text-white text-xs font-bold tracking-wider" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              DISCLOSE MEDIA
            </p>
            <p className="text-[9px] text-gray-600 tracking-widest uppercase">Reporting Portal</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* Home */}
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
            pathname === '/'
              ? 'bg-[rgba(201,151,58,0.15)] text-[#C9973A] border border-[rgba(201,151,58,0.3)]'
              : 'text-gray-500 hover:text-gray-200 hover:bg-[#1E1E1E]'
          }`}
        >
          <span className="text-[10px]">⊞</span>
          <span>All Clients</span>
        </Link>

        {/* Paid */}
        <div>
          <p className="text-[9px] text-gray-700 uppercase tracking-[0.15em] px-3 mb-2">
            Paid Media
          </p>
          <div className="space-y-0.5">
            {paidClients.map((c) => <NavItem key={c.id} client={c} />)}
          </div>
        </div>

        {/* Organic */}
        <div>
          <p className="text-[9px] text-gray-700 uppercase tracking-[0.15em] px-3 mb-2">
            Organic
          </p>
          <div className="space-y-0.5">
            {organicClients.map((c) => <NavItem key={c.id} client={c} />)}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[rgba(201,151,58,0.1)]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          <span className="text-[9px] text-gray-600 uppercase tracking-wider">Live Data</span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#141414] border border-[rgba(201,151,58,0.2)] rounded-lg p-2 text-[#C9973A]"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect y="2" width="16" height="1.5" rx="0.75" fill="currentColor" />
          <rect y="7.25" width="16" height="1.5" rx="0.75" fill="currentColor" />
          <rect y="12.5" width="16" height="1.5" rx="0.75" fill="currentColor" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed left-0 top-0 bottom-0 w-56 bg-[#0D0D0D] border-r border-[rgba(201,151,58,0.15)] z-50 transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-52 shrink-0 bg-[#0D0D0D] border-r border-[rgba(201,151,58,0.15)] min-h-screen fixed left-0 top-0 bottom-0">
        {sidebarContent}
      </div>
    </>
  )
}

function DMLogo() {
  return (
    <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="6" fill="#141414" />
      <polygon points="20,4 36,13 36,27 20,36 4,27 4,13" fill="none" stroke="#C9973A" strokeWidth="1.5" />
      <polygon points="20,10 30,15.5 30,24.5 20,30 10,24.5 10,15.5" fill="#C9973A" opacity="0.2" />
      <text x="20" y="23" textAnchor="middle" fontSize="9" fontWeight="700" fill="#C9973A" fontFamily="Montserrat, sans-serif">DM</text>
    </svg>
  )
}
