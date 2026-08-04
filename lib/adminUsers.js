// lib/adminUsers.js
import { query } from '@/lib/db';

export async function listAdminUsers() {
  const result = await query(
    `select id, first_name, last_name, email, role, disabled, is_admin, created_at
     from users
     where role is not null or is_admin = true
     order by created_at asc`
  );
  return result.rows;
}

export async function findUserByEmail(email) {
  const result = await query(
    `select id, first_name, last_name, email, role, disabled, is_admin from users where email = $1`,
    [email.trim().toLowerCase()]
  );
  return result.rows[0] || null;
}

export async function setUserRole(userId, role) {
  const result = await query(
    `update users set role = $2, is_admin = true where id = $1 returning id, first_name, last_name, email, role, disabled`,
    [userId, role]
  );
  return result.rows[0];
}

export async function removeAdminRole(userId) {
  await query(`update users set role = null, is_admin = false where id = $1`, [userId]);
}

export async function setUserDisabled(userId, disabled) {
  await query(`update users set disabled = $2 where id = $1`, [userId, disabled]);
}
