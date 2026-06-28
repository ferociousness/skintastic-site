# Open issues / TODO

Tracked items deferred from the initial build.

- [ ] **Email signup is non-functional.** The hero form on `/` (and `/travel`) is a placeholder; a static site can't capture submissions. Wire it to a free backend (Formspree, Buttondown, or a Google Form) so signups actually arrive.
- [ ] **`hello@skintastic.site` does not receive mail.** Needs email hosting or forwarding on the IONOS domain, or swap the address. Applies to skincare + travel pages.
- [ ] **Travel page content is placeholder.** Confirm what the travel landing page is actually for and refine copy/offer/CTA.
- [ ] **Skincare content is placeholder.** Confirm real product/positioning and refine copy.
- [ ] **Analytics not set up.** Optionally add privacy-friendly analytics (e.g. Plausible/GoatCounter) later.
- [ ] **No favicon asset beyond inline emoji.** Replace with a real brand favicon when available.
- [ ] **Flight search returns cached prices only.** Travelpayouts `/v1/prices/cheap` returns historical cheapest prices per month, not real-time availability. Consider adding a note on the UI or upgrading to the async search API for live results.
- [ ] **Free-text search parser is basic.** City extraction relies on simple regex. Works for clear inputs ("London to Rome") but can fail on ambiguous phrasing. Could improve with a proper NLP approach or autocomplete inputs.
- [ ] **Hotel search not yet added.** Travel page only searches flights. Add a hotel search tab (Hotellook via Travelpayouts) when ready.
