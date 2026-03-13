import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#f0f4fa',
          100: '#d6e4f0',
          600: '#1e5f8e',
          700: '#1a4f78',
          800: '#153f62',
          900: '#1e3a5f',
        },
      },
    },
  },
  plugins: [],
};

export default config;
