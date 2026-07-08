import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Disclose Media Brand Colors — exact from brand guidelines
        gold: '#C8972D',
        'gold-light': '#F0D080',
        'gold-dark': '#8B6320',
        'gold-bronze': '#7A5010',
        'dm-black': '#111111',
        'dm-white': '#FFFFFF',
        'dm-offwhite': '#F8F6F2',
        'dm-lightgrey': '#E8E4DC',
        'dm-midgrey': '#AAAAAA',
        'dm-darkgrey': '#888888',
        'dm-charcoal': '#444444',
        // Sidebar chrome
        'chrome': '#111111',
        'chrome-border': '#1A1A1A',
        'chrome-hover': '#1C1C1C',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'brand': '-0.02em',
        'label': '0.18em',
        'wide-label': '0.15em',
      },
      borderRadius: {
        'card': '8px',
      },
    },
  },
  plugins: [],
}
export default config
