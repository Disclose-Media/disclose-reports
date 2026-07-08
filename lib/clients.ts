export type Client = {
  id: string
  name: string
  accountId: string
  facebookPageIds?: string[]
  igUserId?: string
  type: 'paid' | 'organic'
  status: 'active' | 'closed'
  currency: string
  hasLeadGen: boolean
  cities?: string[]
  shareToken: string
}

export const CLIENTS: Client[] = [
  {
    id: 'co-kids',
    name: 'Co Kids Group',
    accountId: '248251059419736',
    facebookPageIds: ['135504167189961', '560442774095123', '1333597723368342'],
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
    facebookPageIds: ['200736236642517'],
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
    facebookPageIds: ['111021936185'],
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
    facebookPageIds: ['437554069630323'],
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
    facebookPageIds: ['104961075212031'],
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
    facebookPageIds: ['539469452885415'],
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
    facebookPageIds: ['170839166261244'],
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
    facebookPageIds: ['52013960754'],
    type: 'paid',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'hfj-u7a4h2xq1f',
  },
  {
    id: 'mai-sunset',
    name: 'Mai Sunset Beach Resort',
    accountId: '',
    facebookPageIds: ['996924450165919'],
    type: 'organic',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
    shareToken: 'ms-w9n5k6rb4g',
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
