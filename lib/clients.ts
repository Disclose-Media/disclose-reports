export type Client = {
  id: string
  name: string
  accountId: string
  facebookPageIds?: string[]
  windsorPageId?: string  // Windsor facebook_organic account ID
  igUserId?: string
  type: 'paid' | 'organic'
  status: 'active' | 'closed'
  currency: string
  hasLeadGen: boolean
  cities?: string[]
  shareToken: string
}

export const CLIENTS: Client[] = [
  // ── Paid clients ─────────────────────────────────────────────────────────
  {
    id: 'co-kids',
    name: 'Co Kids Group',
    accountId: '248251059419736',
    type: 'paid',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: true,
    cities: ['Auckland', 'Wellington', 'Christchurch', 'Mandarin / Auckland'],
    shareToken: 'ck-x7m2p9qr4w',
  },
  {
    id: 'creative-hub',
    name: 'The Creative Hub',
    accountId: '102242766540563',
    type: 'paid',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'ch-q4k8n3bs6t',
  },
  {
    id: 'south-sea',
    name: 'South Sea Cruises',
    accountId: '5156689774363967',
    type: 'paid',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'ss-r6w1t5jy2v',
  },
  {
    id: 'cascade',
    name: 'Cascade Creek Retreat',
    accountId: '362659505064113',
    type: 'paid',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'cc-b8j3v7pn5m',
  },
  {
    id: 'karaka',
    name: 'DoubleTree by Hilton Auckland Karaka',
    accountId: '1842427852623651',
    type: 'paid',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'ka-y2l9f4dh8c',
  },
  {
    id: 'pocket-bar',
    name: 'Pocket Bar',
    accountId: '1695711684136476',
    type: 'paid',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'pb-d5s8m1zk3e',
  },
  {
    id: 'hilton-nz',
    name: 'Hilton New Zealand',
    accountId: '250039821854564',
    type: 'paid',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'hnz-e3g6c9uw7a',
  },
  {
    id: 'hilton-fiji',
    name: 'Hilton Fiji Beach Resort and Spa',
    accountId: '647548016018133',
    type: 'paid',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'hfj-u7a4h2xq1f',
  },

  // ── Organic-only clients (Windsor facebook_organic) ───────────────────────
  {
    id: 'cascade-organic',
    name: 'Cascade Creek Retreat',
    accountId: '',
    windsorPageId: '437554069630323',
    igUserId: '17841407870908848',
    type: 'organic',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'cc-org-x2k9w4mn7p',
  },
  {
    id: 'hilton-fiji-organic',
    name: 'Hilton Fiji Beach Resort and Spa',
    accountId: '',
    windsorPageId: '',
    igUserId: '',
    type: 'organic',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'hfj-org-p3x8w2mv6k',
  },
  {
    id: 'karaka-organic',
    name: 'DoubleTree by Hilton Auckland Karaka',
    accountId: '',
    windsorPageId: '',
    igUserId: '',
    type: 'organic',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'ka-org-n7b4s9qj1r',
  },
  {
    id: 'pocket-bar-organic',
    name: 'Pocket Bar',
    accountId: '',
    windsorPageId: '',
    igUserId: '',
    type: 'organic',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'pb-org-t5z2h8ck4w',
  },
]

export function getClient(id: string): Client | undefined {
  return CLIENTS.find((c) => c.id === id)
}

export function getClientByToken(token: string): Client | undefined {
  return CLIENTS.find((c) => c.shareToken === token)
}

export const paidClients = CLIENTS.filter((c) => c.type === 'paid' && c.status === 'active')
export const organicClients = CLIENTS.filter((c) => c.type === 'organic' && c.status === 'active')
