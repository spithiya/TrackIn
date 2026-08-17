import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Permission = 'manage_students' | 'view_history' | 'view_analytics' | 'control_checkin'

export interface AccessContext {
  userId: string
  orgId: string
  role: 'owner' | 'staff'
  permissions: Record<Permission, boolean>
}

const OWNER_PERMISSIONS: Record<Permission, boolean> = {
  manage_students: true,
  view_history: true,
  view_analytics: true,
  control_checkin: true,
}

export async function getAccessContext(): Promise<AccessContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles').select('role, org_id').eq('id', user.id).single()
  if (!profile) return null

  if (profile.role === 'owner') {
    return { userId: user.id, orgId: profile.org_id, role: 'owner', permissions: OWNER_PERMISSIONS }
  }

  const { data: member } = await supabase
    .from('staff_members')
    .select('can_manage_students, can_view_history, can_view_analytics, can_control_checkin')
    .eq('profile_id', user.id)
    .maybeSingle()

  return {
    userId: user.id,
    orgId: profile.org_id,
    role: 'staff',
    permissions: {
      manage_students: member?.can_manage_students ?? false,
      view_history: member?.can_view_history ?? false,
      view_analytics: member?.can_view_analytics ?? false,
      control_checkin: member?.can_control_checkin ?? false,
    },
  }
}

export function hasAnyPermission(ctx: AccessContext): boolean {
  return ctx.role === 'owner' || Object.values(ctx.permissions).some(Boolean)
}

// ── Server Component (page-level) guards — redirect on failure ──

export async function requireAccess(perm: Permission): Promise<AccessContext> {
  const ctx = await getAccessContext()
  if (!ctx) redirect('/auth/login')
  if (!ctx.permissions[perm]) redirect('/')
  return ctx
}

export async function requireAnyAccess(): Promise<AccessContext> {
  const ctx = await getAccessContext()
  if (!ctx) redirect('/auth/login')
  if (!hasAnyPermission(ctx)) redirect('/')
  return ctx
}

export async function requireOwner(): Promise<AccessContext> {
  const ctx = await getAccessContext()
  if (!ctx) redirect('/auth/login')
  if (ctx.role !== 'owner') redirect('/')
  return ctx
}

// ── Server Action guards — return an error instead of redirecting ──

export async function requirePermissionForAction(
  perm: Permission
): Promise<{ orgId: string; error?: undefined } | { orgId?: undefined; error: string }> {
  const ctx = await getAccessContext()
  if (!ctx) return { error: 'Not authenticated.' }
  if (!ctx.permissions[perm]) return { error: 'You do not have permission to do this.' }
  return { orgId: ctx.orgId }
}

export async function requireOwnerForAction(): Promise<
  { orgId: string; error?: undefined } | { orgId?: undefined; error: string }
> {
  const ctx = await getAccessContext()
  if (!ctx) return { error: 'Not authenticated.' }
  if (ctx.role !== 'owner') return { error: 'Only the owner can do this.' }
  return { orgId: ctx.orgId }
}
