import { Suspense } from 'react'
import { Sidebar } from '@/components/Sidebar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <div className="flex-1 lg:ml-52 min-w-0">
        {children}
      </div>
    </div>
  )
}
