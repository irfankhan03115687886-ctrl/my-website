// lib/passwordReset.js
import { randomBytes, createHash } from 'crypto';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { ensureAppSchema } from '@/lib/ensureSchema';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

// Returns the raw token (to put in the email link) — only the hash is
// stored, so a database leak alone can't be used to reset anyone's
// password.
export async function createPasswordResetToken(userId) {
  await ensureAppSchema();
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await query(
    `insert into password_reset_tokens (user_id, token_hash, expires_at) values ($1, $2, $3)`,
    [userId, hashToken(token), expiresAt]
  );
  return token;
}

// Looks up a token without consuming it — used to show a valid/expired
// state on the reset-password page before the person submits a new one.
export async function findValidResetToken(token) {
  await ensureAppSchema();
  const result = await query(
    `select prt.*, u.email from password_reset_tokens prt
     join users u on u.id = prt.user_id
     where prt.token_hash = $1 and prt.used_at is null and prt.expires_at > now()`,
    [hashToken(token)]
  );
  return result.rows[0] || null;
}

export async function resetPasswordWithToken(token, newPassword) {
  const record = await findValidResetToken(token);
  if (!record) return { ok: false, message: 'This reset link is invalid or has expired.' };

  const passwordHash = await hashPassword(newPassword);
  await query('update users set password_hash = $2 where id = $1', [record.user_id, passwordHash]);
  await query('update password_reset_tokens set used_at = now() where id = $1', [record.id]);
  // Invalidate any other outstanding reset tokens for this user too.
  await query('update password_reset_tokens set used_at = now() where user_id = $1 and used_at is null', [record.user_id]);
  return { ok: true };
}
