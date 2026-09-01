'use client'

import { useEffect, useRef, useState } from 'react'
import type { GoogleAdsResult, GoogleAdsCampaign } from '@/lib/google-ads'

type Props = {
  data: GoogleAdsResult
  clientName?: string
  period?: string
}

function fmt(n: number, decimals = 0) {
  if (isNaN(n) || n === 0) return '—'
  return n.toLocaleString('en-NZ', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtDollar(n: number) {
  if (isNaN(n) || n === 0) return '—'
  return `$${n.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtPct(n: number) {
  if (isNaN(n)) return '—'
  return `${n.toFixed(2)}%`
}

type SortKey = 'name' | 'spend' | 'clicks' | 'impressions' | 'ctr' | 'avgCpc' | 'conversions' | 'costPerConversion' | 'conversionRate'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`inline-flex flex-col ml-1 gap-[1px] ${active ? 'text-[#C8972D]' : 'text-[#CCCCCC]'}`}>
      <svg width="6" height="4" viewBox="0 0 6 4" fill="currentColor" className={active && dir === 'asc' ? 'opacity-100' : 'opacity-40'}>
        <path d="M3 0L6 4H0L3 0Z"/>
      </svg>
      <svg width="6" height="4" viewBox="0 0 6 4" fill="currentColor" className={active && dir === 'desc' ? 'opacity-100' : 'opacity-40'}>
        <path d="M3 4L0 0H6L3 4Z"/>
      </svg>
    </span>
  )
}

function MetricCard({ label, value, sub, gold, green }: { label: string; value: string; sub?: string; gold?: boolean; green?: boolean }) {
  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4 hover:border-[#C8972D] hover:shadow-[0_2px_16px_rgba(200,151,45,0.06)] transition-all duration-200">
      <p className="text-[9px] uppercase tracking-[0.15em] text-[#AAAAAA] mb-2" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
        {label}
      </p>
      <p className={`text-[22px] font-bold tracking-tight leading-none ${gold ? 'text-[#C8972D]' : green ? 'text-emerald-600' : 'text-[#111111]'}`} style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}>
        {value}
      </p>
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

function AiSummaryBlurb({ data, clientName, period }: { data: GoogleAdsResult; clientName?: string; period?: string }) {
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
  const fallback = `${clientName ?? 'This account'} spent ${fmtDollar(s.spend)} on Google Ads${period ? ` during ${period}` : ''}, generating ${fmt(s.clicks)} clicks from ${fmt(s.impressions)} impressions at an average CTR of ${fmtPct(s.ctr)}. ${s.conversions > 0 ? `The account recorded ${fmt(s.conversions)} conversions at an average cost of ${fmtDollar(s.costPerConversion)} per conversion.` : ''}`

  return (
    <div className="mt-6 bg-white border border-[#E8E4DC] rounded-[8px] overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#F0EEE9]">
        <div style={{ width: '2px', height: '13px', background: '#C8972D', borderRadius: '1px' }} />
        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#888888]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Performance Snapshot</span>
      </div>
      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-2">
            <div className="h-3 bg-[#F0EEE9] rounded animate-pulse w-full" />
            <div className="h-3 bg-[#F0EEE9] rounded animate-pulse w-5/6" />
          </div>
        ) : (
          <p className="text-[12px] leading-relaxed text-[#444444]" style={{ fontFamily: 'Inter, sans-serif' }}>
            {summary ?? fallback}
          </p>
        )}
      </div>
    </div>
  )
}

export function GoogleAdsSection({ data, clientName, period }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('spend')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...data.campaigns].sort((a, b) => {
    const av = a[sortKey as keyof GoogleAdsCampaign]
    const bv = b[sortKey as keyof GoogleAdsCampaign]
    if (typeof av === 'string' && typeof bv === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
  })

  const { summary: s } = data
  const hasConversions = s.conversions > 0

  const cols: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
    { key: 'name', label: 'Campaign', align: 'left' },
    { key: 'spend', label: 'Spend', align: 'right' },
    { key: 'impressions', label: 'Impr.', align: 'right' },
    { key: 'clicks', label: 'Clicks', align: 'right' },
    { key: 'ctr', label: 'CTR', align: 'right' },
    { key: 'avgCpc', label: 'Avg CPC', align: 'right' },
    ...(hasConversions ? [
      { key: 'conversions' as SortKey, label: 'Conv.', align: 'right' as const },
      { key: 'costPerConversion' as SortKey, label: 'Cost/Conv.', align: 'right' as const },
      { key: 'conversionRate' as SortKey, label: 'Conv. Rate', align: 'right' as const },
    ] : []),
  ]

  function cellValue(c: GoogleAdsCampaign, key: SortKey): string {
    switch (key) {
      case 'name': return c.name
      case 'spend': return fmtDollar(c.spend)
      case 'impressions': return fmt(c.impressions)
      case 'clicks': return fmt(c.clicks)
      case 'ctr': return fmtPct(c.ctr)
      case 'avgCpc': return fmtDollar(c.avgCpc)
      case 'conversions': return fmt(c.conversions)
      case 'costPerConversion': return fmtDollar(c.costPerConversion)
      case 'conversionRate': return fmtPct(c.conversionRate)
    }
  }

  return (
    <div>
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Total Spend" value={fmtDollar(s.spend)} gold />
        <MetricCard label="Clicks" value={fmt(s.clicks)} sub={`${fmtPct(s.ctr)} CTR`} />
        <MetricCard label="Impressions" value={fmt(s.impressions)} />
        <MetricCard label="Avg CPC" value={fmtDollar(s.avgCpc)} />
        {hasConversions && <>
          <MetricCard label="Conversions" value={fmt(s.conversions)} green />
          <MetricCard label="Cost / Conversion" value={fmtDollar(s.costPerConversion)} />
          <MetricCard label="Conversion Rate" value={fmtPct(s.conversionRate)} />
        </>}
      </div>

      {/* Campaign table */}
      <div className="bg-white border border-[#E8E4DC] rounded-[8px] overflow-hidden mb-1">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#F0EEE9]">
          <div style={{ width: '2px', height: '13px', background: '#C8972D', borderRadius: '1px' }} />
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#888888]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Campaign Breakdown</span>
          <span className="ml-auto text-[10px] text-[#AAAAAA]" style={{ fontFamily: 'Inter, sans-serif' }}>{data.campaigns.length} campaigns</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <thead>
              <tr className="border-b border-[#F0EEE9]">
                {cols.map(col => (
                  <th
                    key={col.key}
                    className={`px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#AAAAAA] cursor-pointer select-none whitespace-nowrap hover:text-[#C8972D] transition-colors ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}<SortIcon active={sortKey === col.key} dir={sortDir} />
                  </th>
                ))}
                <th className="px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#AAAAAA] text-left" style={{ fontFamily: 'Montserrat, sans-serif' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => (
                <tr key={c.id} className={`border-b border-[#F0EEE9] hover:bg-[#FAFAF8] transition-colors ${i === sorted.length - 1 ? 'border-b-0' : ''}`}>
                  {cols.map(col => (
                    <td
                      key={col.key}
                      className={`px-3 py-2.5 text-[#333333] ${col.align === 'right' ? 'text-right tabular-nums' : 'text-left'} ${col.key === 'name' ? 'font-medium max-w-[200px]' : ''}`}
                    >
                      {col.key === 'name'
                        ? <span className="block truncate" title={c.name}>{c.name}</span>
                        : cellValue(c, col.key)
                      }
                    </td>
                  ))}
                  <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={cols.length + 1} className="px-4 py-8 text-center text-[#AAAAAA] text-[12px]">No campaign data for this period</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AiSummaryBlurb data={data} clientName={clientName} period={period} />
    </div>
  )
}
