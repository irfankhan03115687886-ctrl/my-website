'use client';

import { useEffect, useRef } from 'react';

export default function CursorGlow() {
  const glowRef = useRef(null);
  const pos = useRef({ x: 0, y: 0, curX: 0, curY: 0 });
  const raf = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const el = glowRef.current;
    if (!el) return;

    pos.current.x = window.innerWidth / 2;
    pos.current.y = window.innerHeight / 2;
    pos.current.curX = pos.current.x;
    pos.current.curY = pos.current.y;

    function handleMove(e) {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      el.classList.add('active');
    }
    function handleLeave() {
      el.classList.remove('active');
    }

    function tick() {
      pos.current.curX += (pos.current.x - pos.current.curX) * 0.12;
      pos.current.curY += (pos.current.y - pos.current.curY) * 0.12;
      el.style.transform = `translate(${pos.current.curX}px, ${pos.current.curY}px)`;
      raf.current = requestAnimationFrame(tick);
    }

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseleave', handleLeave);
    raf.current = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return <div ref={glowRef} className="cursor-glow" aria-hidden="true" />;
}
