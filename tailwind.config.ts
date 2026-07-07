import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#C9973A',
        'gold-light': '#E8B86D',
        'gold-dim': 'rgba(201,151,58,0.15)',
        'dm-dark': '#0A0A0A',
        'dm-dark2': '#141414',
        'dm-dark3': '#1E1E1E',
        'dm-dark4': '#282828',
        'dm-border': 'rgba(201,151,58,0.2)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
