/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        /** Page titles */
        display: ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
        /** Section / H1 mobile */
        title: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '700' }],
        /** Section H2 */
        subtitle: ['1.0625rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        /** Body */
        body: ['1rem', { lineHeight: '1.5rem' }],
        /** Secondary */
        small: ['0.875rem', { lineHeight: '1.375rem' }],
        /** Captions, labels */
        caption: ['0.75rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        card: '0.75rem',
        'card-lg': '1rem',
        modal: '1rem',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        modal: 'var(--shadow-modal)',
      },
      colors: {
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--color-surface-2) / <alpha-value>)',
        'surface-3': 'rgb(var(--color-surface-3) / <alpha-value>)',
        edge: 'rgb(var(--color-edge) / <alpha-value>)',
        'edge-subtle': 'rgb(var(--color-edge-subtle) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--color-ink-muted) / <alpha-value>)',
        'ink-faint': 'rgb(var(--color-ink-faint) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-soft': 'rgb(var(--color-primary-soft) / <alpha-value>)',
        'on-primary': 'rgb(var(--color-on-primary) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        'danger-soft': 'rgb(var(--color-danger-soft) / <alpha-value>)',
        'on-danger': 'rgb(var(--color-on-danger) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        'warning-soft': 'rgb(var(--color-warning-soft) / <alpha-value>)',
        'on-warning': 'rgb(var(--color-on-warning) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
        'info-soft': 'rgb(var(--color-info-soft) / <alpha-value>)',
        'on-info': 'rgb(var(--color-on-info) / <alpha-value>)',
        overlay: 'rgb(var(--color-overlay) / <alpha-value>)',
        voice: 'rgb(var(--color-voice) / <alpha-value>)',
        'voice-soft': 'rgb(var(--color-voice-soft) / <alpha-value>)',
        'on-voice': 'rgb(var(--color-on-voice) / <alpha-value>)',
        /** Preview tray behind white document / iframe */
        preview: 'rgb(var(--color-preview-tray) / <alpha-value>)',
      },
      backgroundImage: {
        'auth-hero': 'var(--gradient-auth)',
        'about-hero': 'var(--gradient-about)',
      },
    },
  },
  plugins: [],
};
