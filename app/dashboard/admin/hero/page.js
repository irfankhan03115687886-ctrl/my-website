import { getHeroContent } from '@/lib/hero';
import HeroEditor from '@/components/dashboard/HeroEditor';

export default async function DashboardHeroPage() {
  const hero = await getHeroContent();

  return (
    <div>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-brass-light">Homepage</span>
      <h1 className="mt-2 font-display text-3xl italic text-cream">Hero section.</h1>
      <p className="mt-2 max-w-xl text-sm text-cream/60">
        The first thing every visitor sees. Changes save straight to the database and go live immediately.
      </p>

      <div className="card-surface mt-7 p-7">
        <HeroEditor hero={hero} />
      </div>
    </div>
  );
}
