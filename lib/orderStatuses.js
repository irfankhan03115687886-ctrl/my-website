// lib/orderStatuses.js
// Pure constants shared by both server code (lib/orders.js) and client
// components (e.g. AdminOrderStatusForm.jsx). Kept dependency-free so
// importing it from a 'use client' component never pulls in `pg`.

export const ORDER_STEPS = [
  { key: 'pending', label: 'Order placed' },
  { key: 'paid', label: 'Payment confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

export const ALL_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'failed', 'refunded'];

export function stepIndexForStatus(status) {
  const idx = ORDER_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}
