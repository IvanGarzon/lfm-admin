import { SiteConfig } from '@/types';
import { env } from '@/env';

const site_url = env.NEXT_PUBLIC_APP_URL;

export const site = {
  author: 'lehenbizico',
  name: 'Las Flores Melbourne',
  description: '(Admin) - Las Flores Melbourne',
  title: 'Las Flores Melbourne',
  theme: 'system',
  email: 'lasfloresmelb@gmail.com',
  links: {
    instagram: 'https://www.instagram.com/lasfloresmelb',
    facebook: 'https://www.facebook.com/lasfloresmelbourne',
  },
  url: site_url,
  logo: `${site_url}/static/images/logo.png`,
  image: `${site_url}/static/images/logo.png`,
  socialBanner: '/static/images/twitter-card.jpg',
  locale: 'en-AU',
  language: 'en-US',
  postDateTemplate: {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  analytics: {
    // If you want to use an analytics provider you have to add it to the
    // content security policy in the `next.config.js` file.
    // supports plausible, simpleAnalytics, umami or googleAnalytics
    plausibleDataDomain: '', // e.g. tailwind-nextjs-starter-blog.vercel.app
    simpleAnalytics: false, // true or false
    umamiWebsiteId: '', // e.g. 123e4567-e89b-12d3-a456-426614174000
    googleAnalyticsId: '', // e.g. UA-000000-2 or G-XXXXXXX
    posthogAnalyticsId: '', // posthog.init e.g. phc_5yXvArzvRdqtZIsHkEm3Fkkhm3d0bEYUXCaFISzqPSQ
  },
  blur64:
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=',
};
