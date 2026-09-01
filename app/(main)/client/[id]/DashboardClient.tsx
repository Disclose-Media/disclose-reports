'use client'

import { useEffect, useRef, useState } from 'react'
import type { Client } from '@/lib/clients'
import type { CampaignInsight, AdInsight, IgInsightsSummary } from '@/lib/meta'
import type { WindsorOrganicResult, WindsorInstagramResult, WindsorPost, WindsorIgAudienceData, WindsorFbAudienceData } from '@/lib/windsor'
import { OrganicSection } from '@/components/OrganicSection'
import { ContentTable } from '@/components/ContentTable'

type Props = {
  client: Client
  summary: Record<string, string> | null
  campaigns: CampaignInsight[]
  ads: AdInsight[]
  thumbnails: Record<string, string>
  period: string
  windsorOrganic?: WindsorOrganicResult | null
  igInsights?: IgInsightsSummary | null
  windsorInstagram?: WindsorInstagramResult | null
  igAudience?: WindsorIgAudienceData | null
  fbAudience?: WindsorFbAudienceData | null
  posts?: WindsorPost[]
}

function fmt(n: string | number | undefined, decimals = 0) {
  const num = parseFloat(String(n || '0'))
  if (isNaN(num)) return '—'
  return num.toLocaleString('en-NZ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function fmtDollar(n: string | number | undefined) {
  const num = parseFloat(String(n || '0'))
  if (isNaN(num) || num === 0) return '—'
  return `$${num.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function KpiCard({
  label,
  value,
  gold,
  green,
  sub,
}: {
  label: string
  value: string
  gold?: boolean
  green?: boolean
  sub?: string
}) {
  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-4 hover:border-[#C8972D] hover:shadow-[0_2px_16px_rgba(200,151,45,0.06)] transition-all duration-200">
      <p
        className="text-[9px] uppercase tracking-[0.15em] text-[#AAAAAA] mb-2"
        style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}
      >
        {label}
      </p>
      <p
        className={`text-[22px] font-bold tracking-tight leading-none ${
          gold ? 'text-[#C8972D]' : green ? 'text-emerald-600' : 'text-[#111111]'
        }`}
        style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-[#AAAAAA] mt-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function SummaryBar({ items, period }: { items: { label: string; value: string; gold?: boolean; green?: boolean }[]; period: string }) {
  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] mb-8 overflow-hidden">
      {/* Header */}
      <div className="bg-[#111111] px-6 py-3 flex items-center justify-between">
        <p
          className="text-[10px] uppercase tracking-[0.18em]"
          style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: '#C8972D' }}
        >
          Account Overview
        </p>
        <span className="text-[10px] text-[#888888]" style={{ fontFamily: 'Inter, sans-serif' }}>
          {period}
        </span>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-[#E8E4DC] sm:divide-y-0">
        {items.map((item, i) => (
          <div key={item.label} className={`px-5 py-4 ${i >= 4 ? 'border-t border-[#E8E4DC]' : ''}`}>
            <p
              className="text-[9px] uppercase tracking-[0.15em] text-[#AAAAAA] mb-1.5"
              style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}
            >
              {item.label}
            </p>
            <p
              className={`text-[18px] font-bold leading-none ${
                item.gold ? 'text-[#C8972D]' : item.green ? 'text-emerald-600' : 'text-[#111111]'
              }`}
              style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

type Objective = 'auto' | 'reach' | 'traffic' | 'leads'
type EffectiveObjective = 'reach' | 'traffic' | 'leads'

function detectObjective(campaign: CampaignInsight): EffectiveObjective {
  const leads = parseInt(campaign.lead || '0') || 0
  const lpv = campaign.results?.value ? parseInt(campaign.results.value) : 0
  if (leads > 0) return 'leads'
  if (lpv > 0) return 'traffic'
  return 'reach'
}

type SortKey = 'name' | 'spend' | 'reach' | 'impressions' | 'clicks' | 'lpv' | 'cplpv' | 'leads' | 'cpl' | 'freq' | 'ctr' | 'cpm' | 'cpc'
type SortDir = 'asc' | 'desc'

function adValue(ad: AdInsight, key: SortKey): number | string {
  switch (key) {
    case 'name': return ad.name
    case 'spend': return parseFloat(ad.amount_spent || '0')
    case 'reach': return parseInt(ad.reach || '0')
    case 'impressions': return parseInt(ad.impressions || '0')
    case 'clicks': return parseInt(ad.clicks || '0')
    case 'lpv': { const m = ad.results?.value?.match(/^(\d+)/); return m ? parseInt(m[1]) : 0 }
    case 'cplpv': { const m = ad.cost_per_result?.value?.match(/[\d.]+/); return m ? parseFloat(m[0]) : 0 }
    case 'leads': return parseInt(ad.lead || '0') || 0
    case 'cpl': { const m = ad.cost_per_action_type_lead?.match(/[\d.]+/); return m ? parseFloat(m[0]) : 0 }
    case 'freq': { const i = parseInt(ad.impressions || '0'); const r = parseInt(ad.reach || '0'); return r > 0 ? i / r : 0 }
    case 'ctr': return parseFloat(ad.ctr || '0')
    case 'cpm': return parseFloat(ad.cpm || '0')
    case 'cpc': return parseFloat(ad.cpc || '0')
  }
}

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

const OBJECTIVE_LABELS: Record<EffectiveObjective, string> = {
  reach: 'Reach & Awareness',
  traffic: 'Traffic & LPV',
  leads: 'Lead Generation',
}

function ObjectiveBadge({ obj }: { obj: EffectiveObjective }) {
  const colors: Record<EffectiveObjective, string> = {
    reach: 'bg-blue-900/30 text-blue-300 border-blue-900/40',
    traffic: 'bg-amber-900/30 text-amber-300 border-amber-900/40',
    leads: 'bg-emerald-900/30 text-emerald-400 border-emerald-900/40',
  }
  return (
    <span className={`text-[10px] border px-2.5 py-1 rounded-full ${colors[obj]}`} style={{ fontFamily: 'Inter, sans-serif' }}>
      {OBJECTIVE_LABELS[obj]}
    </span>
  )
}

function CampaignSection({ campaign, ads, thumbnails }: { campaign: CampaignInsight; ads: AdInsight[]; thumbnails: Record<string, string> }) {
  const [open, setOpen] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('spend')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [objectiveOverride, setObjectiveOverride] = useState<Objective>('auto')

  const autoObj = detectObjective(campaign)
  const obj: EffectiveObjective = objectiveOverride === 'auto' ? autoObj : objectiveOverride

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sortedAds = [...ads].sort((a, b) => {
    const av = adValue(a, sortKey)
    const bv = adValue(b, sortKey)
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    }
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
  })
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartObj = useRef<unknown>(null)

  const spend = parseFloat(campaign.amount_spent || '0')
  const leads = parseInt(campaign.lead || '0') || 0
  const lpvMatch = campaign.results?.value?.match(/^(\d+)/)
  const lpv = lpvMatch ? parseInt(lpvMatch[1]) : 0
  const cplpvMatch = campaign.cost_per_result?.value?.match(/[\d.]+/)
  const cplpv = cplpvMatch ? parseFloat(cplpvMatch[0]) : 0
  const cplMatch = campaign.cost_per_action_type_lead?.match(/[\d.]+/)
  const cpl = cplMatch ? parseFloat(cplMatch[0]) : 0
  const impressions = parseInt(campaign.impressions || '0')
  const reach = parseInt(campaign.reach || '0')
  const freq = impressions > 0 && reach > 0 ? impressions / reach : 0
  const ctr = parseFloat(campaign.ctr || '0')
  const cpm = parseFloat(campaign.cpm || '0')
  const cpc = parseFloat(campaign.cpc || '0')

  // KPI cards per objective
  const kpiRow2: { label: string; value: string; gold?: boolean; green?: boolean }[] =
    obj === 'leads'
      ? [
          { label: 'Landing Page Views', value: lpv > 0 ? fmt(lpv) : '—' },
          { label: 'Cost Per LPV', value: cplpv > 0 ? `$${cplpv.toFixed(2)}` : '—' },
          { label: 'Leads', value: leads > 0 ? String(leads) : '—', green: leads > 0 },
          { label: 'Cost Per Lead', value: cpl > 0 ? fmtDollar(cpl) : '—', gold: cpl > 0 },
        ]
      : obj === 'traffic'
      ? [
          { label: 'CTR', value: `${ctr.toFixed(2)}%` },
          { label: 'Landing Page Views', value: lpv > 0 ? fmt(lpv) : '—' },
          { label: 'Cost Per LPV', value: cplpv > 0 ? `$${cplpv.toFixed(2)}` : '—' },
          { label: 'CPC', value: cpc > 0 ? `$${cpc.toFixed(2)}` : '—' },
        ]
      : [
          { label: 'CPM', value: cpm > 0 ? `$${cpm.toFixed(2)}` : '—' },
          { label: 'Frequency', value: freq > 0 ? freq.toFixed(2) : '—' },
          { label: 'CTR', value: `${ctr.toFixed(2)}%` },
          { label: 'CPC', value: cpc > 0 ? `$${cpc.toFixed(2)}` : '—' },
        ]

  // Table columns per objective
  const varCols: { label: string; key: SortKey }[] =
    obj === 'leads'
      ? [
          { label: 'CTR', key: 'ctr' },
          { label: 'LPV', key: 'lpv' },
          { label: 'Cost/LPV', key: 'cplpv' },
          { label: 'Leads', key: 'leads' },
          { label: 'CPL', key: 'cpl' },
        ]
      : obj === 'traffic'
      ? [
          { label: 'CTR', key: 'ctr' },
          { label: 'LPV', key: 'lpv' },
          { label: 'Cost/LPV', key: 'cplpv' },
          { label: 'CPM', key: 'cpm' },
          { label: 'CPC', key: 'cpc' },
        ]
      : [
          { label: 'Frequency', key: 'freq' },
          { label: 'CTR', key: 'ctr' },
          { label: 'CPM', key: 'cpm' },
          { label: 'CPC', key: 'cpc' },
        ]

  useEffect(() => {
    if (!open || !chartRef.current || ads.length === 0) return
    import('chart.js/auto').then(({ default: Chart }) => {
      if (chartObj.current) (chartObj.current as { destroy: () => void }).destroy()

      const secondaryDataset =
        obj === 'leads'
          ? { label: 'Leads', data: ads.map((a) => parseInt(a.lead || '0') || 0), backgroundColor: 'rgba(16,185,129,0.75)', borderRadius: 4, yAxisID: 'y1' }
          : obj === 'traffic'
          ? { label: 'LPVs', data: ads.map((a) => { const m = a.results?.value?.match(/^(\d+)/); return m ? parseInt(m[1]) : 0 }), backgroundColor: 'rgba(99,179,237,0.75)', borderRadius: 4, yAxisID: 'y1' }
          : { label: 'Reach', data: ads.map((a) => parseInt(a.reach || '0')), backgroundColor: 'rgba(99,179,237,0.75)', borderRadius: 4, yAxisID: 'y1' }

      const y1Label = obj === 'leads' ? 'Leads' : obj === 'traffic' ? 'LPVs' : 'Reach'

      chartObj.current = new Chart(chartRef.current!, {
        type: 'bar',
        data: {
          labels: ads.map((a) => a.name.length > 28 ? a.name.slice(0, 28) + '…' : a.name),
          datasets: [
            { label: 'Spend (NZD)', data: ads.map((a) => parseFloat(a.amount_spent || '0')), backgroundColor: 'rgba(200,151,45,0.85)', borderRadius: 4, yAxisID: 'y' },
            secondaryDataset,
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'top', labels: { font: { size: 10, family: 'Inter, sans-serif' }, boxWidth: 10, padding: 16, color: '#888888' } },
          },
          scales: {
            x: { ticks: { color: '#AAAAAA', font: { size: 9, family: 'Inter, sans-serif' }, maxRotation: 30 }, grid: { color: 'rgba(0,0,0,0.04)' }, border: { color: '#E8E4DC' } },
            y: { ticks: { color: '#AAAAAA', font: { size: 9, family: 'Inter, sans-serif' }, callback: (v) => '$' + v }, grid: { color: 'rgba(0,0,0,0.04)' }, border: { color: '#E8E4DC' }, title: { display: true, text: 'Spend', color: '#AAAAAA', font: { size: 9, family: 'Inter, sans-serif' } } },
            y1: { position: 'right', ticks: { color: '#AAAAAA', font: { size: 9, family: 'Inter, sans-serif' } }, grid: { display: false }, border: { color: '#E8E4DC' }, title: { display: true, text: y1Label, color: '#AAAAAA', font: { size: 9, family: 'Inter, sans-serif' } } },
          },
        },
      })
    })
    return () => { if (chartObj.current) (chartObj.current as { destroy: () => void }).destroy() }
  }, [open, ads, obj])

  return (
    <div className="mb-6">
      {/* Campaign header */}
      <button
        onClick={() => setOpen((o) => !o)}
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
            <span className="font-bold text-[#C8972D]">{fmtDollar(spend)}</span>
          </span>
          <ObjectiveBadge obj={obj} />
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`text-[#888888] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>

      {open && (
        <div className="border border-t-0 border-[#E8E4DC] rounded-b-[8px] bg-[#F8F6F2] p-5">

          {/* Objective selector */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-[9px] uppercase tracking-[0.15em] text-[#AAAAAA] font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Showing metrics for:
            </p>
            <div className="flex items-center gap-1.5">
              {(['auto', 'reach', 'traffic', 'leads'] as Objective[]).map((o) => (
                <button
                  key={o}
                  onClick={() => setObjectiveOverride(o)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${objectiveOverride === o ? 'bg-[#C8972D] text-white border-[#C8972D]' : 'bg-white text-[#888888] border-[#E8E4DC] hover:border-[#C8972D] hover:text-[#C8972D]'}`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {o === 'auto' ? `Auto (${OBJECTIVE_LABELS[autoObj]})` : OBJECTIVE_LABELS[o]}
                </button>
              ))}
            </div>
          </div>

          {/* KPI row 1 — always the same */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <KpiCard label="Amount Spent" value={fmtDollar(spend)} gold />
            <KpiCard label="Reach" value={fmt(campaign.reach)} />
            <KpiCard label="Impressions" value={fmt(campaign.impressions)} />
            <KpiCard label="Clicks" value={fmt(campaign.clicks)} />
          </div>

          {/* KPI row 2 — objective-specific */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {kpiRow2.map((k) => (
              <KpiCard key={k.label} label={k.label} value={k.value} gold={k.gold} green={k.green} />
            ))}
          </div>

          {/* Ad breakdown table */}
          {ads.length > 0 && (
            <div className="bg-white border border-[#E8E4DC] rounded-[8px] overflow-hidden mb-6">
              <div className="border-b border-[#E8E4DC] px-5 py-3 flex items-center gap-2.5 bg-[#F8F6F2]">
                <div style={{ width: '2px', height: '12px', background: '#C8972D', borderRadius: '1px' }} />
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#888888]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Ad Performance
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E8E4DC]">
                      <th className="py-3 pl-4 pr-2 bg-white w-14" />
                      {([
                        { label: 'Ad', key: 'name' as SortKey, align: 'left' },
                        { label: 'Spend', key: 'spend' as SortKey, align: 'right' },
                        { label: 'Reach', key: 'reach' as SortKey, align: 'right' },
                        { label: 'Impressions', key: 'impressions' as SortKey, align: 'right' },
                        { label: 'Clicks', key: 'clicks' as SortKey, align: 'right' },
                        ...varCols.map((c) => ({ ...c, align: 'right' as const })),
                      ]).map((col) => (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          className={`py-3 px-4 text-[9px] font-bold uppercase tracking-[0.12em] whitespace-nowrap bg-white cursor-pointer select-none hover:text-[#C8972D] transition-colors ${col.align === 'left' ? 'text-left' : 'text-right'} ${sortKey === col.key ? 'text-[#C8972D]' : 'text-[#AAAAAA]'}`}
                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                          <span className="inline-flex items-center gap-0.5">
                            {col.label}
                            <SortIcon active={sortKey === col.key} dir={sortDir} />
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAds.map((ad, idx) => {
                      const adLpvMatch = ad.results?.value?.match(/^(\d+)/)
                      const adLpv = adLpvMatch ? parseInt(adLpvMatch[1]) : 0
                      const adCplpvMatch = ad.cost_per_result?.value?.match(/[\d.]+/)
                      const adCplpv = adCplpvMatch ? parseFloat(adCplpvMatch[0]) : 0
                      const adLeads = parseInt(ad.lead || '0') || 0
                      const adCplMatch = ad.cost_per_action_type_lead?.match(/[\d.]+/)
                      const adCpl = adCplMatch ? parseFloat(adCplMatch[0]) : 0
                      const adSpend = parseFloat(ad.amount_spent || '0')
                      const adImpr = parseInt(ad.impressions || '0')
                      const adReach = parseInt(ad.reach || '0')
                      const adFreq = adImpr > 0 && adReach > 0 ? adImpr / adReach : 0
                      const adCtr = parseFloat(ad.ctr || '0')
                      const adCpm = parseFloat(ad.cpm || '0')
                      const adCpc = parseFloat(ad.cpc || '0')

                      const varCells = varCols.map((col) => {
                        switch (col.key) {
                          case 'lpv': return <td key="lpv" className="py-3 px-4 text-right text-xs text-[#444444]" style={{ fontFamily: 'Inter, sans-serif' }}>{adLpv > 0 ? fmt(adLpv) : '—'}</td>
                          case 'cplpv': return <td key="cplpv" className={`py-3 px-4 text-right text-xs font-medium ${adCplpv > 0 && adCplpv < 0.75 ? 'text-emerald-600' : adCplpv > 1 ? 'text-amber-600' : 'text-[#444444]'}`} style={{ fontFamily: 'Inter, sans-serif' }}>{adCplpv > 0 ? `$${adCplpv.toFixed(2)}` : '—'}</td>
                          case 'leads': return <td key="leads" className={`py-3 px-4 text-right text-xs font-bold ${adLeads > 0 ? 'text-emerald-600' : 'text-[#CCCCCC]'}`} style={{ fontFamily: 'Inter, sans-serif' }}>{adLeads > 0 ? adLeads : '—'}</td>
                          case 'cpl': return <td key="cpl" className={`py-3 px-4 text-right text-xs font-medium ${adCpl > 0 ? 'text-[#C8972D]' : 'text-[#CCCCCC]'}`} style={{ fontFamily: 'Inter, sans-serif' }}>{adCpl > 0 ? `$${adCpl.toFixed(2)}` : '—'}</td>
                          case 'freq': return <td key="freq" className="py-3 px-4 text-right text-xs text-[#444444]" style={{ fontFamily: 'Inter, sans-serif' }}>{adFreq > 0 ? adFreq.toFixed(2) : '—'}</td>
                          case 'ctr': return <td key="ctr" className={`py-3 px-4 text-right text-xs font-medium ${adCtr >= 2 ? 'text-emerald-600' : adCtr < 1 ? 'text-amber-600' : 'text-[#444444]'}`} style={{ fontFamily: 'Inter, sans-serif' }}>{`${adCtr.toFixed(2)}%`}</td>
                          case 'cpm': return <td key="cpm" className="py-3 px-4 text-right text-xs text-[#444444]" style={{ fontFamily: 'Inter, sans-serif' }}>{adCpm > 0 ? `$${adCpm.toFixed(2)}` : '—'}</td>
                          case 'cpc': return <td key="cpc" className="py-3 px-4 text-right text-xs text-[#444444]" style={{ fontFamily: 'Inter, sans-serif' }}>{adCpc > 0 ? `$${adCpc.toFixed(2)}` : '—'}</td>
                          default: return null
                        }
                      })

                      return (
                        <tr key={ad.id} className={`border-b border-[#F0EDE8] hover:bg-[#FBF9F5] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}`}>
                          <td className="pl-4 pr-2 py-2 w-14">
                            {thumbnails[ad.id] ? (
                              <div className="w-10 h-10 rounded-[4px] overflow-hidden border border-[#E8E4DC] bg-[#F8F6F2] shrink-0">
                                <img src={thumbnails[ad.id]} alt="" className="w-full h-full object-cover" loading="lazy" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-[4px] border border-[#E8E4DC] bg-[#F0EDE8] flex items-center justify-center shrink-0">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                  <rect x="1" y="3" width="12" height="8" rx="1" stroke="#CCCCCC" strokeWidth="1.2"/>
                                  <circle cx="4.5" cy="6" r="1" fill="#CCCCCC"/>
                                  <path d="M1 9.5l3-2.5 2.5 2 2.5-2.5 3 3" stroke="#CCCCCC" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#C8972D] text-xs max-w-[200px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <span className="truncate block">{ad.name}</span>
                          </td>
                          <td className="py-3 px-4 text-right text-xs font-semibold text-[#111111]" style={{ fontFamily: 'Inter, sans-serif' }}>${adSpend.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-xs text-[#444444]" style={{ fontFamily: 'Inter, sans-serif' }}>{fmt(ad.reach)}</td>
                          <td className="py-3 px-4 text-right text-xs text-[#444444]" style={{ fontFamily: 'Inter, sans-serif' }}>{fmt(ad.impressions)}</td>
                          <td className="py-3 px-4 text-right text-xs text-[#444444]" style={{ fontFamily: 'Inter, sans-serif' }}>{fmt(ad.clicks)}</td>
                          {varCells}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Chart */}
          {ads.length > 0 && (
            <div className="bg-white border border-[#E8E4DC] rounded-[8px] p-5 mb-6">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#888888] mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Ad Performance Chart
              </p>
              <div className="relative h-52">
                <canvas ref={chartRef} />
              </div>
            </div>
          )}

          {/* Campaign Analysis */}
          <CampaignSummary campaign={campaign} ads={ads} />
        </div>
      )}
    </div>
  )
}

function buildNarrative(campaign: CampaignInsight, ads: AdInsight[]): { overview: string; highlights: string; opportunities: string; recommendation: string } {
  const leads = parseInt(campaign.lead || '0') || 0
  const lpvMatch = campaign.results?.value?.match(/^(\d+)/)
  const lpv = lpvMatch ? parseInt(lpvMatch[1]) : 0
  const cplMatch = campaign.cost_per_action_type_lead?.match(/[\d.]+/)
  const cpl = cplMatch ? parseFloat(cplMatch[0]) : 0
  const ctr = parseFloat(campaign.ctr || '0')
  const cpm = parseFloat(campaign.cpm || '0')
  const spend = parseFloat(campaign.amount_spent || '0')
  const impressions = parseInt(campaign.impressions || '0')
  const reach = parseInt(campaign.reach || '0')
  const freq = impressions > 0 && reach > 0 ? impressions / reach : 0

  const topAdByLeads = [...ads].sort((a, b) => (parseInt(b.lead || '0') || 0) - (parseInt(a.lead || '0') || 0))[0]
  const topAdByCtr = [...ads].sort((a, b) => parseFloat(b.ctr || '0') - parseFloat(a.ctr || '0'))[0]
  const topAdBySpend = [...ads].sort((a, b) => parseFloat(b.amount_spent || '0') - parseFloat(a.amount_spent || '0'))[0]

  // Overview paragraph
  let overview = ''
  if (leads > 0) {
    overview = `This campaign delivered ${leads} lead${leads > 1 ? 's' : ''} at an average cost of $${cpl.toFixed(2)} per lead, with a total investment of $${spend.toFixed(2)}. `
    if (lpv > 0) {
      const convRate = ((leads / lpv) * 100).toFixed(1)
      overview += `Of the ${lpv} people who visited the landing page, ${convRate}% converted into leads — ${parseFloat(convRate) > 10 ? 'a strong result that reflects well on both the ad targeting and the landing page experience' : 'a solid foundation that gives us clear room to grow conversion further'}.`
    }
  } else if (lpv > 0) {
    overview = `This campaign drove ${lpv} landing page views from a $${spend.toFixed(2)} investment, building meaningful pipeline awareness. The traffic quality and volume provide a strong base to build on.`
  } else {
    overview = `This campaign reached ${reach > 0 ? reach.toLocaleString('en-NZ') : 'a targeted audience'} people with ${impressions > 0 ? impressions.toLocaleString('en-NZ') + ' impressions' : 'consistent exposure'} over the reporting period, investing $${spend.toFixed(2)} in brand reach and awareness.`
  }

  // Highlights paragraph
  const highlightParts: string[] = []
  if (ctr >= 3) highlightParts.push(`Creative engagement is outstanding — a ${ctr.toFixed(2)}% click-through rate is more than double the Meta average, confirming the ad content is genuinely connecting with your audience`)
  else if (ctr >= 1.5) highlightParts.push(`A ${ctr.toFixed(2)}% click-through rate demonstrates solid audience engagement, sitting above the typical Meta benchmark`)
  else if (ctr > 0) highlightParts.push(`The campaign is generating consistent clicks at a ${ctr.toFixed(2)}% CTR, with good opportunity to amplify this through creative testing`)

  if (cpm > 0 && cpm < 10) highlightParts.push(`audience reach is highly cost-efficient at just $${cpm.toFixed(2)} CPM`)
  else if (cpm >= 10 && cpm < 20) highlightParts.push(`at $${cpm.toFixed(2)} CPM, the campaign is reaching audiences at a competitive rate for the NZ market`)
  else if (cpm >= 20) highlightParts.push(`CPM of $${cpm.toFixed(2)} reflects a competitive auction environment — refining audience targeting could unlock further efficiencies`)

  if (topAdByLeads && parseInt(topAdByLeads.lead || '0') > 0) {
    highlightParts.push(`"${topAdByLeads.name}" is the clear standout ad, accounting for ${topAdByLeads.lead} lead${parseInt(topAdByLeads.lead || '0') > 1 ? 's' : ''} and demonstrating exactly the kind of creative that performs`)
  } else if (topAdByCtr && ads.length > 1) {
    highlightParts.push(`"${topAdByCtr.name}" is leading on engagement with a ${parseFloat(topAdByCtr.ctr || '0').toFixed(2)}% CTR`)
  }

  const highlights = highlightParts.length > 0
    ? highlightParts[0].charAt(0).toUpperCase() + highlightParts[0].slice(1) + (highlightParts.length > 1 ? ', and ' + highlightParts.slice(1).join('. ') : '') + '.'
    : 'The campaign is delivering consistent results across key performance indicators.'

  // Opportunities paragraph
  const oppParts: string[] = []
  if (freq > 4) oppParts.push(`The audience frequency of ${freq.toFixed(1)}x is an opportunity to broaden reach — introducing new audience segments or refreshing creatives will keep engagement strong and unlock new potential customers`)
  else if (freq > 0) oppParts.push(`Audience frequency is healthy at ${freq.toFixed(1)}x, meaning there is still meaningful headroom to increase reach before fatigue becomes a factor`)

  if (leads === 0 && lpv > 0) oppParts.push(`with ${lpv} people already visiting the landing page, a conversion rate optimisation test — adjusting the headline, form, or call to action — could turn this existing traffic into qualified leads without additional spend`)

  if (ctr > 0 && ctr < 1.5 && ads.length > 1) oppParts.push(`testing a new creative direction against the current top performer is a low-risk, high-upside move that could meaningfully lift CTR and reduce cost per result`)

  if (topAdBySpend && ads.length > 1) {
    const topSpend = parseFloat(topAdBySpend.amount_spent || '0')
    const topLeads = parseInt(topAdBySpend.lead || '0') || 0
    if (topLeads === 0 && leads > 0) oppParts.push(`reallocating a portion of the budget from "${topAdBySpend.name}" toward the highest-converting ad could improve overall campaign efficiency`)
  }

  const opportunities = oppParts.length > 0
    ? oppParts[0].charAt(0).toUpperCase() + oppParts[0].slice(1) + (oppParts.length > 1 ? '. Additionally, ' + oppParts.slice(1).join('. ') : '') + '.'
    : 'This campaign is well positioned — continuing to monitor performance and test incrementally will compound results over time.'

  // Recommendation
  let recommendation = ''
  if (leads > 0 && topAdByLeads && parseInt(topAdByLeads.lead || '0') > 0) {
    recommendation = `Increase daily budget allocation to "${topAdByLeads.name}" to capitalise on its proven lead generation performance, while introducing one new creative variant to keep the audience engaged and test further improvements.`
  } else if (lpv > 0 && leads === 0) {
    recommendation = `Prioritise a landing page review — the ad traffic is there, and a focused conversion rate optimisation test on the form or page layout is the highest-leverage action to start generating leads from the existing audience.`
  } else if (ctr < 1.5 && ctr > 0) {
    recommendation = `Launch a creative refresh test with at least two new ad variants. Prioritise strong hook copy in the first 3 seconds and a clear, benefit-led call to action to lift CTR and drive down cost per click.`
  } else if (freq > 4) {
    recommendation = `Expand the audience targeting — lookalike audiences based on existing leads or page visitors are a natural next step that should reduce CPM, introduce new potential customers, and sustain campaign momentum.`
  } else {
    recommendation = `Maintain current momentum and schedule a creative refresh within the next two weeks to stay ahead of any audience fatigue. Regular reporting will ensure budget is always allocated to the highest-performing segments.`
  }

  return { overview, highlights, opportunities, recommendation }
}

function CampaignSummary({ campaign, ads }: { campaign: CampaignInsight; ads: AdInsight[] }) {
  const ctr = parseFloat(campaign.ctr || '0')
  const cpm = parseFloat(campaign.cpm || '0')
  const cpc = parseFloat(campaign.cpc || '0')
  const leads = parseInt(campaign.lead || '0') || 0
  const { overview, highlights, opportunities, recommendation } = buildNarrative(campaign, ads)

  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#E8E4DC] px-5 py-3 bg-[#F8F6F2] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div style={{ width: '2px', height: '12px', background: '#C8972D', borderRadius: '1px' }} />
          <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ fontFamily: 'Montserrat, sans-serif', color: '#C8972D' }}>
            Campaign Analysis
          </p>
        </div>
        <span className="text-[9px] text-[#AAAAAA]" style={{ fontFamily: 'Inter, sans-serif' }}>
          Auto-generated from live data
        </span>
      </div>

      <div className="p-5">
        {/* Key metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'CTR', value: `${ctr.toFixed(2)}%`, hl: ctr >= 2 ? 'good' : ctr >= 1 ? 'neutral' : 'warn' },
            { label: 'CPM', value: `$${cpm.toFixed(2)}`, hl: cpm < 15 ? 'good' : cpm < 25 ? 'neutral' : 'warn' },
            { label: 'CPC', value: cpc > 0 ? `$${cpc.toFixed(2)}` : '—', hl: 'neutral' },
            { label: 'Leads', value: leads > 0 ? String(leads) : '—', hl: leads > 0 ? 'good' : 'neutral' },
          ].map((item) => (
            <div key={item.label} className="bg-[#F8F6F2] border border-[#E8E4DC] rounded-[6px] px-4 py-3">
              <p className="text-[9px] uppercase tracking-[0.12em] text-[#AAAAAA] mb-1" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
                {item.label}
              </p>
              <p
                className={`text-base font-bold ${item.hl === 'good' ? 'text-emerald-600' : item.hl === 'warn' ? 'text-amber-600' : 'text-[#111111]'}`}
                style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.01em' }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Narrative sections */}
        <div className="space-y-5">
          <NarrativeSection title="Overview" icon="○" color="#C8972D" text={overview} />
          <NarrativeSection title="What's Working" icon="↑" color="#059669" text={highlights} />
          <NarrativeSection title="Growth Opportunities" icon="◇" color="#C8972D" text={opportunities} />
          <div className="bg-[#111111] rounded-[8px] p-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#C8972D] mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Recommendation
            </p>
            <p className="text-[13px] text-white leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              {recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function NarrativeSection({ title, icon, color, text }: { title: string; icon: string; color: string; text: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[11px] font-bold" style={{ color }}>{icon}</span>
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#888888]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {title}
        </p>
      </div>
      <p className="text-[13px] text-[#444444] leading-relaxed pl-5" style={{ fontFamily: 'Inter, sans-serif' }}>
        {text}
      </p>
    </div>
  )
}

export function DashboardClient({ client, summary, campaigns, ads, thumbnails, period, windsorOrganic = null, igInsights = null, windsorInstagram = null, igAudience = null, fbAudience = null, posts = [] as WindsorPost[] }: Props) {
  const totalSpend = parseFloat(summary?.amount_spent || '0')
  const totalLeads = campaigns.reduce((s, c) => s + (parseInt(c.lead || '0') || 0), 0)
  const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0
  const hasPaid = client.type === 'paid' && campaigns.length > 0

  return (
    <>
      {hasPaid && (
        <SummaryBar
          period={period}
          items={[
            { label: 'Total Spend', value: fmtDollar(totalSpend), gold: true },
            { label: 'Impressions', value: fmt(summary?.impressions) },
            { label: 'Reach', value: fmt(summary?.reach) },
            { label: 'Clicks', value: fmt(summary?.clicks) },
            { label: 'Avg CTR', value: `${parseFloat(summary?.ctr || '0').toFixed(2)}%` },
            { label: 'Avg CPM', value: `$${parseFloat(summary?.cpm || '0').toFixed(2)}` },
            { label: 'Total Leads', value: totalLeads > 0 ? String(totalLeads) : '—', green: totalLeads > 0 },
            { label: 'Cost Per Lead', value: cpl > 0 ? fmtDollar(cpl) : '—', gold: cpl > 0 },
          ]}
        />
      )}

      {windsorOrganic && (
        <OrganicSection windsorOrganic={windsorOrganic} igInsights={igInsights} windsorInstagram={windsorInstagram} igAudience={igAudience} fbAudience={fbAudience} />
      )}

      {client.type === 'organic' && posts.length > 0 && <ContentTable posts={posts} />}

      {client.type === 'paid' && (
        campaigns.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#E8E4DC] rounded-[8px]">
            <p className="text-[#AAAAAA] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              No active campaigns in this period.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div style={{ width: '2px', height: '14px', background: '#C8972D', borderRadius: '1px' }} />
              <h2
                className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#888888]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Paid Campaigns
              </h2>
              <span className="text-[10px] text-[#AAAAAA] bg-white border border-[#E8E4DC] px-2 py-0.5 rounded-full" style={{ fontFamily: 'Inter, sans-serif' }}>
                {campaigns.length}
              </span>
            </div>
            {campaigns.map((campaign) => {
              const campaignAds = ads.filter((a) => a.campaign_id === campaign.id)
              return (
                <CampaignSection key={campaign.id} campaign={campaign} ads={campaignAds} thumbnails={thumbnails} />
              )
            })}
          </div>
        )
      )}
    </>
  )
}
