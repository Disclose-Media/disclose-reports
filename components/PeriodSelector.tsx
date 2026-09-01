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

function parseDate(s: string): Date | null {
  if (!s) return null
  const d = new Date(s + 'T00:00:00')
  return isNaN(d.getTime()) ? null : d
}

function fmt(d: Date) {
  return d.toISOString().slice(0, 10)
}

function MiniCalendar({
  value,
  min,
  max,
  onChange,
}: {
  value: string
  min?: string
  max?: string
  onChange: (v: string) => void
}) {
  const today = new Date()
  const selected = parseDate(value)
  const [view, setView] = useState(() => {
    const d = selected || today
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const { year, month } = view
  const firstDay = new Date(year, month, 1)
  // Monday-first: 0=Mon … 6=Sun
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  function prevMonth() {
    setView(v => {
      const m = v.month === 0 ? 11 : v.month - 1
      const y = v.month === 0 ? v.year - 1 : v.year
      return { year: y, month: m }
    })
  }
  function nextMonth() {
    setView(v => {
      const m = v.month === 11 ? 0 : v.month + 1
      const y = v.month === 11 ? v.year + 1 : v.year
      return { year: y, month: m }
    })
  }

  function pick(day: number) {
    const d = new Date(year, month, day)
    const s = fmt(d)
    if (min && s < min) return
    if (max && s > max) return
    onChange(s)
  }

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={prevMonth}
          className="w-6 h-6 flex items-center justify-center rounded text-[#888888] hover:text-[#C8972D] transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="text-[11px] font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="w-6 h-6 flex items-center justify-center rounded text-[#888888] hover:text-[#C8972D] transition-colors"
        >
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

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const dateStr = fmt(new Date(year, month, day))
          const isSelected = value === dateStr
          const isToday = fmt(today) === dateStr
          const disabled = (min && dateStr < min) || (max && dateStr > max)
          return (
            <button
              key={i}
              onClick={() => pick(day)}
              disabled={!!disabled}
              className={`
                w-7 h-7 mx-auto flex items-center justify-center rounded-full text-[11px] transition-all
                ${isSelected ? 'bg-[#C8972D] text-white font-bold' : ''}
                ${!isSelected && isToday ? 'border border-[#C8972D] text-[#C8972D]' : ''}
                ${!isSelected && !isToday && !disabled ? 'text-[#CCCCCC] hover:bg-[#2A2A2A] hover:text-white' : ''}
                ${disabled ? 'text-[#444444] cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {day}
            </button>
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

  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

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
          {isCustom && customFrom && customTo
            ? `${customFrom} → ${customTo}`
            : 'Custom'}
        </button>

        {showPicker && (
          <div
            className="absolute left-0 top-full mt-2 z-50 bg-[#111111] border border-[#2A2A2A] rounded-[8px] p-4 shadow-xl"
            style={{ minWidth: '280px' }}
          >
            <p
              className="text-[9px] uppercase tracking-[0.18em] text-[#C8972D] font-bold mb-3"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
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

            {/* Calendar */}
            <div className="border border-[#222222] rounded-[6px] bg-[#161616] p-3 mb-3">
              {activeField === 'from' ? (
                <MiniCalendar value={from} max={today} onChange={handleFromChange} />
              ) : (
                <MiniCalendar value={to} min={from} max={today} onChange={handleToChange} />
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
