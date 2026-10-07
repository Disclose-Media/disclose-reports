'use client'

export function ExportButton({ clientId, clientType, period, customFrom, customTo }: {
  clientId: string
  clientType?: string
  period: string
  customFrom?: string
  customTo?: string
}) {
  function handleExport() {
    const isCustom = period === 'custom'
    // Organic and Google clients don't have a dedicated PDF route — use print view instead
    if (clientType === 'organic' || clientType === 'google') {
      let url = `/client/${clientId}?period=${period}`
      if (isCustom && customFrom && customTo) url += `&from=${customFrom}&to=${customTo}`
      const win = window.open(url, '_blank')
      if (win) win.onload = () => setTimeout(() => win.print(), 800)
      return
    }
    let url = `/pdf/${clientId}?period=${period}`
    if (isCustom && customFrom && customTo) {
      url += `&from=${customFrom}&to=${customTo}`
    }
    window.open(url, '_blank')
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
