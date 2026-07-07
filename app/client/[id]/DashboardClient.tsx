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
  sub,
}: {
  label: string
  value: string
  gold?: boolean
  green?: boolean
  sub?: string
}) {
  return (
    <div className="bg-[#141414] border border-[rgba(201,151,58,0.12)] rounded-xl p-4 hover:border-[rgba(201,151,58,0.3)] transition-colors">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-xl font-light tracking-tight ${
        gold ? 'text-[#C9973A]' : green ? 'text-emerald-400' : 'text-white'
      }`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-gray-600 mt-1">{sub}</p>}
    </div>
  )
}

function SummaryBar({ items }: { items: { label: string; value: string; gold?: boolean; green?: boolean }[] }) {
  return (
    <div className="bg-[#0D0D0D] border border-[rgba(201,151,58,0.15)] rounded-xl p-5 mb-8">
      <p className="text-[10px] text-[#C9973A] uppercase tracking-[0.2em] mb-4">Account Overview · Last 30 Days</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
            <p className={`text-base font-semibold ${
              item.gold ? 'text-[#C9973A]' : item.green ? 'text-emerald-400' : 'text-white'
            }`}>
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
          labels: ads.map((a) => a.name),
          datasets: [
            {
              label: 'Spend (NZD)',
              data: ads.map((a) => parseFloat(a.amount_spent || '0')),
              backgroundColor: 'rgba(201,151,58,0.8)',
              borderRadius: 4,
              yAxisID: 'y',
            },
            {
              label: 'LPVs',
              data: ads.map((a) => {
                const m = a.results?.value?.match(/^(\d+)/)
                return m ? parseInt(m[1]) : 0
              }),
              backgroundColor: 'rgba(99,179,237,0.6)',
              borderRadius: 4,
              yAxisID: 'y1',
            },
            {
              label: 'Leads',
              data: ads.map((a) => parseInt(a.lead || '0') || 0),
              backgroundColor: 'rgba(52,211,153,0.7)',
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
              labels: { font: { size: 10 }, boxWidth: 10, padding: 12, color: '#666' },
            },
          },
          scales: {
            x: {
              ticks: { color: '#555', font: { size: 10 } },
              grid: { color: 'rgba(255,255,255,0.04)' },
            },
            y: {
              ticks: { color: '#555', font: { size: 10 }, callback: (v) => '$' + v },
              grid: { color: 'rgba(255,255,255,0.04)' },
              title: { display: true, text: 'Spend', color: '#555', font: { size: 9 } },
            },
            y1: {
              position: 'right',
              ticks: { color: '#555', font: { size: 10 } },
              grid: { display: false },
              title: { display: true, text: 'LPVs / Leads', color: '#555', font: { size: 9 } },
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
        className="w-full bg-[#141414] border border-[rgba(201,151,58,0.2)] text-white px-5 py-4 rounded-xl flex items-center justify-between hover:border-[rgba(201,151,58,0.4)] hover:bg-[#1a1a1a] transition-all duration-200"
        style={{ borderRadius: open ? '12px 12px 0 0' : '12px' }}
      >
        <div className="flex items-center gap-3">
          <span className="w-0.5 h-5 bg-[#C9973A] rounded-full inline-block opacity-70" />
          <span className="font-semibold text-sm text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>{campaign.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1 text-[10px] text-[#C9973A]">
            <span className="text-gray-500">Spend</span>
            <span className="font-semibold">{fmtDollar(spend)}</span>
          </span>
          <span className="text-[10px] bg-emerald-900/30 text-emerald-400 border border-emerald-800/30 px-2 py-0.5 rounded-full">
            Active
          </span>
          <span className="text-gray-600 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="border border-t-0 border-[rgba(201,151,58,0.15)] rounded-b-xl bg-[#0D0D0D] p-5">

          {/* KPI row 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <KpiCard label="Amount Spent" value={fmtDollar(spend)} gold />
            <KpiCard label="Reach" value={fmt(campaign.reach)} />
            <KpiCard label="Impressions" value={fmt(campaign.impressions)} />
            <KpiCard label="Clicks" value={fmt(campaign.clicks)} />
          </div>

          {/* KPI row 2 — lead gen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <KpiCard label="Landing Page Views" value={lpv > 0 ? fmt(lpv) : '—'} />
            <KpiCard label="Cost Per LPV" value={cplpv > 0 ? `$${cplpv.toFixed(2)}` : '—'} />
            <KpiCard label="Leads" value={leads > 0 ? String(leads) : '—'} green={leads > 0} />
            <KpiCard label="Cost Per Lead" value={cpl > 0 ? fmtDollar(cpl) : '—'} gold={cpl > 0} />
          </div>

          {/* Ad breakdown table */}
          {ads.length > 0 && (
            <div className="border border-[rgba(201,151,58,0.12)] rounded-xl overflow-hidden mb-6">
              <div className="bg-[#141414] border-b border-[rgba(201,151,58,0.12)] px-4 py-2.5 flex items-center gap-2">
                <span className="w-0.5 h-3 bg-[#C9973A] rounded-full inline-block" />
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Ad Performance — {campaign.name}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.05)]">
                      {['Ad', 'Spend', 'Reach', 'Impressions', 'Clicks', 'LPV', 'Cost/LPV', 'Leads', 'CPL'].map((h) => (
                        <th
                          key={h}
                          className={`py-2.5 px-3 text-gray-600 font-medium whitespace-nowrap uppercase tracking-wider text-[10px] ${h === 'Ad' ? 'text-left' : 'text-right'}`}
                        >
                          {h}
                        </th>
                      ))}
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
                        <tr key={ad.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(201,151,58,0.03)] transition-colors">
                          <td className="py-2.5 px-3 font-medium text-[#C9973A]">{ad.name}</td>
                          <td className="py-2.5 px-3 text-right text-gray-300">${adSpend.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right text-gray-400">{fmt(ad.reach)}</td>
                          <td className="py-2.5 px-3 text-right text-gray-400">{fmt(ad.impressions)}</td>
                          <td className="py-2.5 px-3 text-right text-gray-400">{fmt(ad.clicks)}</td>
                          <td className="py-2.5 px-3 text-right text-gray-400">{adLpv > 0 ? fmt(adLpv) : '—'}</td>
                          <td className={`py-2.5 px-3 text-right font-medium ${adCplpv > 0 && adCplpv < 0.75 ? 'text-emerald-400' : adCplpv > 1 ? 'text-amber-500' : 'text-gray-400'}`}>
                            {adCplpv > 0 ? `$${adCplpv.toFixed(2)}` : '—'}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-semibold ${adLeads > 0 ? 'text-emerald-400' : 'text-gray-700'}`}>
                            {adLeads > 0 ? adLeads : '—'}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-medium ${adCpl > 0 ? 'text-[#C9973A]' : 'text-gray-700'}`}>
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
            <div className="bg-[#141414] border border-[rgba(201,151,58,0.12)] rounded-xl p-4 mb-6">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-3">Ad Performance Chart</p>
              <div className="relative h-48">
                <canvas ref={chartRef} />
              </div>
            </div>
          )}

          {/* Campaign summary */}
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
    if (m) insight += `${topAdByCplpv.name} has the most efficient cost per LPV at $${parseFloat(m[0]).toFixed(2)}.`
  }
  if (ctr > 3) insight += ` CTR of ${ctr.toFixed(2)}% is excellent — well above the account average.`

  return (
    <div className="bg-[#141414] border border-[rgba(201,151,58,0.15)] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-0.5 h-3 bg-[#C9973A] rounded-full inline-block" />
        <p className="text-[10px] font-semibold text-[#C9973A] uppercase tracking-[0.15em]">
          Campaign Summary
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'CTR', value: `${ctr.toFixed(2)}%`, highlight: ctr > 2 ? 'green' : '' },
          { label: 'CPM', value: `$${parseFloat(campaign.cpm || '0').toFixed(2)}`, highlight: '' },
          { label: 'Leads', value: leads > 0 ? String(leads) : '—', highlight: leads > 0 ? 'green' : '' },
          { label: 'CPL', value: cpl > 0 ? `$${cpl.toFixed(2)}` : '—', highlight: cpl > 0 ? 'gold' : '' },
        ].map((item) => (
          <div key={item.label} className="bg-[#0D0D0D] border border-[rgba(255,255,255,0.04)] rounded-lg p-3">
            <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">{item.label}</p>
            <p className={`text-sm font-semibold ${
              item.highlight === 'green' ? 'text-emerald-400' :
              item.highlight === 'gold' ? 'text-[#C9973A]' : 'text-gray-300'
            }`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
      {insight && (
        <p className="text-xs text-gray-500 leading-relaxed border-t border-[rgba(255,255,255,0.05)] pt-3">
          {insight}
        </p>
      )}
    </div>
  )
}

export function DashboardClient({ client, summary, campaigns, ads }: Props) {
  const totalSpend = parseFloat(summary?.amount_spent || '0')
  const totalLeads = campaigns.reduce((s, c) => s + (parseInt(c.lead || '0') || 0), 0)
  const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0

  return (
    <>
      <SummaryBar
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
        <div className="text-center py-16 text-gray-600 border border-[rgba(201,151,58,0.1)] rounded-xl">
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
