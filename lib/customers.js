// lib/customers.js
import { query } from '@/lib/db';

// "Customers" means any user without an admin role — regular shoppers.
export async function listCustomers() {
  const result = await query(
    `select u.id, u.first_name, u.last_name, u.email, u.disabled, u.created_at,
            coalesce(count(o.id), 0)::int as order_count,
            coalesce(sum(o.total) filter (where o.status not in ('failed','refunded')), 0)::float as total_spent
     from users u
     left join orders o on o.user_id = u.id
     where u.role is null and u.is_admin = false
     group by u.id
     order by u.created_at desc`
  );
  return result.rows;
}

export async function setCustomerDisabled(id, disabled) {
  await query('update users set disabled = $2 where id = $1', [id, disabled]);
}
