/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      colors: {
        // Warm paper stock rather than pure white — the product shots are
        // photographed on white, so a warm ground keeps them from looking
        // like floating cutouts.
        paper: '#FBFAF8',
        panel: '#F3F1ED',
        ink: '#12110F',
        muted: '#6B6862',
        line: 'rgba(18, 17, 15, 0.11)',
        wood: {
          DEFAULT: '#16803C',
          deep: '#0F5C2B',
          light: '#E8F1E9',
        },
        brass: '#A98B4F',
        walnut: '#4A342266',
      },
      letterSpacing: {
        eyebrow: '0.22em',
      },
    },
  },
  plugins: [],
}
