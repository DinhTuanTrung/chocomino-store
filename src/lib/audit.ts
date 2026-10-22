import { createClient } from '@/lib/supabase/client';

export type AuditEntity =
  | 'order'
  | 'product'
  | 'product_variant'
  | 'customer'
  | 'auth'
  | 'settings'
  | 'return_request';

export interface AuditLogInput {
  action: string;
  entity: AuditEntity;
  entityId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  beforeData?: any;
  afterData?: any;
}

export interface AuditLogItem {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  before_data: any;
  after_data: any;
  created_at: string;
}

/**
 * Record an action to the audit_log table (FR-A-62)
 * Non-blocking: logs warnings on failures without interrupting core transaction.
 */
export async function recordAuditLog(input: AuditLogInput): Promise<boolean> {
  try {
    const supabase = createClient();

    const actorMeta = {
      name: input.actorName || 'Trung (Chủ shop)',
      email: input.actorEmail || 'admin@chocomino.local',
      role: input.actorRole || 'owner',
    };

    const enrichedAfterData = {
      ...(input.afterData || {}),
      _actor: actorMeta,
      _logged_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('audit_log').insert({
      action: input.action,
      entity: input.entity,
      entity_id: input.entityId || null,
      before_data: input.beforeData || null,
      after_data: enrichedAfterData,
    });

    if (error) {
      console.warn('[AuditLog] Insert warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[AuditLog] Exception while recording log:', err);
    return false;
  }
}
