import { notFound } from 'next/navigation';
import { getPublishedPageBySlug } from '@/lib/pages';

export async function generateMetadata({ params }) {
  const page = await getPublishedPageBySlug(params.slug);
  if (!page) return {};
  return { title: page.title };
}

export default async function CustomPage({ params }) {
  const page = await getPublishedPageBySlug(params.slug);
  if (!page) notFound();

  return (
    <section className="mx-auto max-w-3xl bg-ink px-5 py-20 sm:px-8">
      <h1 className="font-display text-4xl italic text-cream">{page.title}</h1>
      <div className="mt-8 max-w-none whitespace-pre-wrap text-[15px] leading-relaxed text-cream/75">{page.content}</div>
    </section>
  );
}
