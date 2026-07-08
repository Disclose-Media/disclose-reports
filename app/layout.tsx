import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Disclose Media — Client Reports',
  description: 'Live performance reporting by Disclose Media',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-dm-offwhite antialiased">
        <div className="flex min-h-screen">
          <Suspense fallback={null}>
            <Sidebar />
          </Suspense>
          <div className="flex-1 lg:ml-52 min-w-0">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
