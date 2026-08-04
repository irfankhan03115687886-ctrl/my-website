// lib/hero.js
import { query } from '@/lib/db';

// Matches the original hard-coded hero copy from app/page.js — used until
// a real row exists in `hero_content` (edited at /dashboard/admin/hero).
export const DEFAULT_HERO = {
  eyebrow: 'Autumn Collection — 02 · Night Trail',
  title: 'Gear that earns its wear',
  highlight: 'after dark.',
  subtitle:
    'Waxed canvas packs, ripstop shells and brass-buckled boots, built in small batches for people who leave the trailhead before sunrise.',
  cta_label: 'Shop the collection',
  cta_href: '/products',
  secondary_cta_label: 'Our story',
  secondary_cta_href: '/#story',
  image_url: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=1600&auto=format&fit=crop',
};

export async function getHeroContent() {
  try {
    const result = await query('select * from hero_content where id = 1');
    if (result.rows[0]) return { ...DEFAULT_HERO, ...result.rows[0] };
    return DEFAULT_HERO;
  } catch {
    return DEFAULT_HERO;
  }
}

export async function updateHeroContent(fields) {
  const {
    eyebrow,
    title,
    highlight,
    subtitle,
    ctaLabel,
    ctaHref,
    secondaryCtaLabel,
    secondaryCtaHref,
    imageUrl,
  } = fields;

  const result = await query(
    `insert into hero_content (
       id, eyebrow, title, highlight, subtitle, cta_label, cta_href,
       secondary_cta_label, secondary_cta_href, image_url, updated_at
     ) values (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, now())
     on conflict (id) do update set
       eyebrow = $1, title = $2, highlight = $3, subtitle = $4, cta_label = $5, cta_href = $6,
       secondary_cta_label = $7, secondary_cta_href = $8, image_url = $9, updated_at = now()
     returning *`,
    [
      eyebrow || null,
      title || null,
      highlight || null,
      subtitle || null,
      ctaLabel || null,
      ctaHref || null,
      secondaryCtaLabel || null,
      secondaryCtaHref || null,
      imageUrl || null,
    ]
  );
  return result.rows[0];
}
