export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 20px 60px rgba(15, 23, 42, 0.12)',
      },
      colors: {
        surface: '#111827',
        accent: '#7C3AED',
        accentLight: '#C4B5FD',
      },
    },
  },
  plugins: [],
};
