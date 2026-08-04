import Image from 'next/image';

const IMAGES = [
  { src: 'https://images.unsplash.com/photo-1516939884455-1445c8652f83?q=80&w=600&auto=format&fit=crop', alt: 'Hiker crossing a ridge at dusk' },
  { src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=600&auto=format&fit=crop', alt: 'Tent glowing at a night campsite' },
  { src: 'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?q=80&w=600&auto=format&fit=crop', alt: 'Backpack detail on a rocky trail' },
  { src: 'https://images.unsplash.com/photo-1521401830884-6c03c1c87ebb?q=80&w=600&auto=format&fit=crop', alt: 'Boots resting by a campfire' },
  { src: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?q=80&w=600&auto=format&fit=crop', alt: 'Trail winding through misty mountains' },
  { src: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=600&auto=format&fit=crop', alt: 'Starry sky above a mountain camp' },
];

function Track({ ariaHidden }) {
  return (
    <div className="flex shrink-0 animate-marquee gap-4 pr-4" aria-hidden={ariaHidden}>
      {IMAGES.map((img, i) => (
        <div key={i} className="relative h-56 w-40 shrink-0 overflow-hidden rounded-sm border border-brass/20 sm:h-64 sm:w-48">
          <Image src={img.src} alt={ariaHidden ? '' : img.alt} fill sizes="200px" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

export default function Marquee() {
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="flex w-max">
        <Track />
        <Track ariaHidden />
      </div>
    </div>
  );
}
