'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const PRESETS = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: 'last_7d' },
  { label: '14 Days', value: 'last_14d' },
  { label: '30 Days', value: 'last_30d' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: '90 Days', value: 'last_90d' },
]

type Props = {
  period: string
  customFrom?: string
  customTo?: string
}

export function PeriodSelector({ period, customFrom, customTo }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const isCustom = period === 'custom'

  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [showPicker, setShowPicker] = useState(false)
  const [from, setFrom] = useState(customFrom || thirtyDaysAgo)
  const [to, setTo] = useState(customTo || today)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    if (showPicker) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPicker])

  function navigate(value: string) {
    router.push(`${pathname}?period=${value}`)
  }

  function applyCustom() {
    if (!from || !to) return
    router.push(`${pathname}?period=custom&from=${from}&to=${to}`)
    setShowPicker(false)
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {PRESETS.map((preset) => (
        <button
          key={preset.value}
          onClick={() => navigate(preset.value)}
          className={`text-[11px] px-3.5 py-1.5 rounded-full border transition-all duration-150 ${
            period === preset.value && !isCustom
              ? 'bg-[#C8972D] border-[#C8972D] text-white font-bold'
              : 'border-[#2A2A2A] text-[#888888] hover:border-[#C8972D] hover:text-[#C8972D]'
          }`}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {preset.label}
        </button>
      ))}

      {/* Custom range button + picker */}
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setShowPicker((v) => !v)}
          className={`text-[11px] px-3.5 py-1.5 rounded-full border transition-all duration-150 ${
            isCustom
              ? 'bg-[#C8972D] border-[#C8972D] text-white font-bold'
              : 'border-[#2A2A2A] text-[#888888] hover:border-[#C8972D] hover:text-[#C8972D]'
          }`}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {isCustom && customFrom && customTo
            ? `${customFrom} → ${customTo}`
            : 'Custom'}
        </button>

        {showPicker && (
          <div
            className="absolute left-0 top-full mt-2 z-50 bg-[#111111] border border-[#2A2A2A] rounded-[8px] p-4 shadow-xl"
            style={{ minWidth: '260px' }}
          >
            <p
              className="text-[9px] uppercase tracking-[0.15em] text-[#C8972D] font-bold mb-3"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Custom Date Range
            </p>
            <div className="flex flex-col gap-3 mb-4">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] text-[#666666]" style={{ fontFamily: 'Inter, sans-serif' }}>From</span>
                <input
                  type="date"
                  value={from}
                  max={to || today}
                  onChange={(e) => setFrom(e.target.value)}
                  className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[4px] px-2 py-1.5 text-[12px] text-white focus:outline-none focus:border-[#C8972D]"
                  style={{ fontFamily: 'Inter, sans-serif', colorScheme: 'dark' }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] text-[#666666]" style={{ fontFamily: 'Inter, sans-serif' }}>To</span>
                <input
                  type="date"
                  value={to}
                  min={from}
                  max={today}
                  onChange={(e) => setTo(e.target.value)}
                  className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[4px] px-2 py-1.5 text-[12px] text-white focus:outline-none focus:border-[#C8972D]"
                  style={{ fontFamily: 'Inter, sans-serif', colorScheme: 'dark' }}
                />
              </label>
            </div>
            <button
              onClick={applyCustom}
              disabled={!from || !to || from > to}
              className="w-full py-2 rounded-[4px] text-[11px] font-bold bg-[#C8972D] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#b8872d] transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
