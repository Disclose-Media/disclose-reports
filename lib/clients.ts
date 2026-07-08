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
    type: 'organic',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'cc-org-x2k9w4mn7p',
  },
  {
    id: 'mai-sunset',
    name: 'Mai Sunset Beach Resort',
    accountId: '',
    windsorPageId: '996924450165919',
    type: 'organic',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'ms-w9n5k6rb4g',
  },
  {
    id: 'blue-lagoon',
    name: 'Blue Lagoon Cruises',
    accountId: '',
    windsorPageId: '75421254639',
    type: 'organic',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'blc-k3n7p2qx9m',
  },
  {
    id: 'south-sea-island',
    name: 'South Sea Island',
    accountId: '',
    windsorPageId: '190230148201358',
    type: 'organic',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'ssi-m8v4w1jh6r',
  },
  {
    id: 'south-sea-cats',
    name: 'South Sea Cats',
    accountId: '',
    windsorPageId: '359277120605823',
    type: 'organic',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'ssc-f2t6b9yl4z',
  },
  {
    id: 'south-sea-sailing',
    name: 'South Sea Sailing',
    accountId: '',
    windsorPageId: '2193066607444805',
    type: 'organic',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'sss-q5c8n3xk7d',
  },
  {
    id: 'yasawa-adventures',
    name: 'Yasawa Adventures Fiji',
    accountId: '',
    windsorPageId: '330487090305827',
    type: 'organic',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'yaf-r1h7m4wz2s',
  },
  {
    id: 'malamala',
    name: 'Malamala Beach Club Fiji',
    accountId: '',
    windsorPageId: '1842453489303121',
    type: 'organic',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'mbc-e9j3v6pk1n',
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
