import { NextResponse } from 'next/server'
import { resendOrganizationEmployeeInvite } from '@/lib/auth/org-user-management'

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      userId?: string
    }

    const result = await resendOrganizationEmployeeInvite({ userId: body.userId ?? '' })

    if (result.error) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send reset link.' },
      { status: 500 }
    )
  }
}