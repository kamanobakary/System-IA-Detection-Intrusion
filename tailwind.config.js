/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette cybersécurité sombre
        cyber: {
          bg:       '#0a0e1a',
          surface:  '#0f1629',
          card:     '#131b2e',
          border:   '#1e2d4a',
          cyan:     '#00d4ff',
          green:    '#00ff88',
          yellow:   '#ffd700',
          red:      '#ff4757',
          orange:   '#ff6b35',
          muted:    '#4a6080',
          text:     '#c8d8f0',
          textDim:  '#6b82a0',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.8), 0 0 40px rgba(0, 212, 255, 0.3)' },
        },
      },
      boxShadow: {
        'cyber': '0 0 20px rgba(0, 212, 255, 0.15)',
        'cyber-red': '0 0 20px rgba(255, 71, 87, 0.2)',
        'cyber-green': '0 0 20px rgba(0, 255, 136, 0.15)',
      },
    },
  },
  plugins: [],
};
