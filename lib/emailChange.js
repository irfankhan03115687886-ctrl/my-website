// lib/emailChange.js
import { randomBytes, createHash } from 'crypto';
import { query } from '@/lib/db';
import { ensureAppSchema } from '@/lib/ensureSchema';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function requestEmailChange(userId, newEmail) {
  await ensureAppSchema();
  const existing = await query('select id from users where email = $1', [newEmail]);
  if (existing.rows[0]) {
    return { ok: false, message: 'That email is already in use.' };
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await query('update users set pending_email = $2 where id = $1', [userId, newEmail]);
  await query(
    `insert into email_change_tokens (user_id, new_email, token_hash, expires_at) values ($1, $2, $3, $4)`,
    [userId, newEmail, hashToken(token), expiresAt]
  );
  return { ok: true, token };
}

export async function confirmEmailChange(token) {
  await ensureAppSchema();
  const result = await query(
    `select * from email_change_tokens where token_hash = $1 and used_at is null and expires_at > now()`,
    [hashToken(token)]
  );
  const record = result.rows[0];
  if (!record) return { ok: false, message: 'This verification link is invalid or has expired.' };

  const conflict = await query('select id from users where email = $1 and id != $2', [record.new_email, record.user_id]);
  if (conflict.rows[0]) {
    return { ok: false, message: 'That email is already in use.' };
  }

  await query('update users set email = $2, pending_email = null where id = $1', [record.user_id, record.new_email]);
  await query('update email_change_tokens set used_at = now() where id = $1', [record.id]);
  return { ok: true, email: record.new_email };
}
