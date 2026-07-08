'use client'

import type { PageInsightsSummary, IgInsightsSummary } from '@/lib/meta'

type Props = {
  pageInsights: PageInsightsSummary[]
  igInsights: IgInsightsSummary | null
  facebookPageIds?: string[]
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

// Merge multiple page insight results by summing
function mergePageInsights(arr: PageInsightsSummary[]): PageInsightsSummary {
  return arr.reduce(
    (acc, p) => ({
      views: acc.views + p.views,
      viewers: acc.viewers + p.viewers,
      interactions: acc.interactions + p.interactions,
      linkClicks: acc.linkClicks + p.linkClicks,
      visits: acc.visits + p.visits,
      follows: acc.follows + p.follows,
    }),
    { views: 0, viewers: 0, interactions: 0, linkClicks: 0, visits: 0, follows: 0 }
  )
}

export function OrganicSection({ pageInsights, igInsights }: Props) {
  const hasAnyData = pageInsights.length > 0 || igInsights !== null
  if (!hasAnyData) return null

  const fb = pageInsights.length > 0 ? mergePageInsights(pageInsights) : null

  return (
    <div className="mb-8">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <div style={{ width: '2px', height: '16px', background: '#C8972D', borderRadius: '1px' }} />
        <h2
          className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#888888]"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Organic Performance
        </h2>
      </div>

      <div className={`grid gap-4 ${fb && igInsights ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-sm'}`}>
        {/* Facebook Page */}
        {fb && (
          <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-[11px] font-bold text-[#111111]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Facebook Page
              </span>
            </div>
            <MetricRow label="Views (Impressions)" value={fb.views} />
            <MetricRow label="Viewers (Reach, 28-day)" value={fb.viewers} />
            <MetricRow label="Content Interactions" value={fb.interactions} />
            <MetricRow label="Link Clicks" value={fb.linkClicks} />
            <MetricRow label="Page Visits" value={fb.visits} />
            <MetricRow label="New Follows" value={fb.follows} />
          </div>
        )}

        {/* Instagram */}
        {igInsights && (
          <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <defs>
                  <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F58529"/>
                    <stop offset="50%" stopColor="#DD2A7B"/>
                    <stop offset="100%" stopColor="#8134AF"/>
                  </linearGradient>
                </defs>
                <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              <span className="text-[11px] font-bold text-[#111111]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Instagram{igInsights.username ? ` · @${igInsights.username}` : ''}
              </span>
            </div>
            <MetricRow label="Total Followers" value={igInsights.totalFollowers} />
            <MetricRow label="Views (Impressions)" value={igInsights.views} />
            <MetricRow label="Reach" value={igInsights.reach} />
            <MetricRow label="Profile Visits" value={igInsights.profileVisits} />
            <MetricRow label="New Follows" value={igInsights.follows} />
          </div>
        )}
      </div>
    </div>
  )
}
