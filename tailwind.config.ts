import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tmavá obsidiánová paleta + pergamenové/zlaté akcenty (fantasy immersive)
        obsidian: '#0b0d12',
        ink: {
          900: '#0b0d12',
          800: '#11141c',
          700: '#171b25',
          600: '#1f2430',
          500: '#2a303d',
          400: '#3a4150',
        },
        parchment: '#e9ddc3',
        ember: '#c9913f', // primární zlatý akcent
        'ember-dim': '#8a6428',
        arcane: '#7d8ae0', // sekundární „magický" akcent
        water: '#16384f',
        'water-deep': '#0f2738',
      },
      fontFamily: {
        // Display = serif (nadpisy, logo), body = systémový sans. Žádný build-time fetch → funguje offline.
        display: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 0 0 1px rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.45)',
        rail: 'inset -1px 0 0 rgba(255,255,255,0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
