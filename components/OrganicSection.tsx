'use client'

import { useEffect, useRef } from 'react'
import type { WindsorOrganicResult, WindsorInstagramResult, WindsorIgAudienceData, WindsorFbAudienceData, AudienceGenderAge, AudienceLocation } from '@/lib/windsor'
import type { IgInsightsSummary } from '@/lib/meta'

type Props = {
  windsorOrganic: WindsorOrganicResult | null
  igInsights?: IgInsightsSummary | null
  windsorInstagram?: WindsorInstagramResult | null
  igAudience?: WindsorIgAudienceData | null
  fbAudience?: WindsorFbAudienceData | null
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`
  if (n >= 1_000) return n.toLocaleString('en-NZ')
  return String(n)
}

function MetricRow({ label, value, gold, green }: { label: string; value: string | number; gold?: boolean; green?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#F0EEE9] last:border-0">
      <span className="text-[11px] text-[#888888]" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</span>
      <span
        className={`text-[13px] font-bold ${gold ? 'text-[#C8972D]' : green ? 'text-emerald-600' : 'text-[#111111]'}`}
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        {typeof value === 'number' ? fmt(value) : value}
      </span>
    </div>
  )
}

function KpiTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col px-5 py-4">
      <p className="text-[9px] uppercase tracking-[0.15em] text-[#AAAAAA] mb-1.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
        {label}
      </p>
      <p className="text-[20px] font-bold text-white leading-none" style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-[#555555] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{sub}</p>}
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div style={{ width: '2px', height: '16px', background: '#C8972D', borderRadius: '1px' }} />
      <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#888888]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        {title}
      </h2>
    </div>
  )
}

function TrendChart({ daily, labels: datasetLabels, colors }: {
  daily: Array<{ date: string; views: number; reach: number; interactions: number }>
  labels?: string[]
  colors?: string[]
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<unknown>(null)
  const [l0, l1, l2] = datasetLabels ?? ['Impressions', 'Reach', 'Engagements']
  const [c0, c1, c2] = colors ?? ['rgba(200,151,45,0.9)', 'rgba(99,179,237,0.9)', 'rgba(16,185,129,0.9)']

  useEffect(() => {
    if (!canvasRef.current || daily.length === 0) return
    import('chart.js/auto').then(({ default: Chart }) => {
      if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy()
      const xLabels = daily.map((d) => new Date(d.date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' }))
      chartRef.current = new Chart(canvasRef.current!, {
        type: 'line',
        data: {
          labels: xLabels,
          datasets: [
            { label: l0 ?? 'Impressions', data: daily.map((d) => d.views), borderColor: c0, backgroundColor: (c0 ?? '').replace('0.9', '0.08'), borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, fill: true, tension: 0.4 },
            { label: l1 ?? 'Reach', data: daily.map((d) => d.reach), borderColor: c1, backgroundColor: (c1 ?? '').replace('0.9', '0.06'), borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, fill: true, tension: 0.4 },
            { label: l2 ?? 'Engagements', data: daily.map((d) => d.interactions), borderColor: c2, backgroundColor: (c2 ?? '').replace('0.9', '0.06'), borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 4, fill: false, tension: 0.4 },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              display: true, position: 'top', align: 'end',
              labels: { font: { size: 10, family: 'Inter, sans-serif' }, boxWidth: 10, boxHeight: 2, padding: 16, color: '#888888', usePointStyle: true, pointStyleWidth: 12 },
            },
            tooltip: {
              backgroundColor: '#111111', titleColor: '#C8972D', bodyColor: '#CCCCCC', borderColor: '#2A2A2A', borderWidth: 1, padding: 10,
              titleFont: { family: 'Montserrat, sans-serif', size: 10, weight: 'bold' },
              bodyFont: { family: 'Inter, sans-serif', size: 11 },
              callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString('en-NZ')}` },
            },
          },
          scales: {
            x: { ticks: { color: '#AAAAAA', font: { size: 9, family: 'Inter, sans-serif' }, maxTicksLimit: 10 }, grid: { color: 'rgba(0,0,0,0.04)' }, border: { color: '#E8E4DC' } },
            y: { ticks: { color: '#AAAAAA', font: { size: 9, family: 'Inter, sans-serif' }, callback: (v) => Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}K` : v }, grid: { color: 'rgba(0,0,0,0.04)' }, border: { color: '#E8E4DC' } },
          },
        },
      })
    })
    return () => { if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy() }
  }, [daily, l0, l1, l2, c0, c1, c2])

  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div style={{ width: '2px', height: '12px', background: '#C8972D', borderRadius: '1px' }} />
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#888888]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Daily Performance Trend</p>
        </div>
        <span className="text-[9px] text-[#CCCCCC]" style={{ fontFamily: 'Inter, sans-serif' }}>{daily.length} days</span>
      </div>
      <div className="relative h-48"><canvas ref={canvasRef} /></div>
    </div>
  )
}

function SummaryBlurb({ text }: { text: string }) {
  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] px-5 py-4 mb-5">
      <p className="text-[12px] leading-relaxed text-[#444444]" style={{ fontFamily: 'Inter, sans-serif' }}>{text}</p>
    </div>
  )
}

function LocationList({ items, color }: { items: AudienceLocation[]; color: string }) {
  return (
    <div className="space-y-2.5">
      {items.slice(0, 6).map(({ name, pct }) => (
        <div key={name}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[#444444] truncate pr-2" style={{ fontFamily: 'Inter, sans-serif' }}>{name}</span>
            <span className="text-[10px] text-[#888888] shrink-0" style={{ fontFamily: 'Inter, sans-serif' }}>{pct}%</span>
          </div>
          <div className="h-1 bg-[#F0EEE9] rounded-full overflow-hidden">
            <div style={{ width: `${Math.min(pct, 100)}%`, background: color, height: '100%', borderRadius: '9999px' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function GenderAgeBars({ genderAge }: { genderAge: AudienceGenderAge[] }) {
  const totalGa = genderAge.reduce((s, r) => s + r.women + r.men, 0)
  const maxPct = Math.max(...genderAge.map(r => Math.max(
    totalGa > 0 ? (r.women / totalGa) * 100 : 0,
    totalGa > 0 ? (r.men / totalGa) * 100 : 0,
  )))
  return (
    <div className="space-y-1.5">
      {genderAge.map(({ ageGroup, women, men }) => {
        const wPct = totalGa > 0 ? (women / totalGa) * 100 : 0
        const mPct = totalGa > 0 ? (men / totalGa) * 100 : 0
        const wBar = maxPct > 0 ? (wPct / maxPct) * 100 : 0
        const mBar = maxPct > 0 ? (mPct / maxPct) * 100 : 0
        return (
          <div key={ageGroup} className="flex items-center gap-2">
            <span className="text-[9px] text-[#AAAAAA] w-9 text-right shrink-0" style={{ fontFamily: 'Inter, sans-serif' }}>{ageGroup}</span>
            <div className="flex-1 flex justify-end">
              <div style={{ width: `${wBar}%`, background: '#D4909B', height: '8px', borderRadius: '2px 0 0 2px', transition: 'width 0.3s' }} />
            </div>
            <div className="w-px bg-[#E8E4DC] h-4 shrink-0" />
            <div className="flex-1 flex justify-start">
              <div style={{ width: `${mBar}%`, background: '#5B8DEF', height: '8px', borderRadius: '0 2px 2px 0', transition: 'width 0.3s' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AudienceCard({
  platform, totalCount, womenPct, menPct, genderAge, topCities, topCountries,
}: {
  platform: 'instagram' | 'facebook'
  totalCount: number
  womenPct?: number
  menPct?: number
  genderAge?: AudienceGenderAge[]
  topCities: AudienceLocation[]
  topCountries: AudienceLocation[]
}) {
  const isIg = platform === 'instagram'
  const title = isIg ? 'Audience · Instagram' : 'Audience · Facebook'
  const followersLabel = isIg ? 'Total Followers' : 'Total Page Fans'

  return (
    <div className="mb-10">
      <SectionHeader title={title} />
      <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-5">
        {/* Total count */}
        <div className="mb-5 pb-5 border-b border-[#F0EEE9] flex items-end gap-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.15em] text-[#AAAAAA] mb-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>{followersLabel}</p>
            <p className="text-[28px] font-bold text-[#111111] leading-none" style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}>
              {totalCount.toLocaleString('en-NZ')}
            </p>
          </div>
          {isIg && womenPct != null && menPct != null && (
            <div className="flex items-center gap-4 pb-0.5">
              <span className="flex items-center gap-1.5 text-[10px] text-[#666666]" style={{ fontFamily: 'Inter, sans-serif' }}>
                <span className="inline-block w-2 h-2 rounded-sm" style={{ background: '#D4909B' }} />
                Women {womenPct}%
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-[#666666]" style={{ fontFamily: 'Inter, sans-serif' }}>
                <span className="inline-block w-2 h-2 rounded-sm" style={{ background: '#5B8DEF' }} />
                Men {menPct}%
              </span>
            </div>
          )}
        </div>

        {/* Gender/age (IG only) */}
        {isIg && genderAge && genderAge.length > 0 && (
          <div className="mb-5 pb-5 border-b border-[#F0EEE9]">
            <p className="text-[9px] uppercase tracking-[0.15em] text-[#AAAAAA] font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>Age & Gender</p>
            <GenderAgeBars genderAge={genderAge} />
          </div>
        )}

        {/* Cities + Countries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topCities.length > 0 && (
            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#AAAAAA] font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>Top Cities</p>
              <LocationList items={topCities} color="#C8972D" />
            </div>
          )}
          {topCountries.length > 0 && (
            <div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#AAAAAA] font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>Top Countries</p>
              <LocationList items={topCountries} color="#5B8DEF" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FacebookSection({ windsorOrganic }: { windsorOrganic: WindsorOrganicResult }) {
  const { summary: fb, daily } = windsorOrganic
  const engagementRate = fb.viewers > 0 ? ((fb.interactions / fb.viewers) * 100).toFixed(1) : '0.0'

  return (
    <div className="mb-10">
      <SectionHeader title="Organic Performance · Facebook" />

      {/* Summary bar */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-[8px] mb-5 overflow-hidden">
        <div className="border-b border-[#1E1E1E] px-6 py-3 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.18em]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: '#C8972D' }}>Period Totals</p>
          {fb.totalPageLikes > 0 && <span className="text-[10px] text-[#555555]" style={{ fontFamily: 'Inter, sans-serif' }}>{fmt(fb.totalPageLikes)} page likes</span>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-y divide-[#1E1E1E] sm:divide-y-0">
          <KpiTile label="Impressions" value={fmt(fb.views)} />
          <KpiTile label="Reach" value={fmt(fb.viewers)} />
          <KpiTile label="Interactions" value={fmt(fb.interactions)} sub={`${engagementRate}% eng. rate`} />
          <KpiTile label="Link Clicks" value={fmt(fb.linkClicks)} />
          <KpiTile label="Page Visits" value={fmt(fb.visits)} />
          <KpiTile label="New Follows" value={fmt(fb.follows)} />
        </div>
      </div>

      {/* Summary */}
      <SummaryBlurb text={
        `Your Facebook Page reached ${fmt(fb.viewers)} unique people with ${fmt(fb.views)} impressions this period. ` +
        `Content generated ${fmt(fb.interactions)} interactions (${engagementRate}% engagement rate), ${fmt(fb.linkClicks)} link clicks, and ${fmt(fb.visits)} page visits.` +
        (fb.follows > 0 ? ` The page gained ${fmt(fb.follows)} new follower${fb.follows === 1 ? '' : 's'}.` : '')
      } />

      {/* Trend chart */}
      {daily.length > 0 && <TrendChart daily={daily.map(d => ({ date: d.date, views: d.impressions, reach: d.reach, interactions: d.engagements }))} />}

      {/* Metrics card */}
      <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="text-[11px] font-bold text-[#111111]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Facebook Page</span>
          </div>
          <span className="text-[9px] px-2 py-1 rounded-full border border-[#E8E4DC] text-[#888888]" style={{ fontFamily: 'Inter, sans-serif' }}>{engagementRate}% eng. rate</span>
        </div>
        {fb.totalPageLikes > 0 && <MetricRow label="Total Page Likes" value={fb.totalPageLikes} />}
        <MetricRow label="Impressions" value={fb.views} />
        <MetricRow label="Unique Reach" value={fb.viewers} />
        <MetricRow label="Content Interactions" value={fb.interactions} gold />
        <MetricRow label="Link Clicks" value={fb.linkClicks} />
        <MetricRow label="Page Visits" value={fb.visits} />
        <MetricRow label="New Follows" value={fb.follows} green />
      </div>
    </div>
  )
}

function InstagramSection({ windsorInstagram }: { windsorInstagram: WindsorInstagramResult }) {
  const { summary: ig, daily } = windsorInstagram
  const hasData = ig.views > 0 || ig.reach > 0 || ig.interactions > 0 || ig.newFollows > 0

  const engagementRate = ig.reach > 0 ? ((ig.interactions / ig.reach) * 100).toFixed(1) : '0.0'

  if (!hasData) {
    return (
      <div className="mb-10">
        <SectionHeader title="Organic Performance · Instagram" />
        <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-8 text-center">
          <p className="text-[11px] font-semibold text-[#888888] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>No Instagram data for this period</p>
          <p className="text-[11px] text-[#AAAAAA]" style={{ fontFamily: 'Inter, sans-serif' }}>Try selecting a different date range above</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-10">
      <SectionHeader title="Organic Performance · Instagram" />

      {/* Summary bar */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-[8px] mb-5 overflow-hidden">
        <div className="border-b border-[#1E1E1E] px-6 py-3 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.18em]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: '#C8972D' }}>Period Totals</p>
          {ig.totalFollowers > 0 && <span className="text-[10px] text-[#555555]" style={{ fontFamily: 'Inter, sans-serif' }}>{fmt(ig.totalFollowers)} followers</span>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-y divide-[#1E1E1E] sm:divide-y-0">
          <KpiTile label="Views" value={fmt(ig.views)} />
          <KpiTile label="Reach" value={fmt(ig.reach)} />
          <KpiTile label="Interactions" value={fmt(ig.interactions)} sub={`${engagementRate}% eng. rate`} />
          <KpiTile label="Link Clicks" value={fmt(ig.linkClicks)} />
          <KpiTile label="Profile Visits" value={fmt(ig.profileViews)} />
          <KpiTile label="New Follows" value={fmt(ig.newFollows)} />
        </div>
      </div>

      {/* Summary */}
      <SummaryBlurb text={
        `Your Instagram ${ig.username ? `(@${ig.username}) ` : ''}reached ${fmt(ig.reach)} unique accounts with ${fmt(ig.views)} content views this period. ` +
        `Posts, reels and stories generated ${fmt(ig.interactions)} total interactions — ${fmt(ig.likes)} likes, ${fmt(ig.comments)} comments, ${fmt(ig.saves)} saves and ${fmt(ig.shares)} shares.` +
        (ig.linkClicks > 0 || ig.profileViews > 0 ? ` The profile received ${fmt(ig.profileViews)} visits and ${fmt(ig.linkClicks)} link clicks.` : '') +
        (ig.newFollows > 0 ? ` You gained ${fmt(ig.newFollows)} new follower${ig.newFollows === 1 ? '' : 's'}.` : '')
      } />

      {/* Trend chart */}
      {daily.length > 0 && (
        <TrendChart
          daily={daily}
          labels={['Views', 'Reach', 'Interactions']}
          colors={['rgba(200,151,45,0.9)', 'rgba(99,179,237,0.9)', 'rgba(131,52,175,0.9)']}
        />
      )}

      {/* Metrics card */}
      <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <defs>
                <linearGradient id="ig-grad-organic" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F58529" />
                  <stop offset="50%" stopColor="#DD2A7B" />
                  <stop offset="100%" stopColor="#8134AF" />
                </linearGradient>
              </defs>
              <path fill="url(#ig-grad-organic)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            <span className="text-[11px] font-bold text-[#111111]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Instagram{ig.username ? ` · @${ig.username}` : ''}
            </span>
          </div>
          {ig.totalFollowers > 0 && (
            <span className="text-[9px] px-2 py-1 rounded-full border border-[#E8E4DC] text-[#888888]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {fmt(ig.totalFollowers)} followers
            </span>
          )}
        </div>
        <MetricRow label="Views" value={ig.views} />
        <MetricRow label="Reach" value={ig.reach} />
        <MetricRow label="Interactions" value={ig.interactions} gold />
        <MetricRow label="Likes" value={ig.likes} />
        <MetricRow label="Comments" value={ig.comments} />
        <MetricRow label="Saves" value={ig.saves} />
        <MetricRow label="Shares" value={ig.shares} />
        <MetricRow label="Link Clicks" value={ig.linkClicks} />
        <MetricRow label="Profile Visits" value={ig.profileViews} />
        <MetricRow label="New Follows" value={ig.newFollows} green />
      </div>
    </div>
  )
}

export function OrganicSection({ windsorOrganic, igInsights = null, windsorInstagram = null, igAudience = null, fbAudience = null }: Props) {
  if (!windsorOrganic) return null

  const { summary: fb } = windsorOrganic
  const hasData = fb.views > 0 || fb.viewers > 0 || fb.visits > 0 || fb.follows > 0

  if (!hasData) {
    return (
      <div className="mb-8">
        <SectionHeader title="Organic Performance" />
        <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-8 text-center">
          <p className="text-[11px] font-semibold text-[#888888] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>No data for this period</p>
          <p className="text-[11px] text-[#AAAAAA]" style={{ fontFamily: 'Inter, sans-serif' }}>Try selecting a different date range above</p>
        </div>
      </div>
    )
  }

  // Legacy Meta IG fallback for paid clients (igInsights from Meta API)
  const legacyIg = igInsights && !windsorInstagram ? igInsights : null

  return (
    <div>
      <FacebookSection windsorOrganic={windsorOrganic} />
      {fbAudience && fbAudience.totalFans > 0 && (
        <AudienceCard platform="facebook" totalCount={fbAudience.totalFans} topCities={fbAudience.topCities} topCountries={fbAudience.topCountries} />
      )}
      {windsorInstagram && <InstagramSection windsorInstagram={windsorInstagram} />}
      {igAudience && igAudience.totalFollowers > 0 && (
        <AudienceCard platform="instagram" totalCount={igAudience.totalFollowers} womenPct={igAudience.womenPct} menPct={igAudience.menPct} genderAge={igAudience.genderAge} topCities={igAudience.topCities} topCountries={igAudience.topCountries} />
      )}
      {legacyIg && (
        <div className="mb-10">
          <SectionHeader title="Organic Performance · Instagram" />
          <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="ig-grad-legacy" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F58529" /><stop offset="50%" stopColor="#DD2A7B" /><stop offset="100%" stopColor="#8134AF" />
                    </linearGradient>
                  </defs>
                  <path fill="url(#ig-grad-legacy)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
                <span className="text-[11px] font-bold text-[#111111]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Instagram{legacyIg.username ? ` · @${legacyIg.username}` : ''}
                </span>
              </div>
              {legacyIg.totalFollowers > 0 && (
                <span className="text-[9px] px-2 py-1 rounded-full border border-[#E8E4DC] text-[#888888]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {fmt(legacyIg.totalFollowers)} followers
                </span>
              )}
            </div>
            <MetricRow label="Total Followers" value={legacyIg.totalFollowers} />
            <MetricRow label="Impressions" value={legacyIg.views} />
            <MetricRow label="Reach" value={legacyIg.reach} />
            <MetricRow label="Profile Visits" value={legacyIg.profileVisits} gold />
            <MetricRow label="New Follows" value={legacyIg.follows} green />
          </div>
        </div>
      )}
    </div>
  )
}
