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

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase()
  if (s === 'ENABLED') return <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
  if (s === 'PAUSED') return <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paused</span>
  return <span className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">{status}</span>
}

function MiniTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-[6px] border border-[#E8E4DC]">
      <table className="w-full text-[11px]" style={{ fontFamily: 'Inter, sans-serif' }}>
        <thead>
          <tr className="border-b border-[#F0EEE9] bg-[#FAFAF8]">
            {headers.map((h, i) => (
              <th key={h} className={`px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#AAAAAA] ${i === 0 ? 'text-left' : 'text-right'}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`${i < rows.length - 1 ? 'border-b border-[#F0EEE9]' : ''} hover:bg-[#FAFAF8]`}>
              {row.map((cell, j) => (
                <td key={j} className={`px-3 py-2 ${j === 0 ? 'font-medium text-[#333333] max-w-[180px]' : 'text-right tabular-nums'} ${j === 1 ? 'text-[#C8972D] font-semibold' : 'text-[#555555]'}`}>
                  {j === 0 ? <span className="block truncate" title={String(cell)}>{cell}</span> : cell}
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
  )
}

function CampaignTrendChart({ daily }: { daily: GoogleAdsCampaign['daily'] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const obj = useRef<unknown>(null)
  useEffect(() => {
    if (!ref.current || daily.length === 0) return
    import('chart.js/auto').then(({ default: Chart }) => {
      if (obj.current) (obj.current as { destroy: () => void }).destroy()
      obj.current = new Chart(ref.current!, {
        type: 'line',
        data: {
          labels: daily.map(d => fmtDate(d.date)),
          datasets: [
            { label: 'Clicks', data: daily.map(d => d.clicks), borderColor: 'rgba(200,151,45,0.9)', backgroundColor: 'rgba(200,151,45,0.08)', tension: 0.3, fill: true, pointRadius: daily.length > 20 ? 0 : 3, borderWidth: 2, yAxisID: 'y' },
            { label: 'Conversions', data: daily.map(d => d.conversions), borderColor: 'rgba(16,185,129,0.9)', backgroundColor: 'rgba(16,185,129,0.06)', tension: 0.3, fill: false, pointRadius: daily.length > 20 ? 0 : 3, borderWidth: 2, yAxisID: 'y' },
            { label: 'Impressions', data: daily.map(d => d.impressions), borderColor: 'rgba(99,179,237,0.7)', tension: 0.3, fill: false, pointRadius: 0, borderWidth: 1.5, yAxisID: 'y1' },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: { legend: { display: true, position: 'top', align: 'end', labels: { boxWidth: 9, padding: 12, font: { size: 9, family: 'Inter, sans-serif' }, color: '#888888' } }, tooltip: { backgroundColor: '#111111', titleColor: '#FFF', bodyColor: '#CCC', padding: 8, cornerRadius: 5 } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 9, family: 'Inter, sans-serif' }, color: '#AAAAAA', maxTicksLimit: 8 }, border: { display: false } },
            y: { position: 'left', grid: { color: '#F0EEE9' }, ticks: { font: { size: 9, family: 'Inter, sans-serif' }, color: '#AAAAAA' }, border: { display: false } },
            y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { font: { size: 9, family: 'Inter, sans-serif' }, color: '#99BBDD' }, border: { display: false } },
          },
        },
      })
    })
    return () => { if (obj.current) (obj.current as { destroy: () => void }).destroy() }
  }, [daily])
  if (daily.length === 0) return null
  return <div className="relative h-40"><canvas ref={ref} /></div>
}

function CampaignSection({ campaign, clientName, period }: { campaign: GoogleAdsCampaign; clientName?: string; period?: string }) {
  const [open, setOpen] = useState(false)
  const hasConversions = campaign.conversions > 0

  const kpiTiles = [
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
  ]

  const kwRows = campaign.keywords.map(k => [k.keyword, fmtDollar(k.spend), fmt(k.clicks), fmtPct(k.ctr), fmtDollar(k.avgCpc), ...(k.conversions > 0 ? [fmt(k.conversions)] : [])])
  const kwHeaders = ['Keyword', 'Spend', 'Clicks', 'CTR', 'Avg CPC', ...(campaign.keywords.some(k => k.conversions > 0) ? ['Conv.'] : [])]

  const devRows = campaign.devices.map(d => [d.device, fmtDollar(d.spend), fmt(d.clicks), fmt(d.impressions), ...(d.conversions > 0 ? [fmt(d.conversions)] : [])])
  const devHeaders = ['Device', 'Spend', 'Clicks', 'Impr.', ...(campaign.devices.some(d => d.conversions > 0) ? ['Conv.'] : [])]

  const geoRows = campaign.geo.map(g => [g.city, fmtDollar(g.spend), fmt(g.clicks), ...(g.conversions > 0 ? [fmt(g.conversions)] : [])])
  const geoHeaders = ['City', 'Spend', 'Clicks', ...(campaign.geo.some(g => g.conversions > 0) ? ['Conv.'] : [])]

  const agRows = campaign.adGroups.map(ag => [ag.name, fmtDollar(ag.spend), fmt(ag.clicks), fmtPct(ag.ctr), ...(ag.conversions > 0 ? [fmt(ag.conversions)] : [])])
  const agHeaders = ['Ad Group', 'Spend', 'Clicks', 'CTR', ...(campaign.adGroups.some(ag => ag.conversions > 0) ? ['Conv.'] : [])]

  return (
    <div className="mb-4">
      {/* Campaign header — matches Meta style */}
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
          <span className="hidden sm:flex items-center gap-1.5 text-[11px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <span className="text-[#AAAAAA]">Spend</span>
            <span className="font-bold text-[#C8972D]">{fmtDollar(campaign.spend)}</span>
          </span>
          <StatusBadge status={campaign.status} />
          {hasConversions && (
            <span className="text-[11px] text-emerald-400 font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>{fmt(campaign.conversions)} conv.</span>
          )}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`text-[#888888] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>

      {open && (
        <div className="border border-t-0 border-[#E8E4DC] rounded-b-[8px] bg-[#F8F6F2] p-5 space-y-5">

          {/* KPI tiles */}
          <div className={`grid gap-3 ${kpiTiles.length >= 6 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {kpiTiles.map(tile => (
              <div key={tile.label} className="bg-white border border-[#E8E4DC] rounded-[8px] px-4 py-3">
                <p className="text-[9px] uppercase tracking-[0.14em] text-[#AAAAAA] mb-1.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>{tile.label}</p>
                <p className={`text-[18px] font-bold leading-none ${'gold' in tile && tile.gold ? 'text-[#C8972D]' : 'green' in tile && tile.green ? 'text-emerald-600' : 'text-[#111111]'}`} style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}>{tile.value}</p>
              </div>
            ))}
          </div>

          {/* Daily trend chart */}
          {campaign.daily.length > 0 && (
            <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4">
              <SectionHeader title="Daily Trend" />
              <CampaignTrendChart daily={campaign.daily} />
            </div>
          )}

          {/* Two-column: Ad Groups + Devices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {campaign.adGroups.length > 0 && (
              <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4">
                <SectionHeader title="Ad Groups" />
                <MiniTable headers={agHeaders} rows={agRows} />
              </div>
            )}
            {campaign.devices.length > 0 && (
              <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4">
                <SectionHeader title="Devices" />
                <MiniTable headers={devHeaders} rows={devRows} />
              </div>
            )}
          </div>

          {/* Keywords */}
          {campaign.keywords.length > 0 && (
            <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4">
              <SectionHeader title="Top Keywords" />
              <MiniTable headers={kwHeaders} rows={kwRows} />
            </div>
          )}

          {/* Geo */}
          {campaign.geo.length > 0 && (
            <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4">
              <SectionHeader title="Geographic Breakdown" />
              <MiniTable headers={geoHeaders} rows={geoRows} />
            </div>
          )}

        </div>
      )}
    </div>
  )
}

function AccountTrendChart({ daily }: { daily: GoogleAdsResult['daily'] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const obj = useRef<unknown>(null)
  useEffect(() => {
    if (!ref.current || daily.length === 0) return
    import('chart.js/auto').then(({ default: Chart }) => {
      if (obj.current) (obj.current as { destroy: () => void }).destroy()
      obj.current = new Chart(ref.current!, {
        type: 'line',
        data: {
          labels: daily.map(d => fmtDate(d.date)),
          datasets: [
            { label: 'Clicks', data: daily.map(d => d.clicks), borderColor: 'rgba(200,151,45,0.9)', backgroundColor: 'rgba(200,151,45,0.08)', tension: 0.3, fill: true, pointRadius: daily.length > 20 ? 0 : 3, borderWidth: 2, yAxisID: 'y' },
            { label: 'Impressions', data: daily.map(d => d.impressions), borderColor: 'rgba(99,179,237,0.9)', backgroundColor: 'rgba(99,179,237,0.04)', tension: 0.3, fill: false, pointRadius: 0, borderWidth: 1.5, yAxisID: 'y1' },
            { label: 'Conversions', data: daily.map(d => d.conversions), borderColor: 'rgba(16,185,129,0.9)', tension: 0.3, fill: false, pointRadius: daily.length > 20 ? 0 : 3, borderWidth: 2, yAxisID: 'y' },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: { legend: { display: true, position: 'top', align: 'end', labels: { boxWidth: 10, padding: 14, font: { size: 10, family: 'Inter, sans-serif' }, color: '#888888' } }, tooltip: { backgroundColor: '#111111', titleColor: '#FFF', bodyColor: '#CCC', padding: 10, cornerRadius: 6 } },
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
      <SectionHeader title="Account Daily Trend" />
      <div className="relative h-52"><canvas ref={ref} /></div>
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

export function GoogleAdsSection({ data, clientName, period }: Props) {
  const { summary: s } = data
  const hasConversions = s.conversions > 0
  const hasSis = (s.searchImpressionShare ?? 0) > 0

  const kpiItems = [
    { label: 'Total Spend', value: fmtDollar(s.spend), gold: true },
    { label: 'Clicks', value: fmt(s.clicks) },
    { label: 'Impressions', value: fmt(s.impressions) },
    { label: 'CTR', value: fmtPct(s.ctr) },
    { label: 'Avg CPC', value: fmtDollar(s.avgCpc) },
    ...(hasConversions ? [
      { label: 'Conversions', value: fmt(s.conversions), green: true },
      { label: 'Cost / Conv.', value: fmtDollar(s.costPerConversion) },
    ] : []),
    ...(hasSis ? [{ label: 'Impr. Share', value: fmtPct((s.searchImpressionShare ?? 0) * 100) }] : []),
  ]

  return (
    <div>
      {/* Account KPI bar */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-[8px] mb-5 overflow-hidden">
        <div className="border-b border-[#1E1E1E] px-5 py-3">
          <p className="text-[10px] uppercase tracking-[0.18em]" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: '#C8972D' }}>Account Totals</p>
        </div>
        <div className="grid divide-x divide-[#1E1E1E]" style={{ gridTemplateColumns: `repeat(${kpiItems.length}, minmax(0, 1fr))` }}>
          {kpiItems.map(item => (
            <div key={item.label} className="px-5 py-4">
              <p className="text-[9px] uppercase tracking-[0.14em] mb-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: '#555555' }}>{item.label}</p>
              <p className={`text-[20px] font-bold leading-none ${'gold' in item && item.gold ? 'text-[#C8972D]' : 'green' in item && item.green ? 'text-emerald-400' : 'text-white'}`} style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Snapshot */}
      <AiSummary data={data} clientName={clientName} period={period} />

      {/* Account-level trend */}
      <AccountTrendChart daily={data.daily} />

      {/* Individual campaign sections */}
      <div className="mb-2">
        <div className="flex items-center gap-2.5 mb-3">
          <div style={{ width: '3px', height: '16px', background: '#C8972D', borderRadius: '2px' }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#888888]" style={{ fontFamily: 'Montserrat, sans-serif' }}>Campaigns ({data.campaigns.length})</span>
        </div>
      </div>
      {data.campaigns.map(campaign => (
        <CampaignSection key={campaign.id} campaign={campaign} clientName={clientName} period={period} />
      ))}
    </div>
  )
}
