// codegen:layout-pattern=generic-list
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = {
  vehicle_price_eur: 24000,
  calculation_date: '2026-09-15',
  scenarios: [
    {
      financing_type: 'Dacia Credit — Consumer Financing',
      currency: 'EUR',
      down_payment: 6000,
      term_months: 48,
      estimated_monthly_payment: 389,
      final_payment: 0,
      total_estimated_cost: 24672,
      included_services: ['48-month warranty', 'Scheduled servicing (4 yr)'],
    },
    {
      financing_type: 'Mobilize Balloon Financing',
      currency: 'EUR',
      down_payment: 6000,
      term_months: 48,
      estimated_monthly_payment: 279,
      final_payment: 7200,
      total_estimated_cost: 24792,
      included_services: ['Scheduled servicing (4 yr)', 'Roadside assistance'],
    },
    {
      financing_type: 'Private Lease (all-inclusive)',
      currency: 'EUR',
      down_payment: 6000,
      term_months: 48,
      estimated_monthly_payment: 315,
      final_payment: 0,
      total_estimated_cost: 21120,
      included_services: ['Maintenance', 'Servicing', 'Insurance option'],
    },
  ],
  disclaimer:
    'Indicative estimate only. Figures are non-binding and subject to eligibility, credit approval, and current Dacia Credit / Mobilize Financial Services terms at the time of application.',
  offer_request_url: 'https://www.dacia.ro/oferta.html',
};

// Brand palette from DESIGN_TOKENS.color (khaki-olive accent).
const PALETTE = ['#646b52', '#3860be', '#000000'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  const [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0; let hi = 1;
  for (let i = 0; i < 20; i += 1) {
    const m = (lo + hi) / 2;
    if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m;
  }
  const dr = Math.round(r * lo); const dg = Math.round(g * lo); const db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);
const ACCENT = '#646b52';

function fmtMoney(value, currency) {
  if (value === null || value === undefined || value === '') return '';
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) return String(value);
  const cur = currency || 'EUR';
  return `${num.toLocaleString('en-US')} ${cur}`;
}

export default async function decorate(block, bridge) {
  let result;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      result = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || {};
      result = structuredContent;
    }
  } else {
    result = SAMPLE_DATA;
  }

  block.textContent = '';
  renderDashboard(block, result, bridge);

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}

function renderDashboard(block, result, bridge) {
  const root = document.createElement('div');
  root.className = 'estimate-dacia-financing-root';

  // Header strip
  const header = document.createElement('div');
  header.className = 'edf-header';
  header.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  const badge = document.createElement('span');
  badge.className = 'edf-indicative';
  badge.textContent = 'Indicative estimate';
  header.appendChild(badge);

  const priceRow = document.createElement('div');
  priceRow.className = 'edf-price-row';
  const priceLabel = document.createElement('span');
  priceLabel.className = 'edf-price-label';
  priceLabel.textContent = 'Vehicle price';
  const priceVal = document.createElement('span');
  priceVal.className = 'edf-price-val';
  priceVal.textContent = fmtMoney(result?.vehicle_price_eur, 'EUR');
  priceRow.appendChild(priceLabel);
  priceRow.appendChild(priceVal);
  header.appendChild(priceRow);

  const chips = document.createElement('div');
  chips.className = 'edf-chips';
  const firstScenario = (result?.scenarios && result.scenarios[0]) || {};
  const assumptions = [
    ['Down payment', fmtMoney(firstScenario.down_payment, firstScenario.currency)],
    ['Term', firstScenario.term_months ? `${firstScenario.term_months} months` : ''],
    ['Calculated', result?.calculation_date || ''],
  ];
  assumptions.forEach(([label, value]) => {
    if (!value) return;
    const chip = document.createElement('span');
    chip.className = 'edf-chip';
    chip.textContent = `${label}: ${value}`;
    chips.appendChild(chip);
  });
  if (chips.childElementCount) header.appendChild(chips);
  root.appendChild(header);

  // Scenario cards row
  const carouselWrap = document.createElement('div');
  carouselWrap.className = 'edf-carousel-wrap';

  const rowEl = document.createElement('div');
  rowEl.className = 'edf-row';

  const scenarios = Array.isArray(result?.scenarios) ? result.scenarios : [];
  scenarios.forEach((sc) => {
    rowEl.appendChild(buildScenarioCard(sc));
  });
  carouselWrap.appendChild(rowEl);

  if (scenarios.length > 2) {
    const fade = document.createElement('div');
    fade.className = 'edf-fade';
    fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,var(--background-color,#fff));pointer-events:none;`;
    carouselWrap.appendChild(fade);
  }
  root.appendChild(carouselWrap);

  // Disclaimer
  if (result?.disclaimer) {
    const disc = document.createElement('p');
    disc.className = 'edf-disclaimer';
    disc.textContent = result.disclaimer;
    root.appendChild(disc);
  }

  // CTA row
  const ctaRow = document.createElement('div');
  ctaRow.className = 'edf-cta-row';

  const adjustBtn = document.createElement('button');
  adjustBtn.className = 'edf-cta edf-cta-secondary';
  adjustBtn.type = 'button';
  adjustBtn.textContent = 'Adjust Assumptions';

  const offerBtn = document.createElement('button');
  offerBtn.className = 'edf-cta edf-cta-primary';
  offerBtn.type = 'button';
  offerBtn.textContent = 'Request an Offer';

  const dealerBtn = document.createElement('button');
  dealerBtn.className = 'edf-cta edf-cta-secondary';
  dealerBtn.type = 'button';
  dealerBtn.textContent = 'Find a Dealer';

  if (bridge) {
    adjustBtn.addEventListener('click', () => bridge.sendMessage('I would like to adjust my financing assumptions'));
    offerBtn.addEventListener('click', () => {
      if (result?.offer_request_url) bridge.openLink(result.offer_request_url);
      else bridge.sendMessage('I would like to request a personalized Dacia financing offer');
    });
    dealerBtn.addEventListener('click', () => bridge.sendMessage('Help me find a nearby Dacia dealer'));
  }

  ctaRow.appendChild(adjustBtn);
  ctaRow.appendChild(offerBtn);
  ctaRow.appendChild(dealerBtn);
  root.appendChild(ctaRow);

  block.appendChild(root);
}

function buildScenarioCard(sc) {
  const card = document.createElement('div');
  card.className = 'edf-card';

  const title = document.createElement('div');
  title.className = 'edf-card-title';
  title.textContent = sc.financing_type || 'Financing option';
  card.appendChild(title);

  if (sc.currency) {
    const cur = document.createElement('span');
    cur.className = 'edf-currency';
    cur.textContent = sc.currency;
    card.appendChild(cur);
  }

  const hero = document.createElement('div');
  hero.className = 'edf-hero';
  const heroNum = document.createElement('span');
  heroNum.className = 'edf-hero-num';
  heroNum.textContent = fmtMoney(sc.estimated_monthly_payment, sc.currency);
  const heroSuffix = document.createElement('span');
  heroSuffix.className = 'edf-hero-suffix';
  heroSuffix.textContent = '/mo';
  hero.appendChild(heroNum);
  hero.appendChild(heroSuffix);
  card.appendChild(hero);

  const grid = document.createElement('div');
  grid.className = 'edf-stat-grid';
  const stats = [
    ['Term', sc.term_months ? `${sc.term_months} mo` : ''],
    ['Down payment', fmtMoney(sc.down_payment, sc.currency)],
    ['Final payment', fmtMoney(sc.final_payment, sc.currency)],
    ['Total cost', fmtMoney(sc.total_estimated_cost, sc.currency)],
  ];
  stats.forEach(([label, value]) => {
    if (value === '' || value === undefined) return;
    const cell = document.createElement('div');
    cell.className = 'edf-stat';
    const l = document.createElement('span');
    l.className = 'edf-stat-label';
    l.textContent = label;
    const v = document.createElement('span');
    v.className = 'edf-stat-value';
    v.textContent = value;
    cell.appendChild(l);
    cell.appendChild(v);
    grid.appendChild(cell);
  });
  card.appendChild(grid);

  if (Array.isArray(sc.included_services) && sc.included_services.length) {
    const svcLabel = document.createElement('span');
    svcLabel.className = 'edf-svc-label';
    svcLabel.textContent = 'Included';
    card.appendChild(svcLabel);

    const svcWrap = document.createElement('div');
    svcWrap.className = 'edf-svc-wrap';
    sc.included_services.forEach((svc) => {
      const s = document.createElement('span');
      s.className = 'edf-svc-chip';
      s.textContent = svc;
      svcWrap.appendChild(s);
    });
    card.appendChild(svcWrap);
  }

  return card;
}
