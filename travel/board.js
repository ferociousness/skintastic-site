/* TLV deals board: load deals.json, label prices per adult, rewrite Aviasales
   slugs for the selected party. Fare data has no passenger dimension — a party
   only ever changes the booking link and the label, never the scanned price.
   Saved party in localStorage is reused only when generated_at matches the feed.
   Contract: docs in DealsScouter docs/BOARD_FEED.md */
(function () {
  const MARKER = '544179';
  const DEALS_URL = './deals.json';
  const PARTY_KEY = 'tlv-deals-party';
  const FAMILY = { adults: 2, children: 2, infants: 1 };
  const AIRLINES = {
    W4: 'Wizz Air',
    W6: 'Wizz Air',
    IZ: 'Arkia',
    '6H': 'Israir',
    LY: 'El Al',
    LX: 'Swiss',
    A3: 'Aegean',
    U2: 'easyJet',
    FR: 'Ryanair',
  };
  const EVENTS = {
    dealOpen: 'deal_open',
    bagHintShown: 'bag_hint_shown',
    emailSubmit: 'email_submit',
  };

  const $ = (id) => document.getElementById(id);
  const bagHintsShown = new Set();
  let sortMode = 'price';
  let monthFilter = '';

  function esc(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function track(name) {
    const payload = { path: name, title: name, event: true };
    if (window.goatcounter && typeof window.goatcounter.count === 'function') {
      window.goatcounter.count(payload);
      return;
    }
    window.goatcounter = window.goatcounter || {};
    window.goatcounter.queue = window.goatcounter.queue || [];
    window.goatcounter.queue.push(payload);
  }

  function aviasalesSlug({ from, dep, to, ret, adults, children = 0, infants = 0 }) {
    let slug = `${from}${dep}${to}`;
    if (ret) slug += ret;
    slug += adults;
    if (infants > 0) {
      slug += children || 0;
      slug += infants;
    } else if (children > 0) {
      slug += children;
    }
    return slug;
  }

  function aviasalesUrl(from, to, dep, ret, adults, children, infants, subId) {
    const slug = aviasalesSlug({ from, dep, to, ret, adults, children, infants });
    const params = new URLSearchParams({ currency: 'usd', marker: subId ? `${MARKER}.${subId}` : MARKER });
    return `https://www.aviasales.com/search/${slug}?${params}`;
  }

  function loadParty(payloadParty, generatedAt) {
    try {
      const saved = JSON.parse(localStorage.getItem(PARTY_KEY) || 'null');
      if (
        saved
        && Number.isInteger(saved.adults)
        && generatedAt
        && saved.generated_at === generatedAt
      ) {
        return clampParty(saved);
      }
    } catch { /* ignore */ }
    if (payloadParty && Number.isInteger(payloadParty.adults)) {
      return clampParty(payloadParty);
    }
    return { adults: 1, children: 0, infants: 0 };
  }

  function clampParty({ adults, children, infants }) {
    const a = Math.min(9, Math.max(1, parseInt(adults, 10) || 1));
    const c = Math.min(8, Math.max(0, parseInt(children, 10) || 0));
    const i = Math.min(9, Math.max(0, parseInt(infants, 10) || 0));
    const seats = Math.min(9, a + c);
    return {
      adults: a,
      children: seats - a,
      infants: Math.min(i, a),
    };
  }

  function saveParty(party, generatedAt) {
    localStorage.setItem(PARTY_KEY, JSON.stringify({
      adults: party.adults,
      children: party.children,
      infants: party.infants,
      generated_at: generatedAt || null,
    }));
  }

  function isSolo(party) {
    return party.adults === 1 && party.children === 0 && party.infants === 0;
  }

  function isFamily(party) {
    return party.adults === FAMILY.adults
      && party.children === FAMILY.children
      && party.infants === FAMILY.infants;
  }

  function noun(n, one, many) {
    return `${n} ${n === 1 ? one : many}`;
  }

  function describeParty(party) {
    if (isSolo(party)) return null;
    const parts = [noun(party.adults, 'adult', 'adults')];
    if (party.children) parts.push(noun(party.children, 'child', 'children'));
    if (party.infants) parts.push(noun(party.infants, 'infant', 'infants'));
    if (parts.length === 1) return parts[0];
    return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  }

  function dealCta(party) {
    return isSolo(party) ? 'Check this fare on Aviasales' : 'Check this route for your party';
  }

  function parseLocalDate(iso) {
    const [y, m, d] = iso.slice(0, 10).split('-');
    const label = new Date(`${y}-${m}-${d}T12:00:00`)
      .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    return { y, m, d, ddmm: d + m, label };
  }

  function foundAgo(foundAt, generatedAt) {
    const hours = (generatedAt - new Date(foundAt)) / 36e5;
    if (hours < 1) return 'found under an hour ago';
    if (hours < 48) return `found ${Math.round(hours)}h ago`;
    return `found ${Math.round(hours / 24)}d ago`;
  }

  function airlineName(code) {
    return AIRLINES[code] || code || '';
  }

  function monthKey(iso) {
    return String(iso || '').slice(0, 7);
  }

  function monthLabel(ym) {
    const [y, m] = String(ym).split('-');
    if (!y || !m) return ym;
    return new Date(`${y}-${m}-15T12:00:00`)
      .toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  }

  function uniqueMonths(deals) {
    return [...new Set(deals.map((d) => monthKey(d.depart_date)).filter(Boolean))].sort();
  }

  function visibleDeals(deals) {
    const list = monthFilter
      ? deals.filter((d) => monthKey(d.depart_date) === monthFilter)
      : deals.slice();
    const byPrice = (a, b) => a.price - b.price || a.depart_date.localeCompare(b.depart_date);
    const byDate = (a, b) => a.depart_date.localeCompare(b.depart_date) || a.price - b.price;
    list.sort(sortMode === 'date' ? byDate : byPrice);
    return list;
  }

  function renderMonthChips(deals) {
    const bar = $('month-bar');
    const months = uniqueMonths(deals);
    if (months.length < 2) {
      bar.hidden = true;
      bar.innerHTML = '';
      monthFilter = '';
      return;
    }
    bar.hidden = false;
    const chips = ['', ...months].map((ym) => {
      const on = monthFilter === ym ? ' tool-btn--on' : '';
      const label = ym ? monthLabel(ym) : 'All months';
      const value = ym ? ` data-month="${esc(ym)}"` : ' data-month=""';
      return `<button type="button" class="tool-btn${on}"${value}>${esc(label)}</button>`;
    });
    bar.innerHTML = chips.join('');
  }

  function subIdFromLink(url) {
    try {
      const marker = new URL(url).searchParams.get('marker') || '';
      const dot = marker.indexOf('.');
      return dot === -1 ? '' : marker.slice(dot + 1);
    } catch {
      return '';
    }
  }

  function renderCards(deals, party, generatedAt) {
    const grid = $('deals-grid');
    const empty = $('deals-empty');
    grid.innerHTML = '';
    const perAdult = !isSolo(party);
    const partyLabel = describeParty(party);
    const shown = visibleDeals(deals);

    if (empty) {
      if (!shown.length) {
        empty.hidden = false;
        empty.textContent = monthFilter
          ? `No upcoming fares in ${monthLabel(monthFilter)}. Try All months.`
          : 'No fares to show.';
      } else {
        empty.hidden = true;
        empty.textContent = '';
      }
    }

    shown.forEach((deal) => {
      const date = parseLocalDate(deal.depart_date);
      const stops = deal.transfers === 0
        ? 'Direct'
        : (deal.transfers === 1 ? '1 stop' : `${deal.transfers} stops`);
      const discount = Math.max(0, Math.floor((deal.route_discount || 0) * 100));
      const subId = subIdFromLink(deal.deep_link);
      const href = aviasalesUrl(
        deal.origin, deal.destination, date.ddmm, '',
        party.adults, party.children, party.infants, subId,
      );
      const airline = airlineName(deal.airline);
      const hint = deal.bag_hint || '';
      const blurb = deal.blurb || '';
      const cta = dealCta(party);
      const origin = deal.origin || 'TLV';
      const dest = deal.destination || '';
      const card = document.createElement('article');
      card.className = 'deal';
      card.innerHTML = `
        <div class="deal-head">
          <h3>${esc(deal.city)}</h3>
          <span class="chip">one-way</span>
        </div>
        <p class="deal-route">${esc(origin)} <span class="deal-arr">→</span> ${esc(dest)}</p>
        <p class="deal-facts">${esc(date.label)} · ${esc(stops)}${airline ? ` · ${esc(airline)}` : ''}</p>
        <p class="deal-price">
          <s>typically $${Math.round(deal.route_median)}</s>
          <strong>$${Math.round(deal.price)}</strong>
          ${perAdult ? '<span class="deal-unit">per adult</span>' : ''}
          <span class="deal-off">−${discount}%</span>
        </p>
        ${blurb ? `<p class="deal-blurb">${esc(blurb)}</p>` : ''}
        ${hint ? `<p class="deal-bags">${esc(hint)}</p>` : ''}
        <p class="deal-fresh">${esc(foundAgo(deal.found_at, generatedAt))}</p>
        <a class="deal-book" href="${esc(href)}" target="_blank" rel="noopener nofollow sponsored">${esc(cta)}</a>
      `;
      const book = card.querySelector('.deal-book');
      book.addEventListener('click', () => track(EVENTS.dealOpen));
      if (hint && !bagHintsShown.has(deal.id)) {
        bagHintsShown.add(deal.id || hint);
        track(EVENTS.bagHintShown);
      }
      grid.appendChild(card);
    });

    const note = $('party-note');
    if (partyLabel) {
      note.hidden = false;
      note.textContent = `Prices are per adult. Links open a search for ${partyLabel}. The printed date is a 1-adult outlier — read nearby dates. Sale buckets often have one or two seats.`;
    } else {
      note.hidden = true;
      note.textContent = '';
    }
  }

  function syncPartyInputs(party) {
    $('p-adults').value = party.adults;
    $('p-children').value = party.children;
    $('p-infants').value = party.infants;
    $('p-family').classList.toggle('party-preset--on', isFamily(party));
  }

  function readPartyInputs() {
    return clampParty({
      adults: $('p-adults').value,
      children: $('p-children').value,
      infants: $('p-infants').value,
    });
  }

  function stillUpcoming(deal, today) {
    return deal.depart_date >= today;
  }

  function todayISO() {
    const n = new Date();
    const y = n.getFullYear();
    const m = String(n.getMonth() + 1).padStart(2, '0');
    const d = String(n.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  async function init() {
    const status = $('deals-status');
    const form = $('digest-form');
    if (form) {
      form.addEventListener('submit', () => track(EVENTS.emailSubmit));
    }

    try {
      const res = await fetch(DEALS_URL);
      if (!res.ok) throw new Error(res.status);
      const payload = await res.json();
      const generatedAt = new Date(payload.generated_at);
      const upcoming = (payload.deals || [])
        .filter((d) => stillUpcoming(d, todayISO()))
        .sort((a, b) => a.price - b.price);

      let party = loadParty(payload.party, payload.generated_at);
      syncPartyInputs(party);

      const ageH = (Date.now() - generatedAt) / 36e5;
      const when = generatedAt.toLocaleString('en-GB', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
        timeZone: 'UTC',
      }) + ' UTC';

      if (!upcoming.length) {
        status.textContent = ageH > 48
          ? `No upcoming fares on the last board (${when}). Check back after the next scan.`
          : 'No fares cleared the bar today — we only list genuine standouts.';
        $('deals-grid').innerHTML = '';
        $('board-tools').hidden = true;
        return;
      }

      const scanLine = ageH > 48
        ? `last scan ${when}, so treat prices as hints.`
        : `spotted well below the usual price. Last scan ${when}.`;

      $('board-tools').hidden = false;

      const apply = () => {
        party = readPartyInputs();
        saveParty(party, payload.generated_at);
        syncPartyInputs(party);
        renderMonthChips(upcoming);
        renderCards(upcoming, party, generatedAt);
        const n = visibleDeals(upcoming).length;
        const monthBit = monthFilter ? ` in ${monthLabel(monthFilter)}` : '';
        status.textContent = n
          ? `${n} one-way fare${n === 1 ? '' : 's'} from Tel Aviv${monthBit} — ${scanLine}`
          : `No upcoming fares${monthBit} — ${scanLine}`;
      };

      apply();
      ['p-adults', 'p-children', 'p-infants'].forEach((id) => {
        $(id).addEventListener('change', apply);
      });
      $('p-family').addEventListener('click', () => {
        syncPartyInputs(isFamily(readPartyInputs()) ? { adults: 1, children: 0, infants: 0 } : FAMILY);
        apply();
      });
      $('sort-price').addEventListener('click', () => {
        sortMode = 'price';
        $('sort-price').classList.add('tool-btn--on');
        $('sort-date').classList.remove('tool-btn--on');
        apply();
      });
      $('sort-date').addEventListener('click', () => {
        sortMode = 'date';
        $('sort-date').classList.add('tool-btn--on');
        $('sort-price').classList.remove('tool-btn--on');
        apply();
      });
      $('month-bar').addEventListener('click', (event) => {
        const btn = event.target.closest('[data-month]');
        if (!btn) return;
        monthFilter = btn.getAttribute('data-month') || '';
        apply();
      });
    } catch {
      status.textContent = 'Could not load today’s deals.';
    }
  }

  window.SkintasticTravel = { MARKER, aviasalesSlug, aviasalesUrl };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
