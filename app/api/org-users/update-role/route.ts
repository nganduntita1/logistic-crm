import { NextResponse } from 'next/server'
import {
  updateOrganizationEmployeeRole,
  type ManagedOrgUserRole,
} from '@/lib/auth/org-user-management'

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      userId?: string
      role?: ManagedOrgUserRole
    }

    const result = await updateOrganizationEmployeeRole({
      userId: body.userId ?? '',
      role: (body.role ?? 'operator') as ManagedOrgUserRole,
    })

    if (result.error) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update employee role.' },
      { status: 500 }
    )
  }
}