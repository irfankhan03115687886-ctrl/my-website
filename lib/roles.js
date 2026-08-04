// lib/roles.js
// Central permission matrix. Every admin page and every admin API route
// checks access through `can(role, resource)` — nothing in the admin
// dashboard trusts a client-side flag, because role state can change
// between page loads (an admin can be demoted or disabled mid-session).

export const ROLES = ['super_admin', 'admin', 'manager', 'order_manager', 'product_manager', 'customer_support'];

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  order_manager: 'Order Manager',
  product_manager: 'Product Manager',
  customer_support: 'Customer Support',
};

export const ROLE_DESCRIPTIONS = {
  super_admin: 'Full access, including managing other admin users.',
  admin: 'Full access to store operations, but cannot manage admin users.',
  manager: 'Runs day-to-day operations: orders, products, and catalog.',
  order_manager: 'Handles order fulfillment only.',
  product_manager: 'Manages the product catalog and catalog taxonomy only.',
  customer_support: 'Read access to orders for helping customers.',
};

// Resources gated across the admin dashboard. Add a new key here (and to
// a role's list below) whenever a new admin section ships.
export const RESOURCES = [
  'dashboard',
  'orders',
  'products',
  'categories',
  'tags',
  'collections',
  'users',
  'settings',
  'activity',
  'contact_messages',
  'reviews',
];

export const RESOURCE_LABELS = {
  dashboard: 'Dashboard',
  orders: 'Orders',
  products: 'Products',
  categories: 'Categories',
  tags: 'Tags',
  collections: 'Collections',
  users: 'Admin Users',
  settings: 'Settings',
  activity: 'Activity Log',
  contact_messages: 'Contact Messages',
  reviews: 'Reviews',
};

const ROLE_PERMISSIONS = {
  super_admin: RESOURCES,
  admin: RESOURCES.filter((r) => r !== 'users'),
  manager: ['dashboard', 'orders', 'products', 'categories', 'tags', 'collections', 'reviews'],
  order_manager: ['dashboard', 'orders'],
  product_manager: ['dashboard', 'products', 'categories', 'tags', 'collections', 'reviews'],
  customer_support: ['dashboard', 'orders', 'contact_messages'],
};

export function can(role, resource) {
  if (!role) return false;
  return (ROLE_PERMISSIONS[role] || []).includes(resource);
}

export function permissionsFor(role) {
  return ROLE_PERMISSIONS[role] || [];
}

// super_admin and admin are treated as management-level roles for things
// like "can this role manage other admins' roles" (still gated by the
// `users` resource itself, which only super_admin holds).
export function isManagementRole(role) {
  return role === 'super_admin' || role === 'admin';
}
