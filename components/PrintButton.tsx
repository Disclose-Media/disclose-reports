'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden flex items-center gap-2 px-3 py-1.5 bg-[#C8972D] hover:bg-[#B8871D] text-[#111111] text-[10px] font-bold rounded-[6px] transition-colors duration-150"
      style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.05em' }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 8.5v2h8v-2M6 1v6.5M3.5 5.5L6 8l2.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Download PDF
    </button>
  )
}
