// lib/activityLog.js
import { query } from '@/lib/db';

// Fire-and-forget audit logging. Never throws — a logging failure should
// never block the admin action itself, but we do surface it in the
// server console so it's not silently lost.
export async function logActivity({ adminId, adminEmail, action, entity, entityId, metadata }) {
  try {
    await query(
      `insert into admin_activity_logs (admin_user_id, admin_email, action, entity, entity_id, metadata)
       values ($1, $2, $3, $4, $5, $6)`,
      [adminId || null, adminEmail || null, action, entity || null, entityId != null ? String(entityId) : null, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (err) {
    console.error('[activity log]', err);
  }
}

export async function getActivityLog({ limit = 100 } = {}) {
  const result = await query(
    `select id, admin_email, action, entity, entity_id, metadata, created_at
     from admin_activity_logs order by created_at desc limit $1`,
    [limit]
  );
  return result.rows;
}
