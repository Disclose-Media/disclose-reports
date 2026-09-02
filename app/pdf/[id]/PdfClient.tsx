'use client'

import { useEffect } from 'react'
import type { CampaignInsight, AdInsight } from '@/lib/meta'
import type { Client } from '@/lib/clients'

type EffectiveObjective = 'reach' | 'traffic' | 'leads' | 'engagement'

// Local-safe formatters
function fmt(n: string | number | undefined, dec = 0) {
  const num = parseFloat(String(n ?? '0'))
  if (isNaN(num)) return '—'
  return num.toLocaleString('en-NZ', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}
function fmtDollar(n: string | number | undefined) {
  const num = parseFloat(String(n ?? '0'))
  if (isNaN(num) || num === 0) return '—'
  return `$${num.toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function detectObjective(c: CampaignInsight): EffectiveObjective {
  const obj = (c.objective || '').toUpperCase()
  if (obj === 'OUTCOME_LEADS' || obj === 'LEAD_GENERATION') return 'leads'
  if (obj === 'OUTCOME_TRAFFIC' || obj === 'LINK_CLICKS' || obj === 'CONVERSIONS') return 'traffic'
  if (['OUTCOME_ENGAGEMENT','POST_ENGAGEMENT','PAGE_LIKES','EVENT_RESPONSES','VIDEO_VIEWS','MESSAGES'].includes(obj)) return 'engagement'
  if (obj === 'OUTCOME_AWARENESS' || obj === 'REACH' || obj === 'BRAND_AWARENESS') return 'reach'
  const leads = parseInt(c.lead || '0') || 0
  const lpv = c.results?.value ? parseInt(c.results.value) : 0
  if (leads > 0) return 'leads'
  if (lpv > 0) return 'traffic'
  return 'reach'
}

function buildNarrative(campaign: CampaignInsight, ads: AdInsight[]) {
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
  const topAdByCtr = [...ads].sort((a, b) => parseFloat(b.ctr || '0') - parseFloat(a.ctr || '0'))[0]
  const topAdBySpend = [...ads].sort((a, b) => parseFloat(b.amount_spent || '0') - parseFloat(a.amount_spent || '0'))[0]

  let overview = ''
  if (leads > 0) {
    overview = `This campaign delivered ${leads} lead${leads > 1 ? 's' : ''} at an average cost of $${cpl.toFixed(2)} per lead from a total investment of $${spend.toFixed(2)}.`
    if (lpv > 0) overview += ` Of the ${lpv} landing page visitors, ${((leads / lpv) * 100).toFixed(1)}% converted into leads.`
  } else if (lpv > 0) {
    overview = `This campaign drove ${lpv} landing page views from a $${spend.toFixed(2)} investment, building meaningful pipeline awareness. The traffic quality and volume provide a strong base to build on.`
  } else {
    overview = `This campaign reached ${reach > 0 ? reach.toLocaleString('en-NZ') : 'a targeted audience'} people with ${impressions > 0 ? impressions.toLocaleString('en-NZ') + ' impressions' : 'consistent exposure'} over the reporting period, investing $${spend.toFixed(2)} in brand reach and awareness.`
  }

  const hl: string[] = []
  if (ctr >= 3) hl.push(`Creative engagement is outstanding at a ${ctr.toFixed(2)}% CTR, more than double the Meta average`)
  else if (ctr >= 1.5) hl.push(`A ${ctr.toFixed(2)}% CTR demonstrates solid audience engagement, sitting above the typical Meta benchmark`)
  else if (ctr > 0) hl.push(`The campaign is generating consistent clicks at a ${ctr.toFixed(2)}% CTR`)
  if (cpm > 0 && cpm < 10) hl.push(`audience reach is highly cost-efficient at $${cpm.toFixed(2)} CPM`)
  else if (cpm >= 10 && cpm < 20) hl.push(`$${cpm.toFixed(2)} CPM is competitive for the NZ market`)
  if (topAdByCtr && parseFloat(topAdByCtr.ctr || '0') > 0) hl.push(`"${topAdByCtr.name}" leads on engagement with a ${parseFloat(topAdByCtr.ctr || '0').toFixed(2)}% CTR`)
  const highlights = hl.length > 0 ? hl.join(', and ') + '.' : 'The campaign is performing consistently across key metrics.'

  const opp: string[] = []
  if (freq > 4) opp.push(`Audience frequency of ${freq.toFixed(1)}x suggests time to broaden reach or refresh creatives`)
  if (ctr < 0.5 && impressions > 5000) opp.push(`CTR of ${ctr.toFixed(2)}% has clear room to grow through creative testing`)
  if (topAdBySpend && ads.length > 1) opp.push(`Reviewing budget allocation across ads could improve overall efficiency`)
  const opportunities = opp.length > 0 ? opp.join('. ') + '.' : 'The campaign is well positioned. Continue to monitor and test incrementally to compound results.'

  let recommendation = ''
  if (leads === 0 && lpv > 0) recommendation = `Prioritise a landing page review. The ad traffic is there, and a focused conversion rate optimisation test on the form or page layout is the highest-leverage action to start generating leads from the existing audience.`
  else if (ctr < 1) recommendation = `Launch a creative refresh test with at least two new ad variants. Prioritise strong hook copy and a clear, benefit-led call to action to lift CTR and drive down cost per click.`
  else recommendation = `Expand the audience targeting. Lookalike audiences based on existing leads or page visitors are a natural next step that should reduce CPM, introduce new potential customers, and sustain campaign momentum.`

  return { overview, highlights, opportunities, recommendation }
}

// ── Brand tokens ──────────────────────────────────────────────
const GOLD = '#C8972D'
const BLACK = '#111111'
const OFFWHITE = '#F8F6F2'
const LIGHT_GREY = '#E8E4DC'
const MID_GREY = '#AAAAAA'
const DARK_GREY = '#888888'
const CHARCOAL = '#444444'
const DARK_BG = '#1A1A1A'
const DARK_CARD = '#161616'

const OBJ_LABEL: Record<EffectiveObjective, string> = {
  leads: 'Lead Generation', traffic: 'Traffic & LPV', engagement: 'Engagement', reach: 'Reach & Awareness',
}
const OBJ_COLOR: Record<EffectiveObjective, string> = {
  leads: '#16a34a', traffic: GOLD, engagement: '#9333ea', reach: '#2563eb',
}

// ── Sub-components ────────────────────────────────────────────
function KpiCard({ label, value, gold, green, neutral }: { label: string; value: string; gold?: boolean; green?: boolean; neutral?: boolean }) {
  return (
    <div style={{ border: `1px solid ${LIGHT_GREY}`, borderRadius: 6, padding: '9px 12px', background: '#fff' }}>
      <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 7.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: DARK_GREY, marginBottom: 5, lineHeight: 1 }}>{label}</div>
      <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 19, fontWeight: 800, color: gold ? GOLD : green ? '#16a34a' : BLACK, lineHeight: 1 }}>{value}</div>
    </div>
  )
}

function DarkKpiCard({ label, value, gold, green }: { label: string; value: string; gold?: boolean; green?: boolean }) {
  return (
    <div style={{ background: DARK_CARD, borderRadius: 5, padding: '9px 12px' }}>
      <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 7.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 16, fontWeight: 800, color: gold ? GOLD : green ? '#4ade80' : '#fff' }}>{value}</div>
    </div>
  )
}

function AnalysisCard({ label, value, highlight }: { label: string; value: string; highlight?: 'good' | 'warn' | 'neutral' }) {
  const color = highlight === 'good' ? '#16a34a' : highlight === 'warn' ? '#d97706' : BLACK
  return (
    <div style={{ background: '#fff', border: `1px solid ${LIGHT_GREY}`, borderRadius: 5, padding: '8px 10px' }}>
      <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 7.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: DARK_GREY, marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 15, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

function GoldRule() {
  return <div style={{ height: 2, background: `linear-gradient(90deg, ${GOLD} 0%, rgba(200,151,45,0.15) 100%)`, marginBottom: 16 }} />
}

export function PdfClient({
  client,
  campaigns,
  ads,
  summary,
  period,
  generatedDate,
}: {
  client: Client
  campaigns: CampaignInsight[]
  ads: AdInsight[]
  summary: Record<string, string> | null
  period: string
  generatedDate: string
}) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 900)
    return () => clearTimeout(t)
  }, [])

  const sorted = [...campaigns].sort((a, b) => parseFloat(b.amount_spent || '0') - parseFloat(a.amount_spent || '0'))

  const totalSpend = parseFloat(summary?.amount_spent || '0')
  const totalImpressions = parseInt(summary?.impressions || '0')
  const totalReach = parseInt(summary?.reach || '0')
  const totalClicks = parseInt(summary?.clicks || '0')
  const avgCtr = parseFloat(summary?.ctr || '0')
  const avgCpm = parseFloat(summary?.cpm || '0')
  const avgCpc = parseFloat(summary?.cpc || '0')
  const totalLpv = campaigns.reduce((s, c) => { const m = c.results?.value?.match(/^(\d+)/); return s + (m ? parseInt(m[1]) : 0) }, 0)
  const totalLeads = campaigns.reduce((s, c) => s + (parseInt(c.lead || '0') || 0), 0)

  const objSpend: Record<EffectiveObjective, number> = { leads: 0, traffic: 0, engagement: 0, reach: 0 }
  for (const c of campaigns) objSpend[detectObjective(c)] += parseFloat(c.amount_spent || '0')
  const accountObj: EffectiveObjective = (['leads', 'traffic', 'engagement', 'reach'] as EffectiveObjective[])
    .reduce((best, o) => objSpend[o] > objSpend[best] ? o : best, 'reach' as EffectiveObjective)

  const overviewRow2 =
    accountObj === 'leads'
      ? [
          { label: 'Avg CTR', value: `${avgCtr.toFixed(2)}%` },
          { label: 'Total LPV', value: totalLpv > 0 ? fmt(totalLpv) : '—' },
          { label: 'Total Leads', value: totalLeads > 0 ? String(totalLeads) : '—', green: true },
          { label: 'Cost Per Lead', value: totalLeads > 0 ? fmtDollar(totalSpend / totalLeads) : '—', gold: true },
        ]
      : accountObj === 'traffic'
      ? [
          { label: 'Avg CTR', value: `${avgCtr.toFixed(2)}%` },
          { label: 'Total LPV', value: totalLpv > 0 ? fmt(totalLpv) : '—' },
          { label: 'Cost Per LPV', value: totalLpv > 0 ? fmtDollar(totalSpend / totalLpv) : '—', gold: true },
          { label: 'Avg CPC', value: avgCpc > 0 ? fmtDollar(avgCpc) : '—' },
        ]
      : accountObj === 'engagement'
      ? [
          { label: 'Avg CTR', value: `${avgCtr.toFixed(2)}%` },
          { label: 'Total Clicks', value: fmt(totalClicks) },
          { label: 'Avg CPM', value: avgCpm > 0 ? fmtDollar(avgCpm) : '—' },
          { label: 'Avg CPC', value: avgCpc > 0 ? fmtDollar(avgCpc) : '—' },
        ]
      : [
          { label: 'Avg CTR', value: `${avgCtr.toFixed(2)}%` },
          { label: 'Avg CPM', value: avgCpm > 0 ? fmtDollar(avgCpm) : '—' },
          { label: 'Total Reach', value: fmt(totalReach) },
          { label: 'Avg CPC', value: avgCpc > 0 ? fmtDollar(avgCpc) : '—' },
        ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,600;0,700;0,800;1,400&family=Inter:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #fff;
          color: ${BLACK};
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          font-size: 10pt;
        }
        @page { margin: 14mm 16mm; size: A4 portrait; }
        @media print {
          .no-print { display: none !important; }
          .avoid-break { break-inside: avoid; page-break-inside: avoid; }
          .keep-with-next { break-after: avoid; page-break-after: avoid; }
          .page-wrap { padding: 0; }
        }
        @media screen {
          body { background: #e5e7eb; }
          .page-wrap {
            background: #fff;
            max-width: 210mm;
            margin: 20px auto;
            padding: 14mm 16mm;
            box-shadow: 0 4px 40px rgba(0,0,0,0.18);
            min-height: 297mm;
          }
        }
      `}</style>

      {/* Screen-only instruction banner */}
      <div className="no-print" style={{
        background: BLACK, color: '#fff', padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: 'Inter, sans-serif', fontSize: 13, gap: 16,
        position: 'sticky', top: 0, zIndex: 100, borderBottom: `2px solid ${GOLD}`,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD }}>PDF Ready</span>
          <span style={{ color: '#aaa', fontSize: 12 }}>In the print dialog: set <strong style={{ color: '#fff' }}>Destination → Save as PDF</strong> and uncheck <strong style={{ color: '#fff' }}>Headers and footers</strong></span>
        </div>
        <button
          onClick={() => window.print()}
          style={{ background: GOLD, color: BLACK, border: 'none', padding: '8px 20px', borderRadius: 4, fontWeight: 800, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: 11, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}
        >
          Save as PDF
        </button>
      </div>

      <div className="page-wrap">

        {/* ══ HEADER ══════════════════════════════════════════════ */}
        <div className="avoid-break" style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 14, borderBottom: `2.5px solid ${GOLD}` }}>
            <div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 7.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: 6 }}>
                Disclose Media · Performance Report
              </div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 28, fontWeight: 800, color: BLACK, letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 7 }}>
                {client.name}
              </div>
              <div style={{ fontSize: 9.5, color: DARK_GREY, fontFamily: 'Inter, sans-serif', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span>{period}</span>
                <span style={{ color: LIGHT_GREY }}>·</span>
                <span>{client.type === 'organic' ? 'Organic · Facebook & Instagram' : 'Paid Media · Meta Ads'}</span>
                <span style={{ color: LIGHT_GREY }}>·</span>
                <span>Generated {generatedDate}</span>
              </div>
            </div>
            {/* Wordmark — brand guidelines: white on dark contexts, near-black on light */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 800, color: BLACK, letterSpacing: '0.06em', lineHeight: 1.1 }}>DISCLOSE</div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 800, color: GOLD, letterSpacing: '0.06em', lineHeight: 1.1 }}>MEDIA</div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 6, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: MID_GREY, marginTop: 3 }}>
                disclosemedia.co.nz
              </div>
            </div>
          </div>
        </div>

        {/* ══ ACCOUNT OVERVIEW ════════════════════════════════════ */}
        {summary && (
          <div className="avoid-break" style={{ marginBottom: 20 }}>
            <div style={{ background: BLACK, borderRadius: 8, padding: '14px 16px', border: `1px solid ${DARK_BG}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 3, height: 14, background: GOLD, borderRadius: 2 }} />
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD }}>Account Overview</span>
                </div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: '#666' }}>{period}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 8 }}>
                {[
                  { label: 'Total Spend', value: fmtDollar(totalSpend), gold: true },
                  { label: 'Impressions', value: fmt(totalImpressions) },
                  { label: 'Reach', value: fmt(totalReach) },
                  { label: 'Clicks', value: fmt(totalClicks) },
                ].map(m => <DarkKpiCard key={m.label} {...m} />)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {overviewRow2.map(m => <DarkKpiCard key={m.label} {...m} />)}
              </div>
            </div>
          </div>
        )}

        {/* ══ SECTION LABEL ═══════════════════════════════════════ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 3, height: 14, background: GOLD, borderRadius: 2 }} />
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: CHARCOAL }}>
            Paid Campaigns ({sorted.length})
          </span>
        </div>

        {/* ══ CAMPAIGNS ═══════════════════════════════════════════ */}
        {sorted.map((campaign) => {
          const campaignAds = ads
            .filter(a => a.campaign_id === campaign.id)
            .sort((a, b) => parseFloat(b.amount_spent || '0') - parseFloat(a.amount_spent || '0'))
          const obj = detectObjective(campaign)
          const spend = parseFloat(campaign.amount_spent || '0')
          const impressions = parseInt(campaign.impressions || '0')
          const reach = parseInt(campaign.reach || '0')
          const freq = impressions > 0 && reach > 0 ? impressions / reach : 0
          const ctr = parseFloat(campaign.ctr || '0')
          const cpm = parseFloat(campaign.cpm || '0')
          const cpc = parseFloat(campaign.cpc || '0')
          const clicks = parseInt(campaign.clicks || '0')
          const lpvMatch = campaign.results?.value?.match(/^(\d+)/)
          const lpv = lpvMatch ? parseInt(lpvMatch[1]) : 0
          const cplpvMatch = campaign.cost_per_result?.value?.match(/[\d.]+/)
          const cplpv = cplpvMatch ? parseFloat(cplpvMatch[0]) : 0
          const leads = parseInt(campaign.lead || '0') || 0
          const cplMatch = campaign.cost_per_action_type_lead?.match(/[\d.]+/)
          const cpl = cplMatch ? parseFloat(cplMatch[0]) : 0
          const engRate = impressions > 0 ? (clicks / impressions) * 100 : 0
          const cpe = clicks > 0 && spend > 0 ? spend / clicks : 0
          const narrative = buildNarrative(campaign, campaignAds)

          const kpi1 = [
            { label: 'Amount Spent', value: fmtDollar(spend), gold: true },
            { label: 'Reach', value: fmt(reach) },
            { label: 'Impressions', value: fmt(impressions) },
            { label: 'Clicks', value: fmt(clicks) },
          ]
          const kpi2 =
            obj === 'leads'
              ? [{ label: 'Landing Page Views', value: fmt(lpv) }, { label: 'Cost Per LPV', value: fmtDollar(cplpv) }, { label: 'Leads', value: leads > 0 ? String(leads) : '—', green: true }, { label: 'Cost Per Lead', value: cpl > 0 ? fmtDollar(cpl) : '—', gold: true }]
              : obj === 'traffic'
              ? [{ label: 'CTR', value: `${ctr.toFixed(2)}%` }, { label: 'Landing Page Views', value: fmt(lpv) }, { label: 'Cost Per LPV', value: fmtDollar(cplpv), gold: cplpv > 0 }, { label: 'CPC', value: fmtDollar(cpc) }]
              : obj === 'engagement'
              ? [{ label: 'Engagements', value: fmt(clicks), green: true }, { label: 'Engagement Rate', value: `${engRate.toFixed(2)}%` }, { label: 'Cost Per Engagement', value: cpe > 0 ? fmtDollar(cpe) : '—', gold: cpe > 0 }, { label: 'Frequency', value: freq > 0 ? freq.toFixed(2) : '—' }]
              : [{ label: 'CPM', value: fmtDollar(cpm) }, { label: 'Frequency', value: freq > 0 ? freq.toFixed(2) : '—' }, { label: 'CTR', value: `${ctr.toFixed(2)}%` }, { label: 'CPC', value: fmtDollar(cpc) }]

          const analysisMetrics =
            obj === 'leads'
              ? [{ label: 'CTR', value: `${ctr.toFixed(2)}%`, highlight: (ctr >= 2 ? 'good' : ctr >= 1 ? 'neutral' : 'warn') as 'good'|'warn'|'neutral' }, { label: 'Total LPV', value: fmt(lpv), highlight: 'neutral' as const }, { label: 'Total Leads', value: leads > 0 ? String(leads) : '—', highlight: (leads > 0 ? 'good' : 'warn') as 'good'|'warn' }, { label: 'Cost Per Lead', value: cpl > 0 ? fmtDollar(cpl) : '—', highlight: 'neutral' as const }]
              : obj === 'traffic'
              ? [{ label: 'CTR', value: `${ctr.toFixed(2)}%`, highlight: (ctr >= 2 ? 'good' : ctr >= 1 ? 'neutral' : 'warn') as 'good'|'warn'|'neutral' }, { label: 'Total LPV', value: fmt(lpv), highlight: 'neutral' as const }, { label: 'Cost Per LPV', value: fmtDollar(cplpv), highlight: (cplpv > 0 && cplpv < 0.75 ? 'good' : cplpv > 1.5 ? 'warn' : 'neutral') as 'good'|'warn'|'neutral' }, { label: 'CPC', value: fmtDollar(cpc), highlight: 'neutral' as const }]
              : obj === 'engagement'
              ? [{ label: 'Engagements', value: fmt(clicks), highlight: (clicks > 0 ? 'good' : 'neutral') as 'good'|'neutral' }, { label: 'Engagement Rate', value: `${engRate.toFixed(2)}%`, highlight: (engRate >= 3 ? 'good' : engRate >= 1 ? 'neutral' : 'warn') as 'good'|'warn'|'neutral' }, { label: 'Cost Per Engagement', value: cpe > 0 ? fmtDollar(cpe) : '—', highlight: 'neutral' as const }, { label: 'Frequency', value: freq > 0 ? freq.toFixed(2) : '—', highlight: (freq > 4 ? 'warn' : 'good') as 'good'|'warn' }]
              : [{ label: 'CPM', value: fmtDollar(cpm), highlight: (cpm < 15 ? 'good' : cpm < 25 ? 'neutral' : 'warn') as 'good'|'warn'|'neutral' }, { label: 'Frequency', value: freq > 0 ? freq.toFixed(2) : '—', highlight: (freq > 4 ? 'warn' : 'good') as 'good'|'warn' }, { label: 'CTR', value: `${ctr.toFixed(2)}%`, highlight: (ctr >= 2 ? 'good' : ctr >= 1 ? 'neutral' : 'warn') as 'good'|'warn'|'neutral' }, { label: 'CPC', value: fmtDollar(cpc), highlight: 'neutral' as const }]

          // Table columns
          const showLpv = obj === 'traffic' || obj === 'leads'
          const showLeads = obj === 'leads'
          const showFreq = obj === 'reach' || obj === 'engagement'
          const showCpm = obj === 'reach' || obj === 'traffic'

          const thStyle: React.CSSProperties = { padding: '6px 8px', fontFamily: 'Montserrat, sans-serif', fontSize: 7.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: DARK_GREY, textAlign: 'right', whiteSpace: 'nowrap', background: OFFWHITE, borderBottom: `1px solid ${LIGHT_GREY}` }
          const tdStyle: React.CSSProperties = { padding: '6px 8px', textAlign: 'right', fontSize: 9, color: CHARCOAL, fontFamily: 'Inter, sans-serif' }

          return (
            <div key={campaign.id} style={{ marginBottom: 22, border: `1px solid ${LIGHT_GREY}`, borderRadius: 8, overflow: 'hidden' }}>
              {/* Campaign header — keep with first KPI row */}
              <div className="keep-with-next" style={{ background: BLACK, borderRadius: '8px 8px 0 0', padding: '11px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 3, height: 16, background: GOLD, borderRadius: 2, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 11.5, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{campaign.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#888' }}>Spend <strong style={{ color: GOLD, fontFamily: 'Montserrat, sans-serif' }}>{fmtDollar(spend)}</strong></span>
                  <span style={{
                    fontFamily: 'Montserrat, sans-serif', fontSize: 8.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: OBJ_COLOR[obj], background: `${OBJ_COLOR[obj]}22`, border: `1px solid ${OBJ_COLOR[obj]}55`, borderRadius: 20, padding: '3px 10px',
                  }}>{OBJ_LABEL[obj]}</span>
                </div>
              </div>

              <div style={{ padding: '14px 16px', background: '#fff' }}>
                {/* KPI rows — keep together */}
                <div className="avoid-break" style={{ marginBottom: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 8 }}>
                    {kpi1.map(k => <KpiCard key={k.label} {...k} />)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                    {kpi2.map(k => <KpiCard key={k.label} {...k} />)}
                  </div>
                </div>

                {/* Ad performance table */}
                {campaignAds.length > 0 && (
                  <div className="avoid-break" style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <div style={{ width: 2, height: 12, background: GOLD, borderRadius: 1 }} />
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: DARK_GREY }}>Ad Performance</span>
                    </div>
                    <div style={{ borderRadius: 6, overflow: 'hidden', border: `1px solid ${LIGHT_GREY}` }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
                        <thead>
                          <tr>
                            <th style={{ ...thStyle, textAlign: 'left', paddingLeft: 12, color: CHARCOAL }}>Ad / Ad Set</th>
                            <th style={{ ...thStyle, color: GOLD }}>Spend</th>
                            <th style={thStyle}>Reach</th>
                            <th style={thStyle}>Impr.</th>
                            <th style={thStyle}>Clicks</th>
                            <th style={thStyle}>CTR</th>
                            {showLpv && <th style={thStyle}>LPV</th>}
                            {showLpv && <th style={thStyle}>Cost/LPV</th>}
                            {showLeads && <th style={thStyle}>Leads</th>}
                            {showFreq && <th style={thStyle}>Freq.</th>}
                            {showCpm && <th style={thStyle}>CPM</th>}
                            <th style={thStyle}>CPC</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaignAds.map((ad, ai) => {
                            const adLpv = (() => { const m = ad.results?.value?.match(/^(\d+)/); return m ? parseInt(m[1]) : 0 })()
                            const adCplpv = (() => { const m = ad.cost_per_result?.value?.match(/[\d.]+/); return m ? parseFloat(m[0]) : 0 })()
                            const adLeads = parseInt(ad.lead || '0') || 0
                            const adImpr = parseInt(ad.impressions || '0')
                            const adReach = parseInt(ad.reach || '0')
                            const adFreq = adImpr > 0 && adReach > 0 ? adImpr / adReach : 0
                            const adCtr = parseFloat(ad.ctr || '0')
                            const adCpm = parseFloat(ad.cpm || '0')
                            const adCpc = parseFloat(ad.cpc || '0')
                            const rowBg = ai % 2 === 1 ? OFFWHITE : '#fff'
                            return (
                              <tr key={ad.id} style={{ background: rowBg }}>
                                <td style={{ ...tdStyle, textAlign: 'left', paddingLeft: 12, maxWidth: 160 }}>
                                  <div style={{ fontWeight: 600, color: GOLD, fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.name}</div>
                                  {ad.adset_name && <div style={{ fontSize: 7.5, color: MID_GREY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{ad.adset_name}</div>}
                                </td>
                                <td style={{ ...tdStyle, fontWeight: 600, color: BLACK }}>{fmtDollar(ad.amount_spent)}</td>
                                <td style={tdStyle}>{fmt(ad.reach)}</td>
                                <td style={tdStyle}>{fmt(ad.impressions)}</td>
                                <td style={tdStyle}>{fmt(ad.clicks)}</td>
                                <td style={{ ...tdStyle, color: adCtr >= 1.5 ? '#16a34a' : adCtr < 0.5 ? '#d97706' : CHARCOAL, fontWeight: adCtr >= 1.5 ? 600 : 400 }}>{adCtr.toFixed(2)}%</td>
                                {showLpv && <td style={tdStyle}>{adLpv > 0 ? fmt(adLpv) : '—'}</td>}
                                {showLpv && <td style={{ ...tdStyle, color: adCplpv > 0 && adCplpv < 0.75 ? '#16a34a' : adCplpv > 1.5 ? '#d97706' : CHARCOAL, fontWeight: adCplpv > 0 ? 600 : 400 }}>{adCplpv > 0 ? `$${adCplpv.toFixed(2)}` : '—'}</td>}
                                {showLeads && <td style={{ ...tdStyle, color: adLeads > 0 ? '#16a34a' : '#ccc', fontWeight: adLeads > 0 ? 700 : 400 }}>{adLeads > 0 ? adLeads : '—'}</td>}
                                {showFreq && <td style={tdStyle}>{adFreq > 0 ? adFreq.toFixed(2) : '—'}</td>}
                                {showCpm && <td style={tdStyle}>{adCpm > 0 ? `$${adCpm.toFixed(2)}` : '—'}</td>}
                                <td style={tdStyle}>{adCpc > 0 ? `$${adCpc.toFixed(2)}` : '—'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Campaign Analysis */}
                <div style={{ background: OFFWHITE, border: `1px solid ${LIGHT_GREY}`, borderRadius: 6, padding: '12px 14px' }}>
                  {/* Header + metric cards — keep together */}
                  <div className="avoid-break" style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <div style={{ width: 2, height: 12, background: GOLD, borderRadius: 1 }} />
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: DARK_GREY }}>Campaign Analysis</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                      {analysisMetrics.map(m => <AnalysisCard key={m.label} {...m} />)}
                    </div>
                  </div>
                  {/* Narrative */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Overview', text: narrative.overview },
                      { label: "What's Working", text: narrative.highlights },
                      { label: 'Growth Opportunities', text: narrative.opportunities },
                    ].map(s => (
                      <div key={s.label} className="avoid-break">
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 7.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD }}>{s.label}</span>
                        <p style={{ fontSize: 9, color: CHARCOAL, lineHeight: 1.65, fontFamily: 'Inter, sans-serif', marginTop: 3 }}>{s.text}</p>
                      </div>
                    ))}
                    {/* Recommendation — dark card per brand guidelines */}
                    <div className="avoid-break" style={{ background: BLACK, borderRadius: 5, padding: '10px 14px', marginTop: 2 }}>
                      <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 7.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, marginBottom: 4 }}>Recommendation</div>
                      <p style={{ fontSize: 9, color: '#cccccc', lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>{narrative.recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* ══ FOOTER ══════════════════════════════════════════════ */}
        <div style={{ borderTop: `1.5px solid ${GOLD}`, paddingTop: 10, marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 7.5, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: MID_GREY }}>
            {client.name} · Confidential Report
          </span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 8, color: MID_GREY }}>
            Disclose Media · disclosemedia.co.nz
          </span>
        </div>

      </div>
    </>
  )
}
