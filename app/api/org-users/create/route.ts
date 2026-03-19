import { NextResponse } from 'next/server'
import {
  provisionOrganizationUser,
  type ManagedOrgUserRole,
} from '@/lib/auth/org-user-management'

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string
      fullName?: string
      role?: ManagedOrgUserRole
      password?: string
    }

    const result = await provisionOrganizationUser({
      email: body.email ?? '',
      fullName: body.fullName ?? '',
      role: (body.role ?? 'operator') as ManagedOrgUserRole,
      password: body.password ?? '',
    })

    if (result.error) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create organization user.' },
      { status: 500 }
    )
  }
}