'use client'

import { useEffect, useRef, useState } from 'react'
import type { Client } from '@/lib/clients'
import type { CampaignInsight, AdInsight } from '@/lib/meta'

type Props = {
  client: Client
  summary: Record<string, string> | null
  campaigns: CampaignInsight[]
  ads: AdInsight[]
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
}: {
  label: string
  value: string
  gold?: boolean
  green?: boolean
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 pb-4">
      <p className="text-[10px] text-gray-400 mb-2 leading-snug">{label}</p>
      <p
        className={`text-2xl font-light tracking-tight ${
          gold ? 'text-[#B8860B]' : green ? 'text-emerald-600' : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function SummaryBar({ items }: { items: { label: string; value: string; gold?: boolean }[] }) {
  return (
    <div className="bg-gray-100 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
          <p className={`text-base font-medium ${item.gold ? 'text-[#B8860B]' : 'text-gray-900'}`}>
            {item.value}
          </p>
        </div>
      ))}
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
          labels: ads.map((a) => a.name),
          datasets: [
            {
              label: 'Spend (NZD)',
              data: ads.map((a) => parseFloat(a.amount_spent || '0')),
              backgroundColor: 'rgba(184,134,11,0.75)',
              borderRadius: 3,
              yAxisID: 'y',
            },
            {
              label: 'LPVs',
              data: ads.map((a) => {
                const m = a.results?.value?.match(/^(\d+)/)
                return m ? parseInt(m[1]) : 0
              }),
              backgroundColor: 'rgba(24,95,165,0.6)',
              borderRadius: 3,
              yAxisID: 'y1',
            },
            {
              label: 'Leads',
              data: ads.map((a) => parseInt(a.lead || '0') || 0),
              backgroundColor: 'rgba(29,158,117,0.85)',
              borderRadius: 3,
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
              labels: { font: { size: 10 }, boxWidth: 10, padding: 10, color: '#888' },
            },
          },
          scales: {
            x: { ticks: { color: '#888', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
            y: {
              ticks: { color: '#888', font: { size: 10 }, callback: (v) => '$' + v },
              grid: { color: 'rgba(0,0,0,0.05)' },
              title: { display: true, text: 'Spend', color: '#aaa', font: { size: 9 } },
            },
            y1: {
              position: 'right',
              ticks: { color: '#888', font: { size: 10 } },
              grid: { display: false },
              title: { display: true, text: 'LPVs / Leads', color: '#aaa', font: { size: 9 } },
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
    <div className="mb-5">
      {/* Campaign header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-[#2C2C2A] text-white px-4 py-3 rounded-t-lg flex items-center justify-between text-sm font-medium hover:bg-[#3a3a38] transition-colors"
      >
        <span>{campaign.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded-full">
            Active
          </span>
          <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="border border-t-0 border-gray-200 rounded-b-lg p-4">
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <KpiCard label="Amount Spent" value={fmtDollar(spend)} gold />
            <KpiCard label="Reach" value={fmt(campaign.reach)} />
            <KpiCard label="Impressions" value={fmt(campaign.impressions)} />
            <KpiCard label="Clicks on Ads" value={fmt(campaign.clicks)} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <KpiCard label="Landing Page Views" value={lpv > 0 ? fmt(lpv) : '—'} />
            <KpiCard label="Cost Per LPV" value={cplpv > 0 ? `$${cplpv.toFixed(2)}` : '—'} />
            <KpiCard label="Leads" value={leads > 0 ? String(leads) : '—'} green={leads > 0} />
            <KpiCard label="Cost Per Lead" value={cpl > 0 ? fmtDollar(cpl) : '—'} gold={cpl > 0} />
          </div>

          {/* Ad breakdown table */}
          {ads.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
              <div className="bg-[#2C2C2A] text-white px-4 py-2 text-xs font-medium">
                {campaign.name} — Ads
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Ad', 'Spend', 'Reach', 'Impressions', 'Clicks', 'LPV', 'Cost/LPV', 'Leads', 'CPL'].map(
                        (h) => (
                          <th
                            key={h}
                            className={`py-2 px-3 text-gray-400 font-medium whitespace-nowrap ${h === 'Ad' ? 'text-left' : 'text-right'}`}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map((ad) => {
                      const adLpvMatch = ad.results?.value?.match(/^(\d+)/)
                      const adLpv = adLpvMatch ? parseInt(adLpvMatch[1]) : 0
                      const adCplpvMatch = ad.cost_per_result?.value?.match(/[\d.]+/)
                      const adCplpv = adCplpvMatch ? parseFloat(adCplpvMatch[0]) : 0
                      const adLeads = parseInt(ad.lead || '0') || 0
                      const adCplMatch = ad.cost_per_action_type_lead?.match(/[\d.]+/)
                      const adCpl = adCplMatch ? parseFloat(adCplMatch[0]) : 0
                      const adSpend = parseFloat(ad.amount_spent || '0')

                      return (
                        <tr key={ad.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-2 px-3 font-medium text-blue-700">{ad.name}</td>
                          <td className="py-2 px-3 text-right">${adSpend.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right">{fmt(ad.reach)}</td>
                          <td className="py-2 px-3 text-right">{fmt(ad.impressions)}</td>
                          <td className="py-2 px-3 text-right">{fmt(ad.clicks)}</td>
                          <td className="py-2 px-3 text-right">{adLpv > 0 ? fmt(adLpv) : '—'}</td>
                          <td className={`py-2 px-3 text-right ${adCplpv > 0 && adCplpv < 0.75 ? 'text-emerald-600 font-medium' : adCplpv > 1 ? 'text-amber-600' : ''}`}>
                            {adCplpv > 0 ? `$${adCplpv.toFixed(2)}` : '—'}
                          </td>
                          <td className={`py-2 px-3 text-right font-medium ${adLeads > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                            {adLeads > 0 ? adLeads : '—'}
                          </td>
                          <td className={`py-2 px-3 text-right ${adCpl > 0 ? 'text-[#B8860B] font-medium' : 'text-gray-300'}`}>
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
            <div className="relative h-44 mb-4">
              <canvas ref={chartRef} />
            </div>
          )}

          {/* Summary */}
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

  const topAdByLeads = [...ads].sort(
    (a, b) => (parseInt(b.lead || '0') || 0) - (parseInt(a.lead || '0') || 0)
  )[0]
  const topAdByCplpv = [...ads].sort((a, b) => {
    const am = a.cost_per_result?.value?.match(/[\d.]+/)
    const bm = b.cost_per_result?.value?.match(/[\d.]+/)
    const av = am ? parseFloat(am[0]) : 999
    const bv = bm ? parseFloat(bm[0]) : 999
    return av - bv
  })[0]

  let insight = ''
  if (leads > 0) {
    const bestAd = topAdByLeads
    const bestAdLeads = parseInt(bestAd?.lead || '0') || 0
    insight = `This campaign generated ${leads} lead${leads > 1 ? 's' : ''} at $${cpl.toFixed(2)} CPL. `
    if (bestAd && bestAdLeads > 0) {
      insight += `${bestAd.name} is the top-converting ad with ${bestAdLeads} lead${bestAdLeads > 1 ? 's' : ''}. `
    }
  } else if (lpv > 0) {
    insight = `${lpv} landing page views recorded. No leads attributed yet — verify the lead event is firing on the landing page. `
  }

  if (topAdByCplpv) {
    const m = topAdByCplpv.cost_per_result?.value?.match(/[\d.]+/)
    if (m) {
      insight += `${topAdByCplpv.name} has the most efficient cost per LPV at $${parseFloat(m[0]).toFixed(2)}.`
    }
  }

  if (ctr > 3) insight += ` CTR of ${ctr.toFixed(2)}% is excellent — well above the account average.`

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-0.5 h-3 bg-[#B8860B] rounded inline-block" />
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
          Campaign Summary
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <div className="bg-gray-50 rounded p-2">
          <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">CTR</p>
          <p className={`text-sm font-medium ${ctr > 2 ? 'text-emerald-600' : 'text-gray-700'}`}>
            {ctr.toFixed(2)}%
          </p>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">CPM</p>
          <p className="text-sm font-medium text-gray-700">
            ${parseFloat(campaign.cpm || '0').toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">Leads</p>
          <p className={`text-sm font-medium ${leads > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
            {leads || '—'}
          </p>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">CPL</p>
          <p className={`text-sm font-medium ${cpl > 0 ? 'text-[#B8860B]' : 'text-gray-400'}`}>
            {cpl > 0 ? `$${cpl.toFixed(2)}` : '—'}
          </p>
        </div>
      </div>
      {insight && <p className="text-xs text-gray-500 leading-relaxed">{insight}</p>}
    </div>
  )
}

export function DashboardClient({ client, summary, campaigns, ads }: Props) {
  const totalSpend = parseFloat(summary?.amount_spent || '0')
  const totalLeads = campaigns.reduce((s, c) => s + (parseInt(c.lead || '0') || 0), 0)
  const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0

  return (
    <>
      {/* Portfolio summary bar */}
      <SummaryBar
        items={[
          { label: 'Total Spend', value: fmtDollar(totalSpend), gold: true },
          { label: 'Impressions', value: fmt(summary?.impressions) },
          { label: 'Reach', value: fmt(summary?.reach) },
          { label: 'Clicks', value: fmt(summary?.clicks) },
          { label: 'Avg CTR', value: `${parseFloat(summary?.ctr || '0').toFixed(2)}%` },
          { label: 'Avg CPM', value: `$${parseFloat(summary?.cpm || '0').toFixed(2)}` },
          { label: 'Total Leads', value: totalLeads > 0 ? String(totalLeads) : '—' },
          { label: 'Cost Per Lead', value: cpl > 0 ? fmtDollar(cpl) : '—', gold: cpl > 0 },
        ]}
      />

      {/* Per-campaign sections */}
      {campaigns.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No active campaigns in the last 30 days.
        </div>
      ) : (
        campaigns.map((campaign) => {
          const campaignAds = ads.filter((a) => a.campaign_id === campaign.id)
          return (
            <CampaignSection key={campaign.id} campaign={campaign} ads={campaignAds} />
          )
        })
      )}
    </>
  )
}
