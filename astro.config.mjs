import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://calm-concha-4f483f.netlify.app',
  integrations: [sitemap()],
});
