const EMBERS = [
  { left: '8%', size: 3, duration: 9, delay: 0 },
  { left: '18%', size: 2, duration: 11, delay: 1.5 },
  { left: '29%', size: 4, duration: 8, delay: 3 },
  { left: '41%', size: 2, duration: 12, delay: 0.8 },
  { left: '53%', size: 3, duration: 10, delay: 2.2 },
  { left: '64%', size: 2, duration: 13, delay: 4 },
  { left: '73%', size: 4, duration: 9, delay: 1.2 },
  { left: '84%', size: 3, duration: 11, delay: 2.8 },
  { left: '92%', size: 2, duration: 10, delay: 0.4 },
  { left: '36%', size: 3, duration: 14, delay: 5 },
  { left: '58%', size: 2, duration: 8, delay: 3.6 },
  { left: '15%', size: 3, duration: 12, delay: 6 },
];

export default function Embers() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {EMBERS.map((e, i) => (
        <span
          key={i}
          className="absolute bottom-0 rounded-full bg-brass-light animate-ember"
          style={{
            left: e.left,
            width: e.size,
            height: e.size,
            boxShadow: '0 0 6px 1px rgba(216,179,126,0.7)',
            animationDuration: `${e.duration}s`,
            animationDelay: `${e.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
