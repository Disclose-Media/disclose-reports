'use client'

import type { WindsorOrganicSummary } from '@/lib/windsor'

type Props = {
  windsorOrganic: WindsorOrganicSummary | null
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`
  if (n >= 1_000) return n.toLocaleString()
  return String(n)
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#F0EEE9] last:border-0">
      <span className="text-[11px] text-[#888888]" style={{ fontFamily: 'Inter, sans-serif' }}>
        {label}
      </span>
      <span className="text-[13px] font-bold text-[#111111]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        {typeof value === 'number' ? fmt(value) : value}
      </span>
    </div>
  )
}

export function OrganicSection({ windsorOrganic }: Props) {
  if (!windsorOrganic) return null

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div style={{ width: '2px', height: '16px', background: '#C8972D', borderRadius: '1px' }} />
        <h2
          className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#888888]"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Organic Performance
        </h2>
      </div>

      <div className="grid grid-cols-1 max-w-sm">
        <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="text-[11px] font-bold text-[#111111]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Facebook Page
            </span>
          </div>
          <MetricRow label="Views (Impressions)" value={windsorOrganic.views} />
          <MetricRow label="Viewers (Unique Reach)" value={windsorOrganic.viewers} />
          <MetricRow label="Content Interactions" value={windsorOrganic.interactions} />
          <MetricRow label="Link Clicks" value={windsorOrganic.linkClicks} />
          <MetricRow label="Page Visits" value={windsorOrganic.visits} />
          <MetricRow label="New Follows" value={windsorOrganic.follows} />
        </div>
      </div>
    </div>
  )
}
