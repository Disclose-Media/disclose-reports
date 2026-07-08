'use client'

export function ExportButton({ clientName, period }: { clientName: string; period: string }) {
  function handleExport() {
    document.title = `${clientName} — ${period} — Disclose Media Report`
    window.print()
    setTimeout(() => {
      document.title = 'Disclose Media — Client Reports'
    }, 1000)
  }

  return (
    <button
      onClick={handleExport}
      className="print:hidden flex items-center gap-2 px-4 py-2 bg-[#C8972D] hover:bg-[#B8871D] text-[#111111] text-[11px] font-bold rounded-[6px] transition-colors duration-150"
      style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.05em' }}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M2 9v2.5h9V9M6.5 1v7M4 6l2.5 2.5L9 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Export PDF
    </button>
  )
}
