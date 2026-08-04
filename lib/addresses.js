// lib/addresses.js
import { query } from '@/lib/db';

export async function listAddresses(userId) {
  const result = await query('select * from addresses where user_id = $1 order by created_at asc', [userId]);
  return result.rows;
}

export async function getAddress(id, userId) {
  const result = await query('select * from addresses where id = $1 and user_id = $2', [id, userId]);
  return result.rows[0] || null;
}

export async function createAddress(userId, fields) {
  const { label, fullName, phone, line1, line2, city, region, postcode, country } = fields;
  const result = await query(
    `insert into addresses (user_id, label, full_name, phone, line1, line2, city, region, postcode, country)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
    [userId, label || null, fullName, phone || null, line1, line2 || null, city, region || null, postcode, country || 'GB']
  );
  return result.rows[0];
}

export async function updateAddress(id, userId, fields) {
  const { label, fullName, phone, line1, line2, city, region, postcode, country } = fields;
  const result = await query(
    `update addresses set label=$3, full_name=$4, phone=$5, line1=$6, line2=$7, city=$8, region=$9, postcode=$10, country=$11
     where id = $1 and user_id = $2 returning *`,
    [id, userId, label || null, fullName, phone || null, line1, line2 || null, city, region || null, postcode, country || 'GB']
  );
  return result.rows[0];
}

export async function deleteAddress(id, userId) {
  await query('delete from addresses where id = $1 and user_id = $2', [id, userId]);
}

export async function setDefaultShipping(id, userId) {
  await query('update addresses set is_default_shipping = false where user_id = $1', [userId]);
  await query('update addresses set is_default_shipping = true where id = $1 and user_id = $2', [id, userId]);
}

export async function setDefaultBilling(id, userId) {
  await query('update addresses set is_default_billing = false where user_id = $1', [userId]);
  await query('update addresses set is_default_billing = true where id = $1 and user_id = $2', [id, userId]);
}
