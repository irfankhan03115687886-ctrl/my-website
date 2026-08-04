export default function StampBadge({ label }) {
  if (!label) return null;
  return (
    <span className="absolute left-3 top-3 z-10 -rotate-3 rounded-sm border border-ember/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ember bg-canvas/90">
      {label}
    </span>
  );
}
