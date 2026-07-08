'use client'

import { useState } from 'react'

export function ShareButton({ shareUrl }: { shareUrl: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`print:hidden flex items-center gap-2 px-4 py-2 text-[11px] font-bold rounded-[6px] border transition-all duration-150 ${
        copied
          ? 'bg-emerald-600 border-emerald-600 text-white'
          : 'bg-transparent border-[#C8972D] text-[#C8972D] hover:bg-[#C8972D] hover:text-[#111111]'
      }`}
      style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.04em' }}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Link Copied
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V8M8 1h3m0 0v3m0-3L5 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Share
        </>
      )}
    </button>
  )
}
