import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getWindsorInstagramData } from '@/lib/windsor'
import type { DatePreset } from '@/lib/meta'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const period = (request.nextUrl.searchParams.get('period') ?? 'last_30d') as DatePreset
  try {
    const result = await getWindsorInstagramData('17841407870908848', period)
    return NextResponse.json({ ok: true, period, summary: result.summary, dailyCount: result.daily.length, firstDay: result.daily[0] ?? null })
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) })
  }
}
