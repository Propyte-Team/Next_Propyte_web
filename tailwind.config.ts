import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        propyte: {
          teal: '#5CE0D2',
          'teal-dark': '#4BCEC0',
          'teal-a11y': '#0D9488',
          navy: '#1A2F3F',
          aztec: '#0F1923',
          'deep-onyx': '#1A1A2E',
          graphite: '#2C2C2C',
          amber: '#F5A623',
          light: '#F4F6F8',
        },
        // Shorthand aliases
        navy: '#1A2F3F',
        teal: { DEFAULT: '#5CE0D2', dark: '#4BCEC0' },
        amber: '#F5A623',
        graphite: '#2C2C2C',
        'gray-light': '#F4F6F8',
        success: '#22C55E',
        error: '#EF4444',
        whatsapp: { DEFAULT: '#25D366', dark: '#1EBE57' },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'Inter', 'Arial', 'sans-serif'],
      },
      maxWidth: {
        'container-sm': '640px',
        'container-md': '1024px',
        'container-lg': '1280px',
        'container-xl': '1440px',
      },
      fontSize: {
        'h1': ['36px', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['28px', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['22px', { lineHeight: '1.35', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'price-card': ['22px', { lineHeight: '1.2', fontWeight: '700' }],
        'price-micro': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'metadata': ['14px', { lineHeight: '1.4', fontWeight: '500' }],
        'badge': ['12px', { lineHeight: '1.0', fontWeight: '600' }],
        'btn': ['16px', { lineHeight: '1.0', fontWeight: '600' }],
      },
      borderRadius: {
        'card': '12px',
        'btn': '8px',
        'badge': '4px',
        'pin': '4px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.12)',
        'pin': '0 2px 6px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
};
export default config;
