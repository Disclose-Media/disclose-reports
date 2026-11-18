'use client'

import { useEffect, useRef, useState } from 'react'
import type { GoogleAdsResult, GoogleAdsCampaign } from '@/lib/google-ads'
import type { GoogleAdsNativeResult, GoogleAdsSearchTerm, GoogleAdsAd } from '@/lib/google-ads-native'

type Props = { data: GoogleAdsResult | GoogleAdsNativeResult; clientName?: string; period?: string }

function isNative(d: GoogleAdsResult | GoogleAdsNativeResult): d is GoogleAdsNativeResult {
  return 'searchTerms' in d
}

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
function fmtHour(h: number) {
  if (h === 0) return '12am'
  if (h < 12) return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div style={{ width: '3px', height: '16px', background: '#C8972D', borderRadius: '2px' }} />
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#888888]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        {title}{count !== undefined ? ` (${count})` : ''}
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase()
  if (s === 'ENABLED') return <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
  if (s === 'PAUSED') return <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paused</span>
  return <span className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">{status}</span>
}

function QualityBadge({ score }: { score?: number }) {
  if (!score) return <span className="text-[#AAAAAA]">—</span>
  const color = score >= 7 ? 'text-emerald-600' : score >= 4 ? 'text-amber-600' : 'text-red-500'
  return <span className={`font-semibold tabular-nums ${color}`}>{score}/10</span>
}

function PctBar({ value, max, color = '#C8972D' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#F0EEE9] rounded-full overflow-hidden">
        <div style={{ width: `${pct}%`, background: color, borderRadius: '9999px', height: '100%' }} />
      </div>
      <span className="text-[10px] tabular-nums text-[#777777] w-9 text-right">{pct.toFixed(0)}%</span>
    </div>
  )
}

function SortableTable({
  headers,
  rows,
  defaultSort = 1,
  maxRows = 50,
  highlightCol = 1,
}: {
  headers: { label: string; numeric?: boolean; title?: string }[]
  rows: (string | number | React.ReactNode)[][]
  defaultSort?: number
  maxRows?: number
  highlightCol?: number
}) {
  const [sortCol, setSortCol] = useState(defaultSort)
  const [sortAsc, setSortAsc] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortCol], bv = b[sortCol]
    if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av
    return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
  })
  const displayed = showAll ? sorted : sorted.slice(0, maxRows)

  return (
    <div>
      <div className="overflow-x-auto rounded-[6px] border border-[#E8E4DC]">
        <table className="w-full text-[11px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          <thead>
            <tr className="border-b border-[#F0EEE9] bg-[#FAFAF8]">
              {headers.map((h, i) => (
                <th
                  key={i}
                  onClick={() => { if (sortCol === i) setSortAsc(a => !a); else { setSortCol(i); setSortAsc(false) } }}
                  className={`px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#AAAAAA] cursor-pointer hover:text-[#888888] select-none ${i === 0 ? 'text-left' : 'text-right'}`}
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                  title={h.title}
                >
                  {h.label}
                  {sortCol === i && <span className="ml-0.5">{sortAsc ? '↑' : '↓'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((row, i) => (
              <tr key={i} className={`${i < displayed.length - 1 ? 'border-b border-[#F0EEE9]' : ''} hover:bg-[#FAFAF8]`}>
                {row.map((cell, j) => (
                  <td key={j} className={`px-3 py-2 ${j === 0 ? 'font-medium text-[#333333] max-w-[200px]' : 'text-right tabular-nums'} ${j === highlightCol ? 'text-[#C8972D] font-semibold' : 'text-[#555555]'}`}>
                    {j === 0 ? <span className="block truncate" title={typeof cell === 'string' ? cell : undefined}>{cell}</span> : cell}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={headers.length} className="px-3 py-4 text-center text-[#AAAAAA] text-[11px]">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {rows.length > maxRows && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2 text-[10px] text-[#C8972D] hover:underline"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Show all {rows.length} rows
        </button>
      )}
    </div>
  )
}

function LineChart({
  labels,
  datasets,
  height = 160,
  maxTicksX = 10,
}: {
  labels: string[]
  datasets: { label: string; data: number[]; color: string; fill?: boolean; yAxis?: string }[]
  height?: number
  maxTicksX?: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const obj = useRef<unknown>(null)
  useEffect(() => {
    if (!ref.current || labels.length === 0) return
    import('chart.js/auto').then(({ default: Chart }) => {
      if (obj.current) (obj.current as { destroy: () => void }).destroy()
      const hasY1 = datasets.some(d => d.yAxis === 'y1')
      obj.current = new Chart(ref.current!, {
        type: 'line',
        data: {
          labels,
          datasets: datasets.map(d => ({
            label: d.label,
            data: d.data,
            borderColor: d.color,
            backgroundColor: d.fill ? d.color.replace('0.9', '0.08').replace('0.7', '0.05') : 'transparent',
            tension: 0.3,
            fill: d.fill ?? false,
            pointRadius: labels.length > 20 ? 0 : 3,
            borderWidth: 2,
            yAxisID: d.yAxis ?? 'y',
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: true, position: 'top', align: 'end', labels: { boxWidth: 9, padding: 12, font: { size: 9, family: 'Inter, sans-serif' }, color: '#888888' } },
            tooltip: { backgroundColor: '#111111', titleColor: '#FFF', bodyColor: '#CCC', padding: 8, cornerRadius: 5 },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 9, family: 'Inter, sans-serif' }, color: '#AAAAAA', maxTicksLimit: maxTicksX }, border: { display: false } },
            y: { position: 'left', grid: { color: '#F0EEE9' }, ticks: { font: { size: 9, family: 'Inter, sans-serif' }, color: '#AAAAAA' }, border: { display: false } },
            ...(hasY1 ? { y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { font: { size: 9, family: 'Inter, sans-serif' }, color: '#99BBDD' }, border: { display: false } } } : {}),
          },
        },
      })
    })
    return () => { if (obj.current) (obj.current as { destroy: () => void }).destroy() }
  }, [labels, datasets])
  if (labels.length === 0) return null
  return <div className="relative w-full" style={{ height }}><canvas ref={ref} style={{ width: '100%' }} /></div>
}

function BarChart({
  labels,
  values,
  color = '#C8972D',
  height = 140,
  formatValue,
}: {
  labels: string[]
  values: number[]
  color?: string
  height?: number
  formatValue?: (n: number) => string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const obj = useRef<unknown>(null)
  useEffect(() => {
    if (!ref.current || labels.length === 0) return
    import('chart.js/auto').then(({ default: Chart }) => {
      if (obj.current) (obj.current as { destroy: () => void }).destroy()
      obj.current = new Chart(ref.current!, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: color + '33',
            borderColor: color,
            borderWidth: 1.5,
            borderRadius: 3,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#111111', titleColor: '#FFF', bodyColor: '#CCC', padding: 8, cornerRadius: 5,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              callbacks: formatValue ? { label: (ctx: any) => formatValue(ctx.parsed.y ?? 0) } : undefined,
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 9, family: 'Inter, sans-serif' }, color: '#AAAAAA' }, border: { display: false } },
            y: { grid: { color: '#F0EEE9' }, ticks: { font: { size: 9, family: 'Inter, sans-serif' }, color: '#AAAAAA', callback: formatValue ? (v: unknown) => formatValue(Number(v)) : undefined }, border: { display: false } },
          },
        },
      })
    })
    return () => { if (obj.current) (obj.current as { destroy: () => void }).destroy() }
  }, [labels, values, color])
  if (labels.length === 0) return null
  return <div className="relative w-full" style={{ height }}><canvas ref={ref} style={{ width: '100%' }} /></div>
}

function AiSummary({ data, clientName, period }: { data: GoogleAdsResult; clientName?: string; period?: string }) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fetched = useRef(false)
  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    setLoading(true)
    fetch('/api/google-ads-summary', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data, clientName, period }) })
      .then(r => r.json()).then(j => setSummary(j.summary ?? null)).catch(() => null).finally(() => setLoading(false))
  }, [])
  const { summary: s } = data
  const fallback = `${clientName ?? 'This account'} generated ${fmt(s.clicks)} clicks from ${fmt(s.impressions)} impressions at a ${fmtPct(s.ctr)} CTR, investing ${fmtDollar(s.spend)} across Google Ads${period ? ` during ${period}` : ''}.${s.conversions > 0 ? ` The account recorded ${fmt(s.conversions)} conversions at ${fmtDollar(s.costPerConversion)} per conversion.` : ''}`
  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] overflow-hidden mb-5">
      <div className="px-4 py-3 border-b border-[#F0EEE9]"><SectionHeader title="Performance Snapshot" /></div>
      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-2"><div className="h-3 bg-[#F0EEE9] rounded animate-pulse w-full" /><div className="h-3 bg-[#F0EEE9] rounded animate-pulse w-5/6" /></div>
        ) : (
          <p className="text-[12px] leading-relaxed text-[#444444]" style={{ fontFamily: 'Inter, sans-serif' }}>{summary ?? fallback}</p>
        )}
      </div>
    </div>
  )
}

function CampaignSection({ campaign }: { campaign: GoogleAdsCampaign }) {
  const [open, setOpen] = useState(false)
  const hasConversions = campaign.conversions > 0

  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full bg-[#111111] text-white px-5 py-4 flex items-center justify-between hover:bg-[#1C1C1C] transition-colors duration-150"
        style={{ borderRadius: open ? '8px 8px 0 0' : '8px' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div style={{ width: '2px', height: '18px', background: '#C8972D', borderRadius: '1px', flexShrink: 0 }} />
          <span className="font-bold text-sm text-white text-left truncate" style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.01em' }}>
            {campaign.name}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span className="hidden sm:flex items-center gap-4 text-[11px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <span className="flex items-center gap-1.5">
              <span className="text-[#AAAAAA]">Spend</span>
              <span className="font-bold text-[#C8972D]">{fmtDollar(campaign.spend)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#AAAAAA]">Clicks</span>
              <span className="font-semibold text-white">{fmt(campaign.clicks)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#AAAAAA]">CTR</span>
              <span className="font-semibold text-white">{fmtPct(campaign.ctr)}</span>
            </span>
          </span>
          <StatusBadge status={campaign.status} />
          {hasConversions && (
            <span className="text-[11px] text-emerald-400 font-semibold">{fmt(campaign.conversions)} conv.</span>
          )}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`text-[#888888] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>

      {open && (
        <div className="border border-t-0 border-[#E8E4DC] rounded-b-[8px] bg-[#F8F6F2] p-5 space-y-5">
          {/* KPI tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Spend', value: fmtDollar(campaign.spend), gold: true },
              { label: 'Clicks', value: fmt(campaign.clicks) },
              { label: 'Impressions', value: fmt(campaign.impressions) },
              { label: 'CTR', value: fmtPct(campaign.ctr) },
              { label: 'Avg CPC', value: fmtDollar(campaign.avgCpc) },
              ...(hasConversions ? [
                { label: 'Conversions', value: fmt(campaign.conversions), green: true },
                { label: 'Cost / Conv.', value: fmtDollar(campaign.costPerConversion) },
                { label: 'Conv. Rate', value: fmtPct(campaign.conversionRate) },
              ] : []),
            ].map(tile => (
              <div key={tile.label} className="bg-white border border-[#E8E4DC] rounded-[8px] px-4 py-3">
                <p className="text-[9px] uppercase tracking-[0.14em] text-[#AAAAAA] mb-1.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>{tile.label}</p>
                <p className={`text-[18px] font-bold leading-none ${'gold' in tile && tile.gold ? 'text-[#C8972D]' : 'green' in tile && tile.green ? 'text-emerald-600' : 'text-[#111111]'}`} style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}>{tile.value}</p>
              </div>
            ))}
          </div>

          {/* Daily trend */}
          {campaign.daily.length > 0 && (
            <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4">
              <SectionHeader title="Daily Trend" />
              <LineChart
                labels={campaign.daily.map(d => fmtDate(d.date))}
                datasets={[
                  { label: 'Clicks', data: campaign.daily.map(d => d.clicks), color: 'rgba(200,151,45,0.9)', fill: true },
                  { label: 'Conversions', data: campaign.daily.map(d => d.conversions), color: 'rgba(16,185,129,0.9)' },
                  { label: 'Impressions', data: campaign.daily.map(d => d.impressions), color: 'rgba(99,179,237,0.7)', yAxis: 'y1' },
                ]}
              />
            </div>
          )}

          {/* Ad Groups + Devices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {campaign.adGroups.length > 0 && (
              <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4">
                <SectionHeader title="Ad Groups" count={campaign.adGroups.length} />
                <SortableTable
                  headers={[
                    { label: 'Ad Group' },
                    { label: 'Spend', numeric: true },
                    { label: 'Clicks', numeric: true },
                    { label: 'CTR', numeric: true },
                    ...(campaign.adGroups.some(ag => ag.conversions > 0) ? [{ label: 'Conv.', numeric: true }] : []),
                  ]}
                  rows={campaign.adGroups.map(ag => [
                    ag.name,
                    ag.spend,
                    ag.clicks,
                    ag.ctr,
                    ...(campaign.adGroups.some(a => a.conversions > 0) ? [ag.conversions > 0 ? ag.conversions : '—'] : []),
                  ].map((v, i) => i === 0 ? v : i === 1 ? fmtDollar(Number(v)) : i === 2 ? fmt(Number(v)) : i === 3 ? fmtPct(Number(v)) : v))}
                  defaultSort={1}
                  maxRows={10}
                />
              </div>
            )}
            {campaign.devices.length > 0 && (
              <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4">
                <SectionHeader title="Devices" />
                {(() => {
                  const totalSpend = campaign.devices.reduce((s, d) => s + d.spend, 0)
                  return (
                    <div className="space-y-3">
                      {campaign.devices.map(d => (
                        <div key={d.device}>
                          <div className="flex justify-between mb-1">
                            <span className="text-[11px] font-medium text-[#333333]">{d.device}</span>
                            <span className="text-[11px] text-[#C8972D] font-semibold">{fmtDollar(d.spend)}</span>
                          </div>
                          <PctBar value={d.spend} max={totalSpend} />
                          <div className="flex gap-3 mt-1 text-[10px] text-[#888888]">
                            <span>{fmt(d.clicks)} clicks</span>
                            <span>{fmt(d.impressions)} impr.</span>
                            {d.conversions > 0 && <span className="text-emerald-600">{fmt(d.conversions)} conv.</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>

          {/* Keywords */}
          {campaign.keywords.length > 0 && (
            <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4">
              <SectionHeader title="Keywords" count={campaign.keywords.length} />
              <SortableTable
                headers={[
                  { label: 'Keyword' },
                  { label: 'Spend', numeric: true },
                  { label: 'Clicks', numeric: true },
                  { label: 'Impr.', numeric: true },
                  { label: 'CTR', numeric: true },
                  { label: 'Avg CPC', numeric: true },
                  ...(campaign.keywords.some(k => k.conversions > 0) ? [{ label: 'Conv.', numeric: true }] : []),
                ]}
                rows={campaign.keywords.map(k => [
                  k.keyword,
                  k.spend,
                  k.clicks,
                  k.impressions,
                  k.ctr,
                  k.avgCpc,
                  ...(campaign.keywords.some(kk => kk.conversions > 0) ? [k.conversions > 0 ? k.conversions : 0] : []),
                ].map((v, i) => {
                  if (i === 0) return v
                  if (i === 1) return fmtDollar(Number(v))
                  if (i === 2 || i === 3) return fmt(Number(v))
                  if (i === 4) return fmtPct(Number(v))
                  if (i === 5) return fmtDollar(Number(v))
                  return Number(v) > 0 ? fmt(Number(v)) : '—'
                }))}
                defaultSort={1}
                maxRows={15}
              />
            </div>
          )}

          {/* Geo */}
          {campaign.geo.length > 0 && (
            <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4">
              <SectionHeader title="Geographic Breakdown" count={campaign.geo.length} />
              <SortableTable
                headers={[
                  { label: 'Location' },
                  { label: 'Spend', numeric: true },
                  { label: 'Clicks', numeric: true },
                  ...(campaign.geo.some(g => g.conversions > 0) ? [{ label: 'Conv.', numeric: true }] : []),
                ]}
                rows={campaign.geo.map(g => [
                  g.city,
                  g.spend,
                  g.clicks,
                  ...(campaign.geo.some(gg => gg.conversions > 0) ? [g.conversions > 0 ? g.conversions : 0] : []),
                ].map((v, i) => {
                  if (i === 0) return v
                  if (i === 1) return fmtDollar(Number(v))
                  if (i === 2) return fmt(Number(v))
                  return Number(v) > 0 ? fmt(Number(v)) : '—'
                }))}
                defaultSort={1}
                maxRows={10}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AccountKeywords({ data }: { data: GoogleAdsNativeResult }) {
  const kws = data.keywords as (typeof data.keywords[0] & { qualityScore?: number })[]
  if (kws.length === 0) return null
  const hasQS = kws.some(k => k.qualityScore)
  const hasConv = kws.some(k => k.conversions > 0)

  const headers: { label: string; numeric?: boolean; title?: string }[] = [
    { label: 'Keyword' },
    { label: 'Spend', numeric: true },
    { label: 'Clicks', numeric: true },
    { label: 'Impr.', numeric: true },
    { label: 'CTR', numeric: true },
    { label: 'Avg CPC', numeric: true },
    ...(hasQS ? [{ label: 'QS', numeric: true, title: 'Quality Score (1–10)' }] : []),
    ...(hasConv ? [{ label: 'Conv.', numeric: true }] : []),
  ]

  const rows = kws.map(k => {
    const qs = hasQS ? [(k.qualityScore ?? 0)] : []
    const conv = hasConv ? [k.conversions] : []
    return [k.keyword, k.spend, k.clicks, k.impressions, k.ctr, k.avgCpc, ...qs, ...conv]
  })

  const displayRows = rows.map(row =>
    row.map((v, i) => {
      if (i === 0) return v
      if (i === 1) return fmtDollar(Number(v))
      if (i === 2 || i === 3) return fmt(Number(v))
      if (i === 4) return fmtPct(Number(v))
      if (i === 5) return fmtDollar(Number(v))
      if (i === 6 && hasQS) return <QualityBadge score={Number(v) || undefined} />
      return Number(v) > 0 ? fmt(Number(v)) : '—'
    })
  )

  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4 mb-5">
      <SectionHeader title="All Keywords" count={kws.length} />
      <SortableTable headers={headers} rows={displayRows} defaultSort={1} maxRows={20} />
    </div>
  )
}

function AccountAdGroups({ data }: { data: GoogleAdsResult }) {
  const ags = data.adGroups
  if (!ags || ags.length === 0) return null
  const hasConv = ags.some(ag => ag.conversions > 0)

  const headers: { label: string; numeric?: boolean }[] = [
    { label: 'Ad Group' },
    { label: 'Spend', numeric: true },
    { label: 'Clicks', numeric: true },
    { label: 'Impr.', numeric: true },
    { label: 'CTR', numeric: true },
    { label: 'Avg CPC', numeric: true },
    ...(hasConv ? [{ label: 'Conv.', numeric: true }, { label: 'Conv. Rate', numeric: true }] : []),
  ]

  const displayRows = ags.map(ag => [
    ag.name,
    fmtDollar(ag.spend),
    fmt(ag.clicks),
    fmt(ag.impressions),
    fmtPct(ag.ctr),
    fmtDollar(ag.avgCpc),
    ...(hasConv ? [ag.conversions > 0 ? fmt(ag.conversions) : '—', ag.conversions > 0 ? fmtPct(ag.conversionRate) : '—'] : []),
  ])

  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4 mb-5">
      <SectionHeader title="Ad Groups" count={ags.length} />
      <SortableTable headers={headers} rows={displayRows} defaultSort={1} maxRows={20} />
    </div>
  )
}

function AccountDevices({ devices }: { devices: GoogleAdsResult['devices'] }) {
  if (!devices || devices.length === 0) return null
  const totalSpend = devices.reduce((s, d) => s + d.spend, 0)
  const totalClicks = devices.reduce((s, d) => s + d.clicks, 0)
  const totalConvs = devices.reduce((s, d) => s + d.conversions, 0)
  const hasConv = totalConvs > 0
  const deviceColors: Record<string, string> = { Mobile: '#C8972D', Desktop: '#6366F1', Tablet: '#10B981' }

  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4 mb-5">
      <SectionHeader title="Device Breakdown" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Visual bars */}
        <div className="space-y-4">
          {devices.map(d => {
            const color = deviceColors[d.device] ?? '#888888'
            return (
              <div key={d.device}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-[12px] font-semibold text-[#222222]" style={{ fontFamily: 'Montserrat, sans-serif' }}>{d.device}</span>
                  </div>
                  <span className="text-[13px] font-bold text-[#C8972D]">{fmtDollar(d.spend)}</span>
                </div>
                <PctBar value={d.spend} max={totalSpend} color={color} />
                <div className="flex gap-4 mt-1.5 text-[10px] text-[#888888]">
                  <span><span className="font-medium text-[#555555]">{fmt(d.clicks)}</span> clicks ({totalClicks > 0 ? ((d.clicks / totalClicks) * 100).toFixed(0) : 0}%)</span>
                  <span><span className="font-medium text-[#555555]">{fmt(d.impressions)}</span> impr.</span>
                  {hasConv && <span className="text-emerald-600"><span className="font-medium">{d.conversions > 0 ? fmt(d.conversions) : '—'}</span> conv.</span>}
                </div>
              </div>
            )
          })}
        </div>
        {/* Table */}
        <div>
          <SortableTable
            headers={[
              { label: 'Device' },
              { label: 'Spend', numeric: true },
              { label: 'Clicks', numeric: true },
              { label: 'CTR %', numeric: true },
              ...(hasConv ? [{ label: 'Conv.', numeric: true }] : []),
            ]}
            rows={devices.map(d => [
              d.device,
              fmtDollar(d.spend),
              fmt(d.clicks),
              totalClicks > 0 ? `${((d.clicks / totalClicks) * 100).toFixed(0)}%` : '—',
              ...(hasConv ? [d.conversions > 0 ? fmt(d.conversions) : '—'] : []),
            ])}
            defaultSort={1}
            maxRows={10}
          />
        </div>
      </div>
    </div>
  )
}

function HourOfDay({ hourly }: { hourly: NonNullable<GoogleAdsResult['hourly']> }) {
  if (!hourly || hourly.length === 0) return null
  const labels = hourly.map(h => fmtHour(h.hour))
  const spendVals = hourly.map(h => h.spend)
  const clickVals = hourly.map(h => h.clicks)
  const maxSpend = Math.max(...spendVals)
  const bestHour = hourly.reduce((best, h) => h.clicks > best.clicks ? h : best, hourly[0])

  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4 mb-5">
      <div className="flex items-start justify-between mb-4">
        <SectionHeader title="Hour of Day" />
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-[0.12em] text-[#AAAAAA] mb-0.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>Peak hour</p>
          <p className="text-[13px] font-bold text-[#111111]" style={{ fontFamily: 'Montserrat, sans-serif' }}>{fmtHour(bestHour.hour)}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.1em] text-[#BBBBBB] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>Spend by hour</p>
          <BarChart labels={labels} values={spendVals} color="#C8972D" height={130} formatValue={v => fmtDollar(v)} />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.1em] text-[#BBBBBB] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>Clicks by hour</p>
          <BarChart labels={labels} values={clickVals} color="#6366F1" height={130} formatValue={v => fmt(v)} />
        </div>
      </div>
      {/* Heat row */}
      <div className="mt-4">
        <p className="text-[9px] uppercase tracking-[0.1em] text-[#BBBBBB] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>Spend intensity</p>
        <div className="flex gap-0.5">
          {hourly.map(h => {
            const intensity = maxSpend > 0 ? h.spend / maxSpend : 0
            const alpha = Math.round(intensity * 100 + 10)
            return (
              <div
                key={h.hour}
                className="flex-1 rounded-sm"
                style={{ height: '20px', background: `rgba(200,151,45,${alpha / 100})` }}
                title={`${fmtHour(h.hour)}: ${fmtDollar(h.spend)}, ${fmt(h.clicks)} clicks`}
              />
            )
          })}
        </div>
        <div className="flex justify-between mt-1 text-[9px] text-[#BBBBBB]">
          <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
        </div>
      </div>
    </div>
  )
}

function DayOfWeek({ dayOfWeek }: { dayOfWeek: NonNullable<GoogleAdsResult['dayOfWeek']> }) {
  if (!dayOfWeek || dayOfWeek.length === 0) return null
  const labels = dayOfWeek.map(d => d.day.slice(0, 3))
  const spendVals = dayOfWeek.map(d => d.spend)
  const clickVals = dayOfWeek.map(d => d.clicks)
  const bestDay = dayOfWeek.reduce((best, d) => d.clicks > best.clicks ? d : best, dayOfWeek[0])
  const hasConv = dayOfWeek.some(d => d.conversions > 0)

  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4 mb-5">
      <div className="flex items-start justify-between mb-4">
        <SectionHeader title="Day of Week" />
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-[0.12em] text-[#AAAAAA] mb-0.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>Best day</p>
          <p className="text-[13px] font-bold text-[#111111]" style={{ fontFamily: 'Montserrat, sans-serif' }}>{bestDay.day}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BarChart labels={labels} values={spendVals} color="#C8972D" height={130} formatValue={v => fmtDollar(v)} />
        <BarChart labels={labels} values={clickVals} color="#6366F1" height={130} formatValue={v => fmt(v)} />
      </div>
      <div className="mt-4">
        <SortableTable
          headers={[
            { label: 'Day' },
            { label: 'Spend', numeric: true },
            { label: 'Clicks', numeric: true },
            { label: 'Impr.', numeric: true },
            ...(hasConv ? [{ label: 'Conv.', numeric: true }] : []),
          ]}
          rows={dayOfWeek.map(d => [
            d.day,
            fmtDollar(d.spend),
            fmt(d.clicks),
            fmt(d.impressions),
            ...(hasConv ? [d.conversions > 0 ? fmt(d.conversions) : '—'] : []),
          ])}
          defaultSort={1}
          maxRows={7}
        />
      </div>
    </div>
  )
}

function SearchTermsSection({ searchTerms }: { searchTerms: GoogleAdsSearchTerm[] }) {
  const hasConversions = searchTerms.some(s => s.conversions > 0)
  const headers: { label: string; numeric?: boolean }[] = [
    { label: 'Search Term' },
    { label: 'Campaign' },
    { label: 'Spend', numeric: true },
    { label: 'Clicks', numeric: true },
    { label: 'Impr.', numeric: true },
    { label: 'CTR', numeric: true },
    { label: 'Avg CPC', numeric: true },
    ...(hasConversions ? [{ label: 'Conv.', numeric: true }] : []),
  ]
  const displayRows = searchTerms.map(s => [
    s.searchTerm,
    s.campaignName,
    fmtDollar(s.spend),
    fmt(s.clicks),
    fmt(s.impressions),
    fmtPct(s.ctr),
    fmtDollar(s.avgCpc),
    ...(hasConversions ? [s.conversions > 0 ? fmt(s.conversions) : '—'] : []),
  ])

  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4 mb-5">
      <SectionHeader title="Search Terms" count={searchTerms.length} />
      <SortableTable headers={headers} rows={displayRows} defaultSort={2} maxRows={25} highlightCol={2} />
    </div>
  )
}

function AdsSection({ ads }: { ads: GoogleAdsAd[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)
  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4 mb-5">
      <SectionHeader title="Ad Copy" count={ads.length} />
      <div className="space-y-2">
        {ads.map((ad, i) => (
          <div key={i} className="border border-[#F0EEE9] rounded-[6px] overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-[#FAFAF8] transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <StatusBadge status={ad.status} />
                <span className="text-[11px] font-medium text-[#333333] truncate max-w-[300px]">{ad.headlines[0] ?? '(no headline)'}</span>
              </div>
              <div className="flex items-center gap-4 shrink-0 ml-2">
                <span className="text-[11px] text-[#C8972D] font-semibold">{fmtDollar(ad.spend)}</span>
                <span className="text-[11px] text-[#555555]">{fmt(ad.clicks)} clicks</span>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className={`text-[#AAAAAA] transition-transform ${expanded === i ? 'rotate-180' : ''}`}>
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
            {expanded === i && (
              <div className="px-3 pb-3 pt-1 bg-[#FAFAF8] border-t border-[#F0EEE9]">
                <p className="text-[9px] uppercase tracking-[0.1em] text-[#BBBBBB] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {ad.campaignName} › {ad.adGroupName}
                </p>
                {ad.headlines.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[9px] uppercase tracking-[0.1em] text-[#BBBBBB] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Headlines</p>
                    <div className="flex flex-wrap gap-1">
                      {ad.headlines.map((h, j) => (
                        <span key={j} className="text-[11px] bg-white border border-[#E8E4DC] rounded px-2 py-0.5 text-[#111111]">{h}</span>
                      ))}
                    </div>
                  </div>
                )}
                {ad.descriptions.length > 0 && (
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.1em] text-[#BBBBBB] mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Descriptions</p>
                    <div className="space-y-0.5">
                      {ad.descriptions.map((d, j) => (
                        <p key={j} className="text-[11px] text-[#444444]">{d}</p>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-4 mt-2 text-[10px] text-[#888888]">
                  <span>{fmt(ad.impressions)} impr.</span>
                  <span>{fmtPct(ad.ctr)} CTR</span>
                  <span>{fmtDollar(ad.avgCpc)} avg CPC</span>
                  {ad.conversions > 0 && <span className="text-emerald-600">{fmt(ad.conversions)} conv.</span>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function AccountTrendChart({ data }: { data: GoogleAdsResult }) {
  const daily = data.daily
  if (!daily || daily.length === 0) return null
  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4 mb-5">
      <SectionHeader title="Account Daily Trend" />
      <LineChart
        labels={daily.map(d => fmtDate(d.date))}
        datasets={[
          { label: 'Clicks', data: daily.map(d => d.clicks), color: 'rgba(200,151,45,0.9)', fill: true },
          { label: 'Impressions', data: daily.map(d => d.impressions), color: 'rgba(99,179,237,0.9)', yAxis: 'y1' },
          { label: 'Conversions', data: daily.map(d => d.conversions), color: 'rgba(16,185,129,0.9)' },
        ]}
        height={200}
        maxTicksX={10}
      />
    </div>
  )
}

export function GoogleAdsSection({ data, clientName, period }: Props) {
  const { summary: s } = data
  const hasConversions = s.conversions > 0
  const hasSis = (s.searchImpressionShare ?? 0) > 0

  const kpiItems = [
    { label: 'Total Spend', value: fmtDollar(s.spend), sub: null, gold: true },
    { label: 'Clicks', value: fmt(s.clicks), sub: null },
    { label: 'Impressions', value: fmt(s.impressions), sub: null },
    { label: 'CTR', value: fmtPct(s.ctr), sub: null },
    { label: 'Avg CPC', value: fmtDollar(s.avgCpc), sub: null },
    ...(hasConversions ? [
      { label: 'Conversions', value: fmt(s.conversions), sub: null, green: true },
      { label: 'Cost / Conv.', value: fmtDollar(s.costPerConversion), sub: null },
      { label: 'Conv. Rate', value: fmtPct(s.conversionRate), sub: null },
    ] : []),
    ...(hasSis ? [{ label: 'Impr. Share', value: fmtPct((s.searchImpressionShare ?? 0) * 100), sub: null }] : []),
  ]

  return (
    <div>
      {/* Account KPI bar */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-[8px] mb-5 overflow-hidden">
        <div className="border-b border-[#1E1E1E] px-5 py-3">
          <p className="text-[10px] uppercase tracking-[0.18em]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: '#C8972D' }}>Account Totals</p>
        </div>
        <div className="flex flex-wrap">
          {kpiItems.map((item, idx) => (
            <div key={item.label} className={`px-5 py-4 ${idx < kpiItems.length - 1 ? 'border-r border-[#1E1E1E]' : ''}`} style={{ minWidth: 0 }}>
              <p className="text-[9px] uppercase tracking-[0.14em] mb-1 whitespace-nowrap" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: '#555555' }}>{item.label}</p>
              <p className={`text-[20px] font-bold leading-none whitespace-nowrap ${'gold' in item && item.gold ? 'text-[#C8972D]' : 'green' in item && item.green ? 'text-emerald-400' : 'text-white'}`} style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Snapshot */}
      <AiSummary data={data} clientName={clientName} period={period} />

      {/* Account-level trend */}
      <AccountTrendChart data={data} />

      {/* Devices */}
      <AccountDevices devices={data.devices} />

      {/* Hour of day + Day of week */}
      {data.hourly && data.hourly.length > 0 && <HourOfDay hourly={data.hourly} />}
      {data.dayOfWeek && data.dayOfWeek.length > 0 && <DayOfWeek dayOfWeek={data.dayOfWeek} />}

      {/* Account-level keywords (native only) */}
      {isNative(data) && <AccountKeywords data={data} />}

      {/* Account-level ad groups */}
      <AccountAdGroups data={data} />

      {/* Campaigns */}
      <div className="mb-3">
        <div className="flex items-center gap-2.5 mb-3">
          <div style={{ width: '3px', height: '16px', background: '#C8972D', borderRadius: '2px' }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#888888]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Campaigns ({data.campaigns.length}) — click to expand
          </span>
        </div>
      </div>
      {data.campaigns.map(campaign => (
        <CampaignSection key={campaign.id} campaign={campaign} />
      ))}

      {/* Search Terms (native only) */}
      {isNative(data) && data.searchTerms.length > 0 && (
        <SearchTermsSection searchTerms={data.searchTerms} />
      )}

      {/* Ad Copy (native only) */}
      {isNative(data) && data.ads.length > 0 && (
        <AdsSection ads={data.ads} />
      )}
    </div>
  )
}
