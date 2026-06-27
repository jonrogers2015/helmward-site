# Helmward — marketing site

Astro static site for **Helmward** (the agent OS). Deploys to **Cloudflare Pages**. The Agent
OS content pipeline publishes by writing markdown into `src/content/blog/` and pushing.

> Currently parked inside the `agent-os` repo at `helmward-site/`. Move it to its own GitHub
> repo before deploying (it's self-contained — copy the folder).

## Run locally

```
npm install
npm run dev        # http://localhost:4321
npm run build      # output in dist/
npm run preview    # preview the production build
```

Requires Node 18+ (Node 20 LTS recommended).

## Structure

```
helmward-site/
├── astro.config.mjs        # set `site` to your real domain
├── src/
│   ├── layouts/Base.astro  # head/SEO/OG, nav, footer
│   ├── pages/
│   │   ├── index.astro     # landing page
│   │   ├── blog/index.astro      # blog list
│   │   ├── blog/[...slug].astro  # post page (+ Article JSON-LD)
│   │   └── rss.xml.js      # RSS feed
│   ├── content/
│   │   ├── config.ts       # blog frontmatter schema
│   │   └── blog/*.md       # posts (the pipeline writes here)
│   └── styles/global.css
└── public/                 # robots.txt, favicon.svg, og.png (add this)
```

## Publish a post (what the Agent OS pipeline does)

1. Write `src/content/blog/<slug>.md` with frontmatter:
   ```
   ---
   title: "..."
   description: "..."
   pubDate: 2026-06-17
   tags: ["seo"]
   draft: false
   ---
   # body...
   ```
2. `git commit && git push` → Cloudflare Pages rebuilds and deploys automatically.

## Deploy (one-time, when you're at the machine)

1. Create a GitHub repo and push this folder.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output dir: `dist`
3. Add your custom domain in the Pages project (Cloudflare Registrar makes DNS one click).
4. Update `site` in `astro.config.mjs` and the `Sitemap:` line in `public/robots.txt` to the
   real domain.

## TODO before launch

- [ ] Register domain (helmward.com / .ai) + USPTO trademark check.
- [ ] Add `public/og.png` (1200×630 social preview).
- [ ] Replace the waitlist form with a real Beehiiv/MailerLite embed.
- [ ] Add Google Search Console (submit sitemap) + Cloudflare Web Analytics.

