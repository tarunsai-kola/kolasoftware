import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── Existing Next.js scaffold variables ────────────────────────────────
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',

        // ── Per-restaurant brand palette ─────────────────────────────────────
        // These map to CSS custom properties injected by ThemeProvider.
        // All values are runtime-dynamic — the same compiled CSS file serves
        // every restaurant with different colours.
        //
        // Usage:
        //   bg-brand          → restaurant's primary colour
        //   bg-brand-light    → 15% lighter tint (hover states, backgrounds)
        //   bg-brand-dark     → 15% darker shade (pressed states, borders)
        //   bg-brand-muted    → 12% opacity tint (subtle backgrounds, badges)
        //   text-brand        → primary colour text
        //   border-brand      → primary colour border
        //
        brand: {
          DEFAULT: 'var(--restaurant-primary)',
          light:   'var(--restaurant-primary-light)',
          dark:    'var(--restaurant-primary-dark)',
          muted:   'var(--restaurant-primary-muted)',
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        marquee: 'marquee 10s linear infinite',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
      },

      // ── Per-restaurant font ───────────────────────────────────────────────
      // fontFamily.brand maps to the restaurant's chosen font family.
      // Usage: font-brand
      fontFamily: {
        brand: ['var(--restaurant-font)', 'system-ui', 'sans-serif'],
      },

      // ── Ring / outline colours using brand ───────────────────────────────
      // Tailwind JIT can resolve ring-brand, outline-brand etc.
      // via the colors extension above — no extra config needed.

      // ── Box shadow with brand colour ──────────────────────────────────────
      // Usage: shadow-brand (subtle glow using muted primary)
      boxShadow: {
        brand: '0 0 0 3px var(--restaurant-primary-muted)',
        'brand-md': '0 4px 14px var(--restaurant-primary-muted)',
      },
    },
  },
  plugins: [],
}

export default config
