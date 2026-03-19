import { NextResponse } from 'next/server'
import { ensureAuthenticatedProfile } from '@/lib/auth/ensure-profile'

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      fullName?: string
      role?: 'admin' | 'operator' | 'driver'
    }

    const result = await ensureAuthenticatedProfile(body.fullName, body.role)

    if (result.error) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to ensure profile' },
      { status: 500 }
    )
  }
}