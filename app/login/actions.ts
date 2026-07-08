'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(_: unknown, formData: FormData): Promise<{ error: string }> {
  const password = formData.get('password') as string

  if (!password) {
    return { error: 'Please enter a password.' }
  }

  if (password !== process.env.AUTH_PASSWORD) {
    return { error: 'Incorrect password. Please try again.' }
  }

  const secret = process.env.AUTH_SECRET
  if (!secret) {
    return { error: 'Server configuration error. Contact your administrator.' }
  }

  cookies().set('dm-auth', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  redirect('/')
}
