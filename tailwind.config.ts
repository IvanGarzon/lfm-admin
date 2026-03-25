import type { Config } from 'tailwindcss';

/**
 * Tailwind CSS v4 Configuration
 *
 * This config is primarily for JavaScript runtime access (e.g., useBreakpoints hook).
 * Styling configuration should be done in CSS using @theme directives in globals.css.
 *
 * @see https://tailwindcss.com/docs/configuration
 */
const config: Config = {
  theme: {
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
};

export default config;
