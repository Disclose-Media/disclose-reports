import { NextResponse } from 'next/server'
import { getWindsorInstagramData } from '@/lib/windsor'

export async function GET(): Promise<NextResponse> {
  try {
    const result = await getWindsorInstagramData('17841407870908848', 'last_30d')
    return NextResponse.json({ ok: true, summary: result.summary, dailyCount: result.daily.length, firstDay: result.daily[0] ?? null })
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) })
  }
}
