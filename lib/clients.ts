export type Client = {
  id: string
  name: string
  accountId: string
  type: 'paid' | 'organic'
  status: 'active' | 'closed'
  currency: string
  hasLeadGen: boolean
  cities?: string[]
}

export const CLIENTS: Client[] = [
  {
    id: 'co-kids',
    name: 'Co Kids Group',
    accountId: '248251059419736',
    type: 'paid',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: true,
    cities: ['Auckland', 'Wellington', 'Christchurch', 'Mandarin / Auckland'],
  },
  {
    id: 'creative-hub',
    name: 'The Creative Hub',
    accountId: '102242766540563',
    type: 'paid',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
  },
  {
    id: 'south-sea',
    name: 'South Sea Cruises',
    accountId: '5156689774363967',
    type: 'paid',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
  },
  {
    id: 'cascade',
    name: 'Cascade Creek Retreat',
    accountId: '362659505064113',
    type: 'paid',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
  },
  {
    id: 'karaka',
    name: 'Karaka Ad Account',
    accountId: '1842427852623651',
    type: 'paid',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
  },
  {
    id: 'pocket-bar',
    name: 'Pocket Bar',
    accountId: '1695711684136476',
    type: 'paid',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
  },
  {
    id: 'hilton-nz',
    name: 'Hilton New Zealand',
    accountId: '250039821854564',
    type: 'paid',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
  },
  {
    id: 'hilton-fiji',
    name: 'Hilton Fiji Beach Resort and Spa',
    accountId: '647548016018133',
    type: 'paid',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
  },
  {
    id: 'mai-sunset',
    name: 'Mai Sunset Beach Resort',
    accountId: '996924450165919',
    type: 'organic',
    status: 'active',
    currency: 'NZD',
    hasLeadGen: false,
  },
]

export function getClient(id: string): Client | undefined {
  return CLIENTS.find((c) => c.id === id)
}
