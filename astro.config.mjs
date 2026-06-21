import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// TODO: change `site` to your real domain once it's registered (e.g. https://helmward.com).
// It's used for the sitemap, RSS feed, and canonical URLs.
export default defineConfig({
  site: 'https://helmward.com',
  integrations: [sitemap()],
});
