'use client'

import { useEffect, useRef, useState } from 'react'
import type { GoogleAdsResult, GoogleAdsCampaign } from '@/lib/google-ads'

type Props = { data: GoogleAdsResult; clientName?: string; period?: string }

function fmt(n: number) {
  if (isNaN(n) || n === 0) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`
  if (n >= 1_000) return n.toLocaleString('en-NZ')
  return String(Math.round(n))
}
function fmtDollar(n: number) {
  if (isNaN(n) || n === 0) return '$0.00'
  return `$${n.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtPct(n: number) { return `${n.toFixed(2)}%` }
function fmtDate(s: string) {
  const d = new Date(s + 'T00:00:00')
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div style={{ width: '3px', height: '16px', background: '#C8972D', borderRadius: '2px' }} />
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#888888]" style={{ fontFamily: 'Montserrat, sans-serif' }}>{title}</span>
    </div>
  )
}

function KpiCard({ label, value, sub, gold, green }: { label: string; value: string; sub?: string; gold?: boolean; green?: boolean }) {
  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4">
      <p className="text-[9px] uppercase tracking-[0.15em] text-[#AAAAAA] mb-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>{label}</p>
      <p className={`text-[22px] font-bold tracking-tight leading-none ${gold ? 'text-[#C8972D]' : green ? 'text-emerald-600' : 'text-[#111111]'}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>{value}</p>
      {sub && <p className="text-[10px] text-[#AAAAAA] mt-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>{sub}</p>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase()
  if (s === 'ENABLED') return <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
  if (s === 'PAUSED') return <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paused</span>
  return <span className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">{status}</span>
}

type SortKey = 'name' | 'spend' | 'clicks' | 'impressions' | 'ctr' | 'avgCpc' | 'conversions' | 'costPerConversion' | 'conversionRate'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`inline-flex flex-col ml-1 gap-[1px] ${active ? 'text-[#C8972D]' : 'text-[#CCCCCC]'}`}>
      <svg width="6" height="4" viewBox="0 0 6 4" fill="currentColor" className={active && dir === 'asc' ? 'opacity-100' : 'opacity-40'}><path d="M3 0L6 4H0L3 0Z"/></svg>
      <svg width="6" height="4" viewBox="0 0 6 4" fill="currentColor" className={active && dir === 'desc' ? 'opacity-100' : 'opacity-40'}><path d="M3 4L0 0H6L3 4Z"/></svg>
    </span>
  )
}

function TrendChart({ daily }: { daily: GoogleAdsResult['daily'] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const obj = useRef<unknown>(null)

  useEffect(() => {
    if (!ref.current || daily.length === 0) return
    import('chart.js/auto').then(({ default: Chart }) => {
      if (obj.current) (obj.current as { destroy: () => void }).destroy()
      const labels = daily.map(d => fmtDate(d.date))
      obj.current = new Chart(ref.current!, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Clicks',
              data: daily.map(d => d.clicks),
              borderColor: 'rgba(200,151,45,0.9)',
              backgroundColor: 'rgba(200,151,45,0.08)',
              tension: 0.3, fill: true, pointRadius: daily.length > 20 ? 0 : 3, borderWidth: 2, yAxisID: 'y',
            },
            {
              label: 'Impressions',
              data: daily.map(d => d.impressions),
              borderColor: 'rgba(99,179,237,0.9)',
              backgroundColor: 'rgba(99,179,237,0.04)',
              tension: 0.3, fill: false, pointRadius: daily.length > 20 ? 0 : 3, borderWidth: 1.5, yAxisID: 'y1',
            },
            {
              label: 'Conversions',
              data: daily.map(d => d.conversions),
              borderColor: 'rgba(16,185,129,0.9)',
              backgroundColor: 'rgba(16,185,129,0.08)',
              tension: 0.3, fill: false, pointRadius: daily.length > 20 ? 0 : 3, borderWidth: 2, yAxisID: 'y',
            },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: true, position: 'top', align: 'end', labels: { boxWidth: 10, padding: 14, font: { size: 10, family: 'Inter, sans-serif' }, color: '#888888' } },
            tooltip: { backgroundColor: '#111111', titleColor: '#FFFFFF', bodyColor: '#CCCCCC', padding: 10, cornerRadius: 6, titleFont: { size: 11 }, bodyFont: { size: 11 } },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10, family: 'Inter, sans-serif' }, color: '#AAAAAA', maxTicksLimit: 10 }, border: { display: false } },
            y: { position: 'left', grid: { color: '#F0EEE9' }, ticks: { font: { size: 10, family: 'Inter, sans-serif' }, color: '#AAAAAA' }, border: { display: false } },
            y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { font: { size: 10, family: 'Inter, sans-serif' }, color: '#99BBDD' }, border: { display: false } },
          },
        },
      })
    })
    return () => { if (obj.current) (obj.current as { destroy: () => void }).destroy() }
  }, [daily])

  if (daily.length === 0) return null
  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4 mb-5">
      <SectionHeader title="Daily Performance Trend" />
      <div className="relative h-52">
        <canvas ref={ref} />
      </div>
    </div>
  )
}

function DeviceSection({ devices }: { devices: GoogleAdsResult['devices'] }) {
  if (devices.length === 0) return null
  const total = devices.reduce((s, d) => s + d.spend, 0)
  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] overflow-hidden mb-5">
      <div className="px-4 py-3 border-b border-[#F0EEE9]">
        <SectionHeader title="Device Breakdown" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          <thead>
            <tr className="border-b border-[#F0EEE9]">
              {['Device', 'Spend', 'Spend %', 'Clicks', 'Impressions', 'Conversions', 'Conv. Rate'].map(h => (
                <th key={h} className={`px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#AAAAAA] ${h === 'Device' ? 'text-left' : 'text-right'}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {devices.map((d, i) => (
              <tr key={d.device} className={`${i < devices.length - 1 ? 'border-b border-[#F0EEE9]' : ''} hover:bg-[#FAFAF8]`}>
                <td className="px-4 py-2.5 font-medium text-[#333333]">
                  <span className="flex items-center gap-2">
                    <span className="text-[10px]">{d.device === 'Mobile' ? '📱' : d.device === 'Desktop' ? '🖥️' : '📟'}</span>
                    {d.device}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-[#C8972D] font-semibold">{fmtDollar(d.spend)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-[#888888]">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 bg-[#F0EEE9] rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-[#C8972D]" style={{ width: `${total > 0 ? (d.spend / total) * 100 : 0}%` }} />
                    </div>
                    {total > 0 ? `${((d.spend / total) * 100).toFixed(0)}%` : '—'}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{fmt(d.clicks)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{fmt(d.impressions)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600 font-medium">{d.conversions > 0 ? fmt(d.conversions) : '—'}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{d.conversionRate > 0 ? fmtPct(d.conversionRate) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function KeywordSection({ keywords }: { keywords: GoogleAdsResult['keywords'] }) {
  const [showAll, setShowAll] = useState(false)
  const hasConversions = keywords.some(k => k.conversions > 0)
  const visible = showAll ? keywords : keywords.slice(0, 10)
  if (keywords.length === 0) return null
  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] overflow-hidden mb-5">
      <div className="px-4 py-3 border-b border-[#F0EEE9] flex items-center justify-between">
        <SectionHeader title="Keyword Performance" />
        <span className="text-[10px] text-[#AAAAAA]" style={{ fontFamily: 'Inter, sans-serif' }}>{keywords.length} keywords</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          <thead>
            <tr className="border-b border-[#F0EEE9]">
              {['Keyword', 'Spend', 'Clicks', 'Impr.', 'CTR', 'Avg CPC', ...(hasConversions ? ['Conv.', 'Conv. Rate'] : [])].map(h => (
                <th key={h} className={`px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#AAAAAA] ${h === 'Keyword' ? 'text-left' : 'text-right'}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((k, i) => (
              <tr key={k.keyword} className={`${i < visible.length - 1 ? 'border-b border-[#F0EEE9]' : ''} hover:bg-[#FAFAF8]`}>
                <td className="px-4 py-2.5 font-medium text-[#333333] max-w-[200px]"><span className="block truncate" title={k.keyword}>{k.keyword}</span></td>
                <td className="px-4 py-2.5 text-right tabular-nums text-[#C8972D] font-semibold">{fmtDollar(k.spend)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{fmt(k.clicks)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{fmt(k.impressions)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{fmtPct(k.ctr)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{fmtDollar(k.avgCpc)}</td>
                {hasConversions && <>
                  <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600 font-medium">{k.conversions > 0 ? fmt(k.conversions) : '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{k.conversionRate > 0 ? fmtPct(k.conversionRate) : '—'}</td>
                </>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {keywords.length > 10 && (
        <button onClick={() => setShowAll(v => !v)} className="w-full py-2.5 text-[10px] text-[#888888] hover:text-[#C8972D] hover:bg-[#FAFAF8] transition-colors border-t border-[#F0EEE9]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {showAll ? 'Show less' : `Show all ${keywords.length} keywords`}
        </button>
      )}
    </div>
  )
}

function GeoSection({ geo }: { geo: GoogleAdsResult['geo'] }) {
  const hasConversions = geo.some(g => g.conversions > 0)
  const totalSpend = geo.reduce((s, g) => s + g.spend, 0)
  if (geo.length === 0) return null
  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] overflow-hidden mb-5">
      <div className="px-4 py-3 border-b border-[#F0EEE9] flex items-center justify-between">
        <SectionHeader title="Geographic Performance" />
        <span className="text-[10px] text-[#AAAAAA]" style={{ fontFamily: 'Inter, sans-serif' }}>{geo.length} locations</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          <thead>
            <tr className="border-b border-[#F0EEE9]">
              {['City / Region', 'Spend', 'Share', 'Clicks', ...(hasConversions ? ['Conversions'] : [])].map(h => (
                <th key={h} className={`px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#AAAAAA] ${h === 'City / Region' ? 'text-left' : 'text-right'}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {geo.map((g, i) => (
              <tr key={g.city} className={`${i < geo.length - 1 ? 'border-b border-[#F0EEE9]' : ''} hover:bg-[#FAFAF8]`}>
                <td className="px-4 py-2.5 font-medium text-[#333333]">{g.city}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-[#C8972D] font-semibold">{fmtDollar(g.spend)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-14 bg-[#F0EEE9] rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-[#C8972D] opacity-60" style={{ width: `${totalSpend > 0 ? Math.min((g.spend / totalSpend) * 100, 100) : 0}%` }} />
                    </div>
                    <span className="text-[#888888] w-8 text-right">{totalSpend > 0 ? `${((g.spend / totalSpend) * 100).toFixed(0)}%` : '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{fmt(g.clicks)}</td>
                {hasConversions && <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600 font-medium">{g.conversions > 0 ? fmt(g.conversions) : '—'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CampaignTable({ campaigns }: { campaigns: GoogleAdsCampaign[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('spend')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const hasConversions = campaigns.some(c => c.conversions > 0)

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...campaigns].sort((a, b) => {
    const av = a[sortKey as keyof GoogleAdsCampaign]
    const bv = b[sortKey as keyof GoogleAdsCampaign]
    if (typeof av === 'string' && typeof bv === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
  })

  const cols: { key: SortKey; label: string }[] = [
    { key: 'name', label: 'Campaign' },
    { key: 'spend', label: 'Spend' },
    { key: 'impressions', label: 'Impr.' },
    { key: 'clicks', label: 'Clicks' },
    { key: 'ctr', label: 'CTR' },
    { key: 'avgCpc', label: 'Avg CPC' },
    ...(hasConversions ? [{ key: 'conversions' as SortKey, label: 'Conv.' }, { key: 'costPerConversion' as SortKey, label: 'Cost/Conv.' }, { key: 'conversionRate' as SortKey, label: 'Conv. Rate' }] : []),
  ]

  function cellVal(c: GoogleAdsCampaign, key: SortKey): string {
    switch (key) {
      case 'name': return c.name
      case 'spend': return fmtDollar(c.spend)
      case 'impressions': return fmt(c.impressions)
      case 'clicks': return fmt(c.clicks)
      case 'ctr': return fmtPct(c.ctr)
      case 'avgCpc': return fmtDollar(c.avgCpc)
      case 'conversions': return c.conversions > 0 ? fmt(c.conversions) : '—'
      case 'costPerConversion': return c.costPerConversion > 0 ? fmtDollar(c.costPerConversion) : '—'
      case 'conversionRate': return c.conversionRate > 0 ? fmtPct(c.conversionRate) : '—'
    }
  }

  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] overflow-hidden mb-5">
      <div className="px-4 py-3 border-b border-[#F0EEE9] flex items-center justify-between">
        <SectionHeader title="Campaign Breakdown" />
        <span className="text-[10px] text-[#AAAAAA]" style={{ fontFamily: 'Inter, sans-serif' }}>{campaigns.length} campaigns</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          <thead>
            <tr className="border-b border-[#F0EEE9]">
              {cols.map(col => (
                <th key={col.key} className={`px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#AAAAAA] cursor-pointer select-none whitespace-nowrap hover:text-[#C8972D] transition-colors ${col.key === 'name' ? 'text-left' : 'text-right'}`} style={{ fontFamily: 'Montserrat, sans-serif' }} onClick={() => handleSort(col.key)}>
                  {col.label}<SortIcon active={sortKey === col.key} dir={sortDir} />
                </th>
              ))}
              <th className="px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#AAAAAA] text-left" style={{ fontFamily: 'Montserrat, sans-serif' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <tr key={c.id} className={`${i < sorted.length - 1 ? 'border-b border-[#F0EEE9]' : ''} hover:bg-[#FAFAF8] transition-colors`}>
                {cols.map(col => (
                  <td key={col.key} className={`px-3 py-2.5 text-[#333333] ${col.key === 'name' ? 'text-left font-medium max-w-[220px]' : 'text-right tabular-nums'} ${col.key === 'spend' ? 'text-[#C8972D] font-semibold' : ''} ${col.key === 'conversions' && c.conversions > 0 ? 'text-emerald-600 font-medium' : ''}`}>
                    {col.key === 'name' ? <span className="block truncate" title={c.name}>{c.name}</span> : cellVal(c, col.key)}
                  </td>
                ))}
                <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={cols.length + 1} className="px-4 py-8 text-center text-[#AAAAAA] text-[12px]">No campaign data for this period</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AiSummary({ data, clientName, period }: { data: GoogleAdsResult; clientName?: string; period?: string }) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    setLoading(true)
    fetch('/api/google-ads-summary', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data, clientName, period }),
    })
      .then(r => r.json())
      .then(j => setSummary(j.summary ?? null))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  const { summary: s } = data
  const fallback = `${clientName ?? 'This account'} generated ${fmt(s.clicks)} clicks from ${fmt(s.impressions)} impressions at a ${fmtPct(s.ctr)} CTR, investing ${fmtDollar(s.spend)} across Google Ads${period ? ` during ${period}` : ''}.${s.conversions > 0 ? ` The account recorded ${fmt(s.conversions)} conversions at ${fmtDollar(s.costPerConversion)} per conversion.` : ''}`

  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] overflow-hidden mb-5">
      <div className="px-4 py-3 border-b border-[#F0EEE9]">
        <SectionHeader title="Performance Snapshot" />
      </div>
      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-2">
            <div className="h-3 bg-[#F0EEE9] rounded animate-pulse w-full" />
            <div className="h-3 bg-[#F0EEE9] rounded animate-pulse w-5/6" />
          </div>
        ) : (
          <p className="text-[12px] leading-relaxed text-[#444444]" style={{ fontFamily: 'Inter, sans-serif' }}>{summary ?? fallback}</p>
        )}
      </div>
    </div>
  )
}

export function GoogleAdsSection({ data, clientName, period }: Props) {
  const { summary: s } = data
  const hasConversions = s.conversions > 0

  return (
    <div>
      {/* KPI Summary bar */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-[8px] mb-5 overflow-hidden" style={{ borderRadius: '8px 8px 8px 8px' }}>
        <div className="border-b border-[#1E1E1E] px-5 py-3" style={{ borderRadius: '8px 8px 0 0', background: '#111111' }}>
          <p className="text-[10px] uppercase tracking-[0.18em]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: '#C8972D' }}>Account Totals</p>
        </div>
        <div className={`grid divide-x divide-[#1E1E1E] ${hasConversions ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-7' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {[
            { label: 'Total Spend', value: fmtDollar(s.spend), gold: true },
            { label: 'Clicks', value: fmt(s.clicks) },
            { label: 'Impressions', value: fmt(s.impressions) },
            { label: 'CTR', value: fmtPct(s.ctr) },
            { label: 'Avg CPC', value: fmtDollar(s.avgCpc) },
            ...(hasConversions ? [
              { label: 'Conversions', value: fmt(s.conversions), green: true },
              { label: 'Cost / Conv.', value: fmtDollar(s.costPerConversion) },
            ] : []),
          ].map((item) => (
            <div key={item.label} className="px-5 py-4">
              <p className="text-[9px] uppercase tracking-[0.14em] mb-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: '#555555' }}>{item.label}</p>
              <p className={`text-[20px] font-bold leading-none ${'gold' in item && item.gold ? 'text-[#C8972D]' : 'green' in item && item.green ? 'text-emerald-400' : 'text-white'}`} style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Snapshot */}
      <AiSummary data={data} clientName={clientName} period={period} />

      {/* Trend Chart */}
      <TrendChart daily={data.daily} />

      {/* Campaign Table */}
      <CampaignTable campaigns={data.campaigns} />

      {/* Device Breakdown */}
      <DeviceSection devices={data.devices} />

      {/* Keywords */}
      <KeywordSection keywords={data.keywords} />

      {/* Geo */}
      <GeoSection geo={data.geo} />
    </div>
  )
}
