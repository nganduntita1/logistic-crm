import { NextResponse } from 'next/server'
import { deactivateOrganizationEmployee } from '@/lib/auth/org-user-management'

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      userId?: string
    }

    const result = await deactivateOrganizationEmployee({ userId: body.userId ?? '' })

    if (result.error) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to deactivate employee.' },
      { status: 500 }
    )
  }
}