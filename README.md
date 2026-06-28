# skintastic.site

Static landing page for **Skintastic**, hosted free on GitHub Pages with a custom IONOS domain.

## Local preview

```bash
python3 -m http.server 8000
# visit http://localhost:8000
```

## Files

| File | Purpose |
|------|---------|
| `index.html` | Skincare landing page |
| `styles.css` | Shared styles for all pages |
| `travel/index.html` | Travel landing page (blue theme) with flight search |
| `worker.js` | Cloudflare Worker source — CORS proxy for Travelpayouts API |
| `config.js` | **Gitignored.** Local config (apiProxyUrl). Copy from `config.example.js` |
| `config.example.js` | Config template — commit this, not `config.js` |
| `CNAME` | Custom domain for GitHub Pages |
| `.github/workflows/deploy.yml` | GitHub Actions deploy — injects `config.js` from secrets |

## Deploy

Pushes to `main` trigger the **Deploy to GitHub Pages** GitHub Actions workflow, which:
1. Generates `config.js` from the `API_PROXY_URL` GitHub secret
2. Uploads the full site (including the generated `config.js`) to GitHub Pages

Do **not** use the legacy "Deploy from branch" Pages setting — source must be **GitHub Actions**.

## Travelpayouts integration

The travel page (`/travel`) has a flight search with two modes:
- **Structured** — origin, destination, dates, adults, children
- **Free text** — natural language e.g. "London to Rome in August, 2 people"

Search results are fetched from the **Travelpayouts Data API** via a **Cloudflare Worker** proxy (needed to add CORS headers). Each result card links to Aviasales with the affiliate marker embedded.

### Cloudflare Worker

- Worker name: `skintastic-api` (account: aegon-ta123)
- URL: `https://skintastic-api.aegon-ta123.workers.dev`
- Secret on Worker: `TRAVELPAYOUTS_TOKEN` — the Travelpayouts partner API token
- GitHub secret: `API_PROXY_URL` = the Worker URL above

The Travelpayouts affiliate marker (`544179`) is embedded in the tracking script in `<head>` of every page and in Aviasales booking deep links.

### Adding/changing the Worker URL

1. Deploy or update the Worker at dash.cloudflare.com → Workers & Pages
2. Update the `API_PROXY_URL` GitHub secret in repo Settings → Secrets → Actions
3. Re-run the **Deploy to GitHub Pages** workflow (or push any commit)

## DNS (IONOS)

| Record | Type | Value |
|--------|------|-------|
| `@` | A | 185.199.108.153 |
| `@` | AAAA | 2606:50c0:8000::153 |
| `www` | CNAME | ferociousness.github.io |

HTTPS is enforced (Let's Encrypt cert issued by GitHub Pages, auto-renewed).

## Open issues

See `OPEN_ISSUES.md`.
