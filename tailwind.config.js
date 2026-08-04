/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        'ink-2': 'rgb(var(--c-ink-2) / <alpha-value>)',
        forest: 'rgb(var(--c-forest) / <alpha-value>)',
        'forest-2': 'rgb(var(--c-forest-2) / <alpha-value>)',
        canvas: 'rgb(var(--c-canvas) / <alpha-value>)',
        'canvas-2': 'rgb(var(--c-canvas-2) / <alpha-value>)',
        brass: 'rgb(var(--c-brass) / <alpha-value>)',
        'brass-light': 'rgb(var(--c-brass-light) / <alpha-value>)',
        ember: 'rgb(var(--c-ember) / <alpha-value>)',
        cream: 'rgb(var(--c-cream) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
      backgroundImage: {
        aurora: 'radial-gradient(120% 90% at 20% 0%, rgba(21,101,78,0.22) 0%, rgba(9,58,43,0.0) 55%), radial-gradient(90% 70% at 85% 10%, rgba(148,68,47,0.16) 0%, rgba(17,24,28,0) 60%)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(-2%, 3%) scale(1.05)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.92) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        bump: {
          '0%, 100%': { transform: 'scale(1)' },
          '35%': { transform: 'scale(1.35)' },
          '60%': { transform: 'scale(0.92)' },
        },
        emberFloat: {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '10%': { opacity: '0.8' },
          '90%': { opacity: '0.6' },
          '100%': { transform: 'translateY(-140px) translateX(20px)', opacity: '0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 0px rgba(21,101,78,0.0)' },
          '50%': { boxShadow: '0 0 22px rgba(21,101,78,0.45)' },
        },
      },
      animation: {
        marquee: 'marquee 42s linear infinite',
        drift: 'drift 16s ease-in-out infinite',
        rise: 'rise 0.7s cubic-bezier(.16,.84,.44,1) forwards',
        'pop-in': 'popIn 0.25s cubic-bezier(.16,.84,.44,1) both',
        bump: 'bump 0.4s ease-in-out',
        ember: 'emberFloat linear infinite',
        'glow-pulse': 'glowPulse 2.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
