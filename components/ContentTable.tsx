'use client'

import { useState } from 'react'
import type { WindsorPost } from '@/lib/windsor'

type SortKey = 'date' | 'reach' | 'views' | 'likes' | 'shares' | 'saves' | 'comments'
type SortDir = 'asc' | 'desc'

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`
  if (n >= 1_000) return n.toLocaleString()
  return n === 0 ? '—' : String(n)
}

function PlatformIcon({ platform }: { platform: 'facebook' | 'instagram' }) {
  if (platform === 'instagram') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="ig-ct" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F58529"/>
            <stop offset="50%" stopColor="#DD2A7B"/>
            <stop offset="100%" stopColor="#8134AF"/>
          </linearGradient>
        </defs>
        <path fill="url(#ig-ct)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    )
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

function TypeBadge({ type }: { type: WindsorPost['type'] }) {
  const styles: Record<WindsorPost['type'], string> = {
    reel:  'bg-[#111111] text-[#C8972D] border-[#2A2A2A]',
    video: 'bg-[#111111] text-[#888888] border-[#2A2A2A]',
    photo: 'bg-[#F8F6F2] text-[#888888] border-[#E8E4DC]',
    story: 'bg-[#F8F6F2] text-[#888888] border-[#E8E4DC]',
    text:  'bg-[#F8F6F2] text-[#AAAAAA] border-[#E8E4DC]',
  }
  return (
    <span className={`text-[8px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border ${styles[type]}`}
      style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {type}
    </span>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg width="8" height="10" viewBox="0 0 8 10" fill="none" className={`ml-1 ${active ? 'opacity-100' : 'opacity-30'}`}>
      <path d="M4 1v8M1.5 3L4 1l2.5 2" stroke={active && dir === 'asc' ? '#C8972D' : 'currentColor'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1.5 7L4 9l2.5-2" stroke={active && dir === 'desc' ? '#C8972D' : 'currentColor'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function ContentTable({ posts }: { posts: WindsorPost[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filter, setFilter] = useState<'all' | 'facebook' | 'instagram'>('all')

  if (posts.length === 0) return null

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const getValue = (p: WindsorPost, key: SortKey): number | string => {
    if (key === 'date') return p.publishedAt
    return p[key as keyof WindsorPost] as number
  }

  const filtered = filter === 'all' ? posts : posts.filter(p => p.platform === filter)
  const sorted = [...filtered].sort((a, b) => {
    const av = getValue(a, sortKey), bv = getValue(b, sortKey)
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  const hasFb = posts.some(p => p.platform === 'facebook')
  const hasIg = posts.some(p => p.platform === 'instagram')

  const cols: { key: SortKey; label: string }[] = [
    { key: 'reach', label: 'Reach' },
    { key: 'views', label: 'Views' },
    { key: 'likes', label: 'Likes' },
    { key: 'comments', label: 'Comments' },
    { key: 'shares', label: 'Shares' },
    { key: 'saves', label: 'Saves' },
  ]

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div style={{ width: '2px', height: '16px', background: '#C8972D', borderRadius: '1px' }} />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#888888]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Content Performance
          </h2>
          <span className="text-[10px] text-[#AAAAAA] bg-white border border-[#E8E4DC] px-2 py-0.5 rounded-full" style={{ fontFamily: 'Inter, sans-serif' }}>
            {sorted.length} posts
          </span>
        </div>
        {(hasFb && hasIg) && (
          <div className="flex items-center gap-1 bg-white border border-[#E8E4DC] rounded-[6px] p-1">
            {(['all', 'facebook', 'instagram'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[10px] px-2.5 py-1 rounded-[4px] font-medium transition-all ${
                  filter === f ? 'bg-[#111111] text-white' : 'text-[#888888] hover:text-[#111111]'
                }`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {f === 'all' ? 'All' : f === 'facebook' ? 'Facebook' : 'Instagram'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-[#E8E4DC] rounded-[8px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#F0EEE9]">
                <th className="px-4 py-3 w-[340px]">
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#AAAAAA]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Content
                  </span>
                </th>
                <th className="px-3 py-3 whitespace-nowrap">
                  <button onClick={() => handleSort('date')} className="flex items-center text-[9px] font-bold uppercase tracking-[0.15em] text-[#AAAAAA] hover:text-[#111111]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Date <SortIcon active={sortKey === 'date'} dir={sortDir} />
                  </button>
                </th>
                {cols.map(col => (
                  <th key={col.key} className="px-3 py-3 whitespace-nowrap">
                    <button onClick={() => handleSort(col.key)} className="flex items-center text-[9px] font-bold uppercase tracking-[0.15em] text-[#AAAAAA] hover:text-[#111111]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {col.label} <SortIcon active={sortKey === col.key} dir={sortDir} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((post) => {
                const date = new Date(post.publishedAt)
                const dateStr = date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
                const timeStr = date.toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit' })
                const caption = post.caption.length > 60 ? post.caption.slice(0, 60) + '…' : post.caption || 'No caption'
                return (
                  <tr key={post.id} className="border-b border-[#F8F6F2] hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* Thumbnail */}
                        <div className="shrink-0 w-10 h-10 rounded-[4px] overflow-hidden bg-[#F0EEE9] border border-[#E8E4DC] relative">
                          {post.thumbnailUrl ? (
                            <img src={post.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#CCCCCC]">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <rect x="1" y="3" width="14" height="10" rx="1.5" fill="currentColor" opacity="0.3"/>
                                <circle cx="5.5" cy="6.5" r="1.5" fill="currentColor"/>
                                <path d="M1 11l4-4 3 3 2-2 5 5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                              </svg>
                            </div>
                          )}
                          <div className="absolute bottom-0.5 left-0.5">
                            <PlatformIcon platform={post.platform} />
                          </div>
                        </div>
                        <div className="min-w-0">
                          {post.permalink ? (
                            <a
                              href={post.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-[#111111] font-medium truncate max-w-[240px] hover:text-[#C8972D] transition-colors block"
                              style={{ fontFamily: 'Inter, sans-serif' }}
                            >
                              {caption}
                            </a>
                          ) : (
                            <p className="text-[11px] text-[#111111] font-medium truncate max-w-[240px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {caption}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1">
                            <TypeBadge type={post.type} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <p className="text-[11px] text-[#111111]" style={{ fontFamily: 'Inter, sans-serif' }}>{dateStr}</p>
                      <p className="text-[10px] text-[#AAAAAA]" style={{ fontFamily: 'Inter, sans-serif' }}>{timeStr}</p>
                    </td>
                    {cols.map(col => (
                      <td key={col.key} className="px-3 py-3 whitespace-nowrap">
                        <span className={`text-[12px] font-semibold ${col.key === 'reach' ? 'text-[#C8972D]' : 'text-[#111111]'}`} style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {fmt(post[col.key as keyof WindsorPost] as number)}
                        </span>
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
