# Open issues / TODO

Tracked items deferred from the initial build. Buttondown / GoatCounter / IONOS
usernames in the travel header are **guesses** until the accounts exist. Do not
treat analytics or email as live.

- [ ] **Buttondown list + first test subscribe.** Form is on `/travel` header
      (`embed-subscribe/skintastic`); create the publication, confirm the embed
      username, set From/reply to `hello@skintastic.site`. Do not send a digest
      until one real subscriber exists.
- [ ] **`hello@skintastic.site` forwarding on IONOS.** Needed so signup mail is
      trusted (From/reply identity). Cannot be set in static HTML.
- [ ] **GoatCounter site id.** Script points at `skintastic.goatcounter.com`;
      create the site and, after a real Pages deploy, confirm `deal_open` /
      `bag_hint_shown` / `email_submit`. Local `goatcounter.queue` is not
      recording.
- [x] **Commit `travel/board.js` and `travel/deals.json` with the header.**
      Those files ship with this board so Pages does not 404 the script or feed.
- [x] **Email signup markup on `/travel`.** Header Buttondown embed is in the
      HTML. The list itself is still the unchecked item above.
- [ ] **Skincare landing form** still a placeholder (`onsubmit="return false"`).
- [x] **Travel page content is placeholder.** Deals board is the product; search
      is demoted to a `<details>` tab.
- [ ] **Skincare content is placeholder.** Confirm real product/positioning and refine copy.
- [ ] **Analytics live.** GoatCounter script is on `/travel`; the site id is
      still the unchecked item above.
- [ ] **No favicon asset beyond inline emoji.** Replace with a real brand favicon when available.
- [ ] **Flight search returns cached prices only.** Travelpayouts `/v1/prices/cheap` returns historical cheapest prices per month, not real-time availability. Consider adding a note on the UI or upgrading to the async search API for live results.
- [ ] **Free-text search parser is basic.** City extraction relies on simple regex. Works for clear inputs ("London to Rome") but can fail on ambiguous phrasing. Could improve with a proper NLP approach or autocomplete inputs.
- [ ] **Hotel search not yet added.** Travel page only searches flights. Add a hotel search tab (Hotellook via Travelpayouts) when travel search earns it.
