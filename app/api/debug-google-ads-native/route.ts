import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const configured = {
    GOOGLE_ADS_CLIENT_ID: !!process.env.GOOGLE_ADS_CLIENT_ID,
    GOOGLE_ADS_CLIENT_SECRET: !!process.env.GOOGLE_ADS_CLIENT_SECRET,
    GOOGLE_ADS_REFRESH_TOKEN: !!process.env.GOOGLE_ADS_REFRESH_TOKEN,
    GOOGLE_ADS_LOGIN_CUSTOMER_ID: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ?? 'MISSING',
    GOOGLE_ADS_DEVELOPER_TOKEN: !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  }

  // Test OAuth
  let tokenResult: string
  let accessToken: string | null = null
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
        grant_type: 'refresh_token',
      }),
    })
    const data = await res.json() as { access_token?: string; error?: string }
    if (data.access_token) {
      accessToken = data.access_token
      tokenResult = 'OK'
    } else {
      tokenResult = `FAILED: ${data.error}`
    }
  } catch (e) {
    tokenResult = `ERROR: ${e}`
  }

  // Test the EXACT campaigns query from getGoogleAdsNativeData
  let apiResult: string = 'skipped'
  if (accessToken) {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const monthStart = today.slice(0, 8) + '01'
      const dateClause = `segments.date BETWEEN '${monthStart}' AND '${today}'`
      const query = `SELECT campaign.id, campaign.name, campaign.status, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.ctr, metrics.average_cpc, metrics.cost_per_conversion, metrics.conversion_rate, metrics.search_impression_share FROM campaign WHERE ${dateClause} AND campaign.status != 'REMOVED' ORDER BY metrics.cost_micros DESC`
      const res = await fetch('https://googleads.googleapis.com/v23/customers/4035238447/googleAds:search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
          'login-customer-id': process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
        cache: 'no-store',
      })
      const data = await res.json() as { results?: unknown[]; error?: { message?: string } }
      apiResult = `HTTP ${res.status}, results=${data.results?.length ?? 0}, error=${data.error?.message ?? 'none'}`
    } catch (e) {
      apiResult = `ERROR: ${e}`
    }
  }

  // Test isGoogleAdsNativeConfigured
  const { isGoogleAdsNativeConfigured, getGoogleAdsNativeData } = await import('@/lib/google-ads-native')
  const isConfigured = isGoogleAdsNativeConfigured()

  let nativeDataResult: string = 'skipped'
  if (isConfigured) {
    try {
      const data = await getGoogleAdsNativeData('403-523-8447', 'this_month')
      nativeDataResult = data === null
        ? 'NULL (campRows was empty)'
        : `OK — campaigns=${data.campaigns.length}, keywords=${data.keywords.length}, searchTerms=${data.searchTerms.length}, ads=${data.ads.length}`
    } catch (e) {
      nativeDataResult = `THREW: ${e}`
    }
  }

  return NextResponse.json({ configured, tokenResult, isConfigured, apiResult, nativeDataResult })
}
