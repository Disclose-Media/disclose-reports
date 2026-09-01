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

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Always use local date — never toISOString() which shifts NZ timezone back a day
function fmtLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayLocal(): string {
  return fmtLocal(new Date())
}

function parseDate(s: string): Date | null {
  if (!s) return null
  // Parse as local date (avoid UTC shift)
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function MiniCalendar({
  value,
  rangeFrom,
  rangeTo,
  min,
  max,
  onChange,
}: {
  value: string
  rangeFrom?: string
  rangeTo?: string
  min?: string
  max?: string
  onChange: (v: string) => void
}) {
  const todayStr = todayLocal()
  const selected = parseDate(value)
  const [view, setView] = useState(() => {
    const d = selected || new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const { year, month } = view
  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7 // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  function prevMonth() {
    setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 })
  }
  function nextMonth() {
    setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 })
  }

  function pick(day: number) {
    const s = fmtLocal(new Date(year, month, day))
    if (min && s < min) return
    if (max && s > max) return
    onChange(s)
  }

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  // Range helpers
  const hasRange = rangeFrom && rangeTo && rangeFrom <= rangeTo

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="w-6 h-6 flex items-center justify-center rounded text-[#888888] hover:text-[#C8972D] transition-colors">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="text-[11px] font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} className="w-6 h-6 flex items-center justify-center rounded text-[#888888] hover:text-[#C8972D] transition-colors">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[9px] font-bold text-[#555555] py-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>{d}</div>
        ))}
      </div>

      {/* Days grid — render row by row for range bar highlighting */}
      <div className="grid grid-cols-7" style={{ rowGap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />

          const dateStr = fmtLocal(new Date(year, month, day))
          const isSelected = value === dateStr
          const isFrom = rangeFrom === dateStr
          const isTo = rangeTo === dateStr
          const isEndpoint = isFrom || isTo
          const isToday = todayStr === dateStr
          const inRange = hasRange && dateStr > rangeFrom! && dateStr < rangeTo!
          const disabled = (min && dateStr < min) || (max && dateStr > max)

          // Column position within week row (0=Mon … 6=Sun)
          const col = i % 7
          const isFirstInRow = col === 0
          const isLastInRow = col === 6

          return (
            <div key={i} className="relative flex items-center justify-center" style={{ height: 28 }}>
              {/* Range bar behind the day circle */}
              {(inRange || isEndpoint) && hasRange && (
                <div
                  className="absolute inset-y-0"
                  style={{
                    backgroundColor: 'rgba(200,151,45,0.18)',
                    left: (isFrom || isFirstInRow) ? '50%' : 0,
                    right: (isTo || isLastInRow) ? '50%' : 0,
                  }}
                />
              )}
              <button
                onClick={() => pick(day)}
                disabled={!!disabled}
                className={`
                  relative z-10 w-7 h-7 flex items-center justify-center rounded-full text-[11px] transition-all
                  ${isSelected || isEndpoint ? 'bg-[#C8972D] text-white font-bold' : ''}
                  ${!isEndpoint && isToday ? 'border border-[#C8972D] text-[#C8972D]' : ''}
                  ${!isEndpoint && !isToday && inRange ? 'text-white font-medium' : ''}
                  ${!isEndpoint && !isToday && !inRange && !disabled ? 'text-[#CCCCCC] hover:bg-[#2A2A2A] hover:text-white' : ''}
                  ${disabled ? 'text-[#444444] cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {day}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type Props = {
  period: string
  customFrom?: string
  customTo?: string
}

export function PeriodSelector({ period, customFrom, customTo }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const isCustom = period === 'custom'

  const today = todayLocal()
  const thirtyDaysAgo = fmtLocal(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

  const [showPicker, setShowPicker] = useState(false)
  const [from, setFrom] = useState(customFrom || thirtyDaysAgo)
  const [to, setTo] = useState(customTo || today)
  const [activeField, setActiveField] = useState<'from' | 'to'>('from')
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
    if (!from || !to || from > to) return
    router.push(`${pathname}?period=custom&from=${from}&to=${to}`)
    setShowPicker(false)
  }

  function handleFromChange(v: string) {
    setFrom(v)
    if (to && v > to) setTo(v)
    setActiveField('to')
  }

  function handleToChange(v: string) {
    setTo(v)
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
          {isCustom && customFrom && customTo ? `${customFrom} → ${customTo}` : 'Custom'}
        </button>

        {showPicker && (
          <div
            className="absolute left-0 top-full mt-2 z-50 bg-[#111111] border border-[#2A2A2A] rounded-[8px] p-4 shadow-xl"
            style={{ minWidth: '290px' }}
          >
            <p className="text-[9px] uppercase tracking-[0.18em] text-[#C8972D] font-bold mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Custom Date Range
            </p>

            {/* From / To tabs */}
            <div className="flex gap-2 mb-3">
              {(['from', 'to'] as const).map((field) => {
                const val = field === 'from' ? from : to
                const label = field === 'from' ? 'From' : 'To'
                return (
                  <button
                    key={field}
                    onClick={() => setActiveField(field)}
                    className={`flex-1 rounded-[4px] border px-2 py-1.5 text-left transition-all ${activeField === field ? 'border-[#C8972D] bg-[#1A1A1A]' : 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#444444]'}`}
                  >
                    <p className="text-[9px] text-[#555555] mb-0.5" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, letterSpacing: '0.1em' }}>{label}</p>
                    <p className="text-[12px] font-semibold text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {val || <span className="text-[#444444]">—</span>}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Calendar — always passes both from/to for range shading */}
            <div className="border border-[#222222] rounded-[6px] bg-[#161616] p-3 mb-3">
              {activeField === 'from' ? (
                <MiniCalendar
                  value={from}
                  rangeFrom={from}
                  rangeTo={to}
                  max={today}
                  onChange={handleFromChange}
                />
              ) : (
                <MiniCalendar
                  value={to}
                  rangeFrom={from}
                  rangeTo={to}
                  min={from}
                  max={today}
                  onChange={handleToChange}
                />
              )}
            </div>

            <button
              onClick={applyCustom}
              disabled={!from || !to || from > to}
              className="w-full py-2 rounded-[4px] text-[11px] font-bold bg-[#C8972D] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#b8872d] transition-colors"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Apply Range
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
