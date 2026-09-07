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
| `travel/index.html` | TLV deals board + demoted search |
| `travel/board.js` | Loads `/travel/deals.json`, party slugs, bag line, analytics events |
| `travel/deals.json` | Daily public feed (pushed from DealsScouter CI). Never `feed_link`. |
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

## Deal board feed

`/travel` always fetches same-origin `travel/deals.json` (not a GitHub raw URL).
The private scanner repo (`AharonR/DealsScouter`) copies a **stripped** file here
after each daily scan (`SKINTASTIC_DEPLOY_KEY` write key on this repo). Contract:
`docs/BOARD_FEED.md` in DealsScouter. Path digits on `deep_link` must match
top-level `party`. The party picker reuses localStorage only when
`generated_at` matches the feed.

Do not commit `feed_link`, tokens, or `.env`. If a scan's public file is missing,
CI leaves yesterday's `deals.json` in place. Hand commits must `git add`
`travel/board.js` and `travel/deals.json` — they may be untracked.

## Email and analytics

- **Buttondown** header form on `/travel` (`embed-subscribe/skintastic`). Set the
  publication From/reply to `hello@skintastic.site` once IONOS forwarding works.
  Do not send a digest until at least one real subscriber exists.
- **GoatCounter** site `skintastic.goatcounter.com`. Custom events: `deal_open`,
  `bag_hint_shown`, `email_submit`.

## Travelpayouts integration

The travel page (`/travel`) has a flight search with two modes:
- **Structured** — origin, destination, dates, adults, children
- **Free text** — natural language e.g. "London to Rome in August, 2 people"

Search results are fetched from the **Travelpayouts Data API** via a **Cloudflare Worker** proxy (needed to add CORS headers). Each result card links to Aviasales with the affiliate marker embedded.

### Cloudflare Worker

- Worker name: `skintastic-api`
- URL: stored in the `API_PROXY_URL` GitHub Actions secret (see Cloudflare dashboard for the actual URL)
- Secret on Worker: `TRAVELPAYOUTS_TOKEN` — the Travelpayouts partner API token
- GitHub secret: `API_PROXY_URL` = the Worker URL

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
