// codegen:layout-pattern=booking-form
// Sample data for standalone/preview mode.
// In production, the confirmation object comes from bridge.toolResult.structuredContent.
const SAMPLE_MODELS = [
  { name: 'Dacia Duster', description: 'Iconic compact SUV, now with hybrid and factory LPG, available with automatic gearbox and 4x4 traction.', price: 'from 17.100 EUR', category: 'SUV', image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/duster-p1310/overview/editorial/dacia-duster-p1310-overview-004-1-mobile.jpg.ximg.xsmall.jpg/ba4175c768.jpg' },
  { name: 'Dacia Bigster', description: 'The largest, best-equipped model in the range, with a 702 L boot, hybrid/LPG powertrains and available 4x4.', price: 'from 20.490 EUR', category: 'SUV', image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/bigster-db3l1-ph1/oveview/dacia-bigster-db3l1-ph1-055-mobile.jpg.ximg.xsmall.jpg/4b67d90d3c.jpg' },
  { name: 'Dacia Jogger', description: 'Versatile family vehicle with 5 or 7 seats, up to 2,094 L of cargo space and hybrid/LPG powertrains.', price: 'from 16.650 EUR', category: 'Family', image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/rji/jogger-ri1-ph2/herozone-banners/jogger-ri1-ph2-herozone-background-001-desktop.jpg.ximg.large.jpg/5224fc9270.jpg' },
  { name: 'Dacia Sandero Stepway', description: 'Crossover with raised driving position, full hybrid 155 or factory LPG with automatic option.', price: 'from 13.650 EUR', category: 'Crossover', image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/sandero-stepway/sandero-stepway-bi1-ph2/herozone-banners/sandero-stepway-bi1-ph2-herozone-background-desktop-001.jpg.ximg.large.jpg/48eb89e802.jpg' },
  { name: 'Dacia Logan', description: 'Spacious sedan, the most powerful Logan yet, with a 120 HP factory LPG engine and dual-clutch automatic.', price: 'from 12.650 EUR', category: 'Sedan', image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/logan/logan-li1-ph2/herozone-banners/dacia-logan-li1-ph2-herozone-background-001-desktop.jpg.ximg.large.jpg/f7b183dd4d.jpg' },
  { name: 'Dacia Spring', description: '100% electric city car with 4 seats, up to 315 km urban WLTP range and a 100 HP motor.', price: 'from 17.121 EUR', category: 'City car', image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/dacia-bbg/spring-s2e-ph2-my26/overview/editorial/dacia-spring-s2e-ph2-overview-003.jpg.ximg.xsmall.jpg/5e53676620.jpg' },
];

// A prefilled test-drive request for preview/standalone mode. In production this
// is the confirmation object returned by the tool via bridge.toolResult.
const SAMPLE_BOOKING = {
  model: 'Dacia Bigster',
  location: 'Cluj-Napoca',
  preferred_date: '2026-09-19',
  preferred_time: 'Saturday morning',
  customer_name: 'Andrei Popescu',
  phone: '+40 723 000 000',
  email: 'andrei.popescu@example.com',
  confirmation_id: 'TD-2026-04817',
  status: 'Pending confirmation',
  dealer_name: 'Dacia Cluj-Napoca — Autorulate SRL',
  requested_date: '2026-09-19',
  requested_time: 'Saturday morning',
  message: 'Request received. A Dacia representative will call to confirm your test-drive time.',
};

// Brand palette from DESIGN_TOKENS (khaki-olive accent, Dacia blue secondary, black).
const PALETTE = ['#646b52', '#3860be', '#000000'];
const ACCENT = '#646b52';

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m; }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

const CARD_COLORS = ['#646b52', '#3860be', '#0fb5ae', '#e68619', '#d83790', '#2dca72'];

function findModel(name) {
  if (!name) return null;
  const lower = String(name).toLowerCase();
  return SAMPLE_MODELS.find((m) => m.name.toLowerCase() === lower)
    || SAMPLE_MODELS.find((m) => lower.includes(m.name.toLowerCase()) || m.name.toLowerCase().includes(lower))
    || null;
}

export default async function decorate(block, bridge) {
  let booking;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      booking = SAMPLE_BOOKING;
    } else {
      const _result = await bridge.toolResult;
      // booking-form confirmation — structuredContent is the flat confirmation object.
      const structuredContent = _result?.structuredContent || {};
      booking = structuredContent;
    }
  } else {
    booking = SAMPLE_BOOKING;
  }

  block.textContent = '';
  render(block, booking || {}, bridge);

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

function render(block, booking, bridge) {
  block.textContent = '';
  // If the confirmation carries a submitted status, show the status card; else the review form.
  const submitted = !!(booking.confirmation_id || booking.status);
  if (submitted) {
    block.appendChild(buildStatusCard(booking, bridge));
  } else {
    block.appendChild(buildReviewCard(block, booking, bridge));
  }
}

function heroFor(booking, i) {
  const model = findModel(booking.model);
  const wrap = document.createElement('div');
  wrap.className = 'bdtd-hero';
  const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
  const colorDiv = () => {
    const d = document.createElement('div');
    d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
    return d;
  };
  if (model && model.image_url) {
    const img = document.createElement('img');
    img.src = model.image_url;
    img.alt = model.name || booking.model || 'Dacia model';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror = () => { if (img.parentNode) img.parentNode.replaceChild(colorDiv(), img); };
    wrap.appendChild(img);
  } else {
    wrap.appendChild(colorDiv());
  }
  return wrap;
}

function reviewRow(label, value) {
  const row = document.createElement('div');
  row.className = 'bdtd-row';
  const l = document.createElement('span');
  l.className = 'bdtd-row-label';
  l.textContent = label;
  const v = document.createElement('span');
  v.className = 'bdtd-row-value';
  v.textContent = value || '—';
  row.appendChild(l);
  row.appendChild(v);
  return row;
}

function buildReviewCard(block, booking, bridge) {
  const card = document.createElement('div');
  card.className = 'bdtd-card';

  card.appendChild(heroFor(booking, 0));

  const header = document.createElement('div');
  header.className = 'bdtd-header';
  header.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;
  const title = document.createElement('div');
  title.className = 'bdtd-title';
  title.textContent = 'Review your test drive';
  const sub = document.createElement('div');
  sub.className = 'bdtd-desc';
  sub.textContent = 'Check the details below, then submit. The dealer may contact you to confirm availability.';
  header.appendChild(title);
  header.appendChild(sub);
  card.appendChild(header);

  const body = document.createElement('div');
  body.className = 'bdtd-body';
  body.appendChild(reviewRow('Model', booking.model));
  body.appendChild(reviewRow('Location', booking.location));
  body.appendChild(reviewRow('Preferred date', booking.preferred_date || booking.requested_date));
  body.appendChild(reviewRow('Time preference', booking.preferred_time || booking.requested_time));
  body.appendChild(reviewRow('Name', booking.customer_name));
  body.appendChild(reviewRow('Phone', booking.phone));
  body.appendChild(reviewRow('Email', booking.email));
  card.appendChild(body);

  const actions = document.createElement('div');
  actions.className = 'bdtd-actions';

  const submit = document.createElement('button');
  submit.type = 'button';
  submit.className = 'bdtd-btn bdtd-btn-primary';
  submit.textContent = 'Submit Test Drive Request';
  submit.addEventListener('click', () => {
    if (bridge) {
      const parts = [booking.model, booking.location, booking.preferred_date, booking.preferred_time]
        .filter(Boolean).join(', ');
      bridge.sendMessage(`Submit my Dacia test-drive request${parts ? ' (' + parts + ')' : ''}.`);
    } else {
      render(block, { ...SAMPLE_BOOKING }, bridge);
    }
  });

  const view = document.createElement('button');
  view.type = 'button';
  view.className = 'bdtd-btn bdtd-btn-ghost';
  view.textContent = 'View Model';
  view.addEventListener('click', () => {
    if (bridge) bridge.sendMessage(`Tell me more about the ${booking.model || 'selected Dacia model'}.`);
  });

  actions.appendChild(submit);
  actions.appendChild(view);
  card.appendChild(actions);

  return card;
}

function buildStatusCard(booking, bridge) {
  const card = document.createElement('div');
  card.className = 'bdtd-card';

  card.appendChild(heroFor(booking, 1));

  const header = document.createElement('div');
  header.className = 'bdtd-header';
  header.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;
  const title = document.createElement('div');
  title.className = 'bdtd-title';
  title.textContent = 'Test drive requested';
  const status = document.createElement('span');
  status.className = 'bdtd-status-chip';
  status.textContent = booking.status || 'Pending confirmation';
  header.appendChild(title);
  header.appendChild(status);
  card.appendChild(header);

  const body = document.createElement('div');
  body.className = 'bdtd-body';
  body.appendChild(reviewRow('Confirmation', booking.confirmation_id));
  body.appendChild(reviewRow('Model', booking.model));
  body.appendChild(reviewRow('Dealer', booking.dealer_name));
  body.appendChild(reviewRow('Requested date', booking.requested_date || booking.preferred_date));
  if (booking.message) {
    const msg = document.createElement('p');
    msg.className = 'bdtd-message';
    msg.textContent = booking.message;
    body.appendChild(msg);
  }
  card.appendChild(body);

  const actions = document.createElement('div');
  actions.className = 'bdtd-actions';
  const view = document.createElement('button');
  view.type = 'button';
  view.className = 'bdtd-btn bdtd-btn-ghost';
  view.textContent = 'View Model';
  view.addEventListener('click', () => {
    if (bridge) bridge.sendMessage(`Tell me more about the ${booking.model || 'selected Dacia model'}.`);
  });
  actions.appendChild(view);
  card.appendChild(actions);

  return card;
}
