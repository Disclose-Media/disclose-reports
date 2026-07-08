'use client'

import { useActionState } from 'react'
import { login } from './actions'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-white border border-[#E8E4DC] rounded-[8px] overflow-hidden">

          {/* Gold top bar */}
          <div style={{ height: '3px', background: 'linear-gradient(90deg, #C8972D 0%, #F0D080 50%, #C8972D 100%)' }} />

          <div className="px-8 py-10">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <img
                src="/dm-logo-dark.png"
                alt="Disclose Media"
                className="h-12 w-auto object-contain mb-4"
              />
              <p
                className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#111111]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Disclose Media
              </p>
              <p
                className="text-[9px] uppercase tracking-[0.18em] mt-0.5"
                style={{ fontFamily: 'Montserrat, sans-serif', color: '#C8972D', fontWeight: 600 }}
              >
                Reporting Portal
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#E8E4DC] mb-8" />

            <h1
              className="text-[18px] font-extrabold text-[#111111] text-center mb-1"
              style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}
            >
              Sign In
            </h1>
            <p
              className="text-[12px] text-[#AAAAAA] text-center mb-7"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Enter your password to access client reports
            </p>

            <form action={action} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#888888] mb-2"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter password"
                  className="w-full px-4 py-3 text-[13px] text-[#111111] bg-[#F8F6F2] border border-[#E8E4DC] rounded-[6px] outline-none focus:border-[#C8972D] focus:ring-2 focus:ring-[rgba(200,151,45,0.12)] transition-all placeholder:text-[#CCCCCC]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              {state?.error && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-[6px]">
                  <span className="text-red-500 text-xs font-bold shrink-0">!</span>
                  <p className="text-[12px] text-red-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {state.error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full py-3 px-4 bg-[#C8972D] hover:bg-[#B8871D] disabled:opacity-60 text-white text-[12px] font-bold rounded-[6px] transition-colors duration-150 flex items-center justify-center gap-2"
                style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.06em' }}
              >
                {pending ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>
        </div>

        <p
          className="text-center text-[10px] text-[#CCCCCC] mt-6 uppercase tracking-[0.12em]"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Disclose Media · Confidential
        </p>
      </div>
    </div>
  )
}
