import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Disclose Media — Client Reports',
  description: 'Live Meta performance reporting by Disclose Media',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0A0A0A] antialiased">
        {children}
      </body>
    </html>
  )
}
