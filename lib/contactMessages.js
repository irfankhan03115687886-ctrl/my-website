// lib/contactMessages.js
import { query } from '@/lib/db';
import { ensureAppSchema } from '@/lib/ensureSchema';

export async function createContactMessage({ name, email, subject, message }) {
  await ensureAppSchema();
  const result = await query(
    `insert into contact_messages (name, email, subject, message) values ($1, $2, $3, $4) returning *`,
    [name, email, subject || null, message]
  );
  return result.rows[0];
}

export async function getContactMessages() {
  try {
    await ensureAppSchema();
    const result = await query(`select * from contact_messages order by created_at desc`);
    return result.rows;
  } catch (err) {
    console.error('[contact messages] getContactMessages failed', err.message);
    return [];
  }
}

export async function getContactMessageCounts() {
  try {
    await ensureAppSchema();
    const result = await query(
      `select count(*) filter (where not is_read) as unread, count(*) as total from contact_messages`
    );
    const row = result.rows[0] || {};
    return { unread: Number(row.unread || 0), total: Number(row.total || 0) };
  } catch (err) {
    console.error('[contact messages] getContactMessageCounts failed', err.message);
    return { unread: 0, total: 0 };
  }
}

export async function setContactMessageRead(id, isRead) {
  await ensureAppSchema();
  const result = await query(`update contact_messages set is_read = $2 where id = $1 returning *`, [id, isRead]);
  return result.rows[0] || null;
}

export async function deleteContactMessage(id) {
  await ensureAppSchema();
  await query(`delete from contact_messages where id = $1`, [id]);
}
