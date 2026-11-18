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

  // Test API call if token worked
  let apiResult: string = 'skipped'
  if (accessToken) {
    try {
      const res = await fetch('https://googleads.googleapis.com/v23/customers/4035238447/googleAds:search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
          'login-customer-id': process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: 'SELECT campaign.id, campaign.name, metrics.impressions FROM campaign LIMIT 3' }),
        cache: 'no-store',
      })
      const text = await res.text()
      apiResult = `HTTP ${res.status}: ${text.slice(0, 300)}`
    } catch (e) {
      apiResult = `ERROR: ${e}`
    }
  }

  return NextResponse.json({ configured, tokenResult, apiResult })
}
