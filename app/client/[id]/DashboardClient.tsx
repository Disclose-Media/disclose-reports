'use client'

import { useEffect, useRef, useState } from 'react'
import type { Client } from '@/lib/clients'
import type { CampaignInsight, AdInsight } from '@/lib/meta'

type Props = {
  client: Client
  summary: Record<string, string> | null
  campaigns: CampaignInsight[]
  ads: AdInsight[]
  period: string
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
        <span className="text-[10px] text-[#555555]" style={{ fontFamily: 'Inter, sans-serif' }}>
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

function CampaignSection({ campaign, ads }: { campaign: CampaignInsight; ads: AdInsight[] }) {
  const [open, setOpen] = useState(true)
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

  useEffect(() => {
    if (!open || !chartRef.current || ads.length === 0) return
    import('chart.js/auto').then(({ default: Chart }) => {
      if (chartObj.current) (chartObj.current as { destroy: () => void }).destroy()
      chartObj.current = new Chart(chartRef.current!, {
        type: 'bar',
        data: {
          labels: ads.map((a) => a.name.length > 28 ? a.name.slice(0, 28) + '…' : a.name),
          datasets: [
            {
              label: 'Spend (NZD)',
              data: ads.map((a) => parseFloat(a.amount_spent || '0')),
              backgroundColor: 'rgba(200,151,45,0.85)',
              borderRadius: 4,
              yAxisID: 'y',
            },
            {
              label: 'LPVs',
              data: ads.map((a) => {
                const m = a.results?.value?.match(/^(\d+)/)
                return m ? parseInt(m[1]) : 0
              }),
              backgroundColor: 'rgba(99,179,237,0.75)',
              borderRadius: 4,
              yAxisID: 'y1',
            },
            {
              label: 'Leads',
              data: ads.map((a) => parseInt(a.lead || '0') || 0),
              backgroundColor: 'rgba(16,185,129,0.75)',
              borderRadius: 4,
              yAxisID: 'y1',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                font: { size: 10, family: 'Inter, sans-serif' },
                boxWidth: 10,
                padding: 16,
                color: '#888888',
              },
            },
          },
          scales: {
            x: {
              ticks: {
                color: '#AAAAAA',
                font: { size: 9, family: 'Inter, sans-serif' },
                maxRotation: 30,
              },
              grid: { color: 'rgba(0,0,0,0.04)' },
              border: { color: '#E8E4DC' },
            },
            y: {
              ticks: {
                color: '#AAAAAA',
                font: { size: 9, family: 'Inter, sans-serif' },
                callback: (v) => '$' + v,
              },
              grid: { color: 'rgba(0,0,0,0.04)' },
              border: { color: '#E8E4DC' },
              title: {
                display: true,
                text: 'Spend',
                color: '#AAAAAA',
                font: { size: 9, family: 'Inter, sans-serif' },
              },
            },
            y1: {
              position: 'right',
              ticks: {
                color: '#AAAAAA',
                font: { size: 9, family: 'Inter, sans-serif' },
              },
              grid: { display: false },
              border: { color: '#E8E4DC' },
              title: {
                display: true,
                text: 'LPVs / Leads',
                color: '#AAAAAA',
                font: { size: 9, family: 'Inter, sans-serif' },
              },
            },
          },
        },
      })
    })
    return () => {
      if (chartObj.current) (chartObj.current as { destroy: () => void }).destroy()
    }
  }, [open, ads])

  return (
    <div className="mb-6">
      {/* Campaign header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-[#111111] text-white px-5 py-4 flex items-center justify-between hover:bg-[#1C1C1C] transition-colors duration-150"
        style={{ borderRadius: open ? '8px 8px 0 0' : '8px' }}
      >
        <div className="flex items-center gap-3">
          <div style={{ width: '2px', height: '18px', background: '#C8972D', borderRadius: '1px', flexShrink: 0 }} />
          <span
            className="font-bold text-sm text-white text-left"
            style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.01em' }}
          >
            {campaign.name}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:flex items-center gap-1.5 text-[11px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <span className="text-[#555555]">Spend</span>
            <span className="font-bold text-[#C8972D]">{fmtDollar(spend)}</span>
          </span>
          <span className="text-[10px] bg-emerald-900/30 text-emerald-400 border border-emerald-900/40 px-2.5 py-1 rounded-full" style={{ fontFamily: 'Inter, sans-serif' }}>
            Active
          </span>
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            className={`text-[#555555] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>

      {open && (
        <div className="border border-t-0 border-[#E8E4DC] rounded-b-[8px] bg-[#F8F6F2] p-5">

          {/* KPI row 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <KpiCard label="Amount Spent" value={fmtDollar(spend)} gold />
            <KpiCard label="Reach" value={fmt(campaign.reach)} />
            <KpiCard label="Impressions" value={fmt(campaign.impressions)} />
            <KpiCard label="Clicks" value={fmt(campaign.clicks)} />
          </div>

          {/* KPI row 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <KpiCard label="Landing Page Views" value={lpv > 0 ? fmt(lpv) : '—'} />
            <KpiCard label="Cost Per LPV" value={cplpv > 0 ? `$${cplpv.toFixed(2)}` : '—'} />
            <KpiCard label="Leads" value={leads > 0 ? String(leads) : '—'} green={leads > 0} />
            <KpiCard label="Cost Per Lead" value={cpl > 0 ? fmtDollar(cpl) : '—'} gold={cpl > 0} />
          </div>

          {/* Ad breakdown table */}
          {ads.length > 0 && (
            <div className="bg-white border border-[#E8E4DC] rounded-[8px] overflow-hidden mb-6">
              <div className="border-b border-[#E8E4DC] px-5 py-3 flex items-center gap-2.5 bg-[#F8F6F2]">
                <div style={{ width: '2px', height: '12px', background: '#C8972D', borderRadius: '1px' }} />
                <p
                  className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#888888]"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Ad Performance
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E8E4DC]">
                      {['Ad', 'Spend', 'Reach', 'Impressions', 'Clicks', 'LPV', 'Cost/LPV', 'Leads', 'CPL'].map((h) => (
                        <th
                          key={h}
                          className={`py-3 px-4 text-[9px] font-bold text-[#AAAAAA] uppercase tracking-[0.12em] whitespace-nowrap bg-white ${h === 'Ad' ? 'text-left' : 'text-right'}`}
                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map((ad, idx) => {
                      const adLpvMatch = ad.results?.value?.match(/^(\d+)/)
                      const adLpv = adLpvMatch ? parseInt(adLpvMatch[1]) : 0
                      const adCplpvMatch = ad.cost_per_result?.value?.match(/[\d.]+/)
                      const adCplpv = adCplpvMatch ? parseFloat(adCplpvMatch[0]) : 0
                      const adLeads = parseInt(ad.lead || '0') || 0
                      const adCplMatch = ad.cost_per_action_type_lead?.match(/[\d.]+/)
                      const adCpl = adCplMatch ? parseFloat(adCplMatch[0]) : 0
                      const adSpend = parseFloat(ad.amount_spent || '0')

                      return (
                        <tr
                          key={ad.id}
                          className={`border-b border-[#F0EDE8] hover:bg-[#FBF9F5] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}`}
                        >
                          <td
                            className="py-3 px-4 font-semibold text-[#C8972D] text-xs max-w-[200px]"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            <span className="truncate block">{ad.name}</span>
                          </td>
                          <td className="py-3 px-4 text-right text-xs font-semibold text-[#111111]" style={{ fontFamily: 'Inter, sans-serif' }}>
                            ${adSpend.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right text-xs text-[#444444]" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {fmt(ad.reach)}
                          </td>
                          <td className="py-3 px-4 text-right text-xs text-[#444444]" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {fmt(ad.impressions)}
                          </td>
                          <td className="py-3 px-4 text-right text-xs text-[#444444]" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {fmt(ad.clicks)}
                          </td>
                          <td className="py-3 px-4 text-right text-xs text-[#444444]" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {adLpv > 0 ? fmt(adLpv) : '—'}
                          </td>
                          <td
                            className={`py-3 px-4 text-right text-xs font-medium ${adCplpv > 0 && adCplpv < 0.75 ? 'text-emerald-600' : adCplpv > 1 ? 'text-amber-600' : 'text-[#444444]'}`}
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            {adCplpv > 0 ? `$${adCplpv.toFixed(2)}` : '—'}
                          </td>
                          <td
                            className={`py-3 px-4 text-right text-xs font-bold ${adLeads > 0 ? 'text-emerald-600' : 'text-[#CCCCCC]'}`}
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            {adLeads > 0 ? adLeads : '—'}
                          </td>
                          <td
                            className={`py-3 px-4 text-right text-xs font-medium ${adCpl > 0 ? 'text-[#C8972D]' : 'text-[#CCCCCC]'}`}
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            {adCpl > 0 ? `$${adCpl.toFixed(2)}` : '—'}
                          </td>
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
              <p
                className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#888888] mb-4"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
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

function CampaignSummary({ campaign, ads }: { campaign: CampaignInsight; ads: AdInsight[] }) {
  const leads = parseInt(campaign.lead || '0') || 0
  const lpvMatch = campaign.results?.value?.match(/^(\d+)/)
  const lpv = lpvMatch ? parseInt(lpvMatch[1]) : 0
  const cplMatch = campaign.cost_per_action_type_lead?.match(/[\d.]+/)
  const cpl = cplMatch ? parseFloat(cplMatch[0]) : 0
  const ctr = parseFloat(campaign.ctr || '0')
  const cpm = parseFloat(campaign.cpm || '0')
  const cpc = parseFloat(campaign.cpc || '0')
  const spend = parseFloat(campaign.amount_spent || '0')
  const clicks = parseInt(campaign.clicks || '0')
  const impressions = parseInt(campaign.impressions || '0')
  const reach = parseInt(campaign.reach || '0')

  const topAdByLeads = [...ads].sort(
    (a, b) => (parseInt(b.lead || '0') || 0) - (parseInt(a.lead || '0') || 0)
  )[0]
  const topAdByCtr = [...ads].sort(
    (a, b) => parseFloat(b.ctr || '0') - parseFloat(a.ctr || '0')
  )[0]

  const points: { type: 'good' | 'warning' | 'info'; text: string }[] = []

  if (ctr >= 3) points.push({ type: 'good', text: `Strong CTR of ${ctr.toFixed(2)}% — well above the Meta average of ~1–2%. Your creative is resonating with the audience.` })
  else if (ctr >= 1.5) points.push({ type: 'info', text: `CTR of ${ctr.toFixed(2)}% is solid. Consider A/B testing new creatives to push this higher.` })
  else if (ctr > 0) points.push({ type: 'warning', text: `CTR of ${ctr.toFixed(2)}% is below average. Try refreshing ad creative or tightening the audience targeting.` })

  if (cpm > 0 && cpm < 10) points.push({ type: 'good', text: `CPM of $${cpm.toFixed(2)} is efficient — reaching audiences at a low cost per 1,000 impressions.` })
  else if (cpm >= 10 && cpm < 25) points.push({ type: 'info', text: `CPM of $${cpm.toFixed(2)} is within normal range for NZ markets.` })
  else if (cpm >= 25) points.push({ type: 'warning', text: `CPM of $${cpm.toFixed(2)} is elevated. Consider broadening your audience or adjusting bid strategy.` })

  if (leads > 0 && lpv > 0) {
    const convRate = ((leads / lpv) * 100).toFixed(1)
    points.push({ type: parseFloat(convRate) > 10 ? 'good' : 'info', text: `Landing page conversion rate of ${convRate}% (${leads} leads from ${lpv} views). ${parseFloat(convRate) > 10 ? 'Excellent landing page performance.' : 'Consider optimising the landing page to improve conversion.'}` })
  }
  if (leads > 0) {
    points.push({ type: cpl < 50 ? 'good' : cpl < 100 ? 'info' : 'warning', text: `Cost per lead of $${cpl.toFixed(2)}. ${cpl < 50 ? 'Strong performance — leads at an efficient cost.' : cpl < 100 ? 'Moderate CPL — optimising top-performing ads could reduce this further.' : 'CPL is elevated — review targeting and creative to improve lead quality.'}` })
  } else if (lpv > 0) {
    points.push({ type: 'warning', text: `${lpv} landing page views but no leads recorded. Check that the Meta lead event is firing correctly.` })
  }

  if (topAdByLeads && parseInt(topAdByLeads.lead || '0') > 0) {
    points.push({ type: 'good', text: `Best performing ad: "${topAdByLeads.name}" with ${topAdByLeads.lead} lead${parseInt(topAdByLeads.lead || '0') > 1 ? 's' : ''}. Consider increasing budget allocation to this ad.` })
  }
  if (topAdByCtr && parseFloat(topAdByCtr.ctr || '0') > ctr * 1.3 && ads.length > 1) {
    points.push({ type: 'info', text: `"${topAdByCtr.name}" has the highest CTR at ${parseFloat(topAdByCtr.ctr || '0').toFixed(2)}% — this creative is driving the most engagement.` })
  }

  if (impressions > 0 && reach > 0) {
    const freq = (impressions / reach).toFixed(1)
    if (parseFloat(freq) > 4) points.push({ type: 'warning', text: `Average frequency of ${freq}x — audience is seeing ads repeatedly. Consider expanding the audience or rotating creatives.` })
    else points.push({ type: 'info', text: `Average frequency of ${freq}x — healthy exposure with no signs of audience fatigue.` })
  }

  const iconMap = { good: '↑', warning: '!', info: '·' }
  const colorMap = {
    good: 'text-emerald-700',
    warning: 'text-amber-700',
    info: 'text-[#C8972D]',
  }
  const bgMap = {
    good: 'bg-emerald-50 border-emerald-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-[#FBF7EE] border-[#E8D8B0]',
  }

  return (
    <div className="bg-white border border-[#E8E4DC] rounded-[8px] overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#E8E4DC] px-5 py-3 bg-[#F8F6F2] flex items-center gap-2.5">
        <div style={{ width: '2px', height: '12px', background: '#C8972D', borderRadius: '1px' }} />
        <p
          className="text-[9px] font-bold uppercase tracking-[0.18em]"
          style={{ fontFamily: 'Montserrat, sans-serif', color: '#C8972D' }}
        >
          Campaign Analysis
        </p>
      </div>

      <div className="p-5">
        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'CTR', value: `${ctr.toFixed(2)}%`, hl: ctr >= 2 ? 'good' : ctr >= 1 ? 'neutral' : 'warning' },
            { label: 'CPM', value: `$${cpm.toFixed(2)}`, hl: 'neutral' },
            { label: 'CPC', value: cpc > 0 ? `$${cpc.toFixed(2)}` : '—', hl: 'neutral' },
            { label: 'Leads', value: leads > 0 ? String(leads) : '—', hl: leads > 0 ? 'good' : 'neutral' },
          ].map((item) => (
            <div key={item.label} className="bg-[#F8F6F2] border border-[#E8E4DC] rounded-[6px] px-4 py-3">
              <p
                className="text-[9px] uppercase tracking-[0.12em] text-[#AAAAAA] mb-1"
                style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}
              >
                {item.label}
              </p>
              <p
                className={`text-base font-bold ${
                  item.hl === 'good' ? 'text-emerald-600' :
                  item.hl === 'warning' ? 'text-amber-600' : 'text-[#111111]'
                }`}
                style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.01em' }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Analysis points */}
        {points.length > 0 ? (
          <div className="space-y-2">
            {points.map((point, i) => (
              <div key={i} className={`flex gap-3 px-4 py-3 rounded-[6px] border ${bgMap[point.type]}`}>
                <span className={`text-sm font-black mt-0.5 shrink-0 w-4 text-center ${colorMap[point.type]}`}>
                  {iconMap[point.type]}
                </span>
                <p className="text-[12px] text-[#444444] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {point.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#AAAAAA] italic" style={{ fontFamily: 'Inter, sans-serif' }}>
            Not enough data to generate analysis for this period.
          </p>
        )}
      </div>
    </div>
  )
}

export function DashboardClient({ client, summary, campaigns, ads, period }: Props) {
  const totalSpend = parseFloat(summary?.amount_spent || '0')
  const totalLeads = campaigns.reduce((s, c) => s + (parseInt(c.lead || '0') || 0), 0)
  const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0

  return (
    <>
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

      {campaigns.length === 0 ? (
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
              Campaigns
            </h2>
            <span className="text-[10px] text-[#AAAAAA] bg-white border border-[#E8E4DC] px-2 py-0.5 rounded-full" style={{ fontFamily: 'Inter, sans-serif' }}>
              {campaigns.length}
            </span>
          </div>
          {campaigns.map((campaign) => {
            const campaignAds = ads.filter((a) => a.campaign_id === campaign.id)
            return (
              <CampaignSection key={campaign.id} campaign={campaign} ads={campaignAds} />
            )
          })}
        </div>
      )}
    </>
  )
}
