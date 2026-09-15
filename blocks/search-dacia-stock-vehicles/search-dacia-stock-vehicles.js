// codegen:layout-pattern=carousel
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: 'Dacia Duster',
    description: 'Iconic compact SUV, now with hybrid and factory LPG, available with automatic gearbox and 4x4 traction.',
    price: 'from 17.100 EUR',
    category: 'SUV',
    image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/duster-p1310/overview/editorial/dacia-duster-p1310-overview-004-1-mobile.jpg.ximg.xsmall.jpg/ba4175c768.jpg',
  },
  {
    name: 'Dacia Bigster',
    description: 'The largest, best-equipped model in the range, with a 702 L boot, hybrid/LPG powertrains and available 4x4.',
    price: 'from 20.490 EUR',
    category: 'SUV',
    image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/bigster-db3l1-ph1/oveview/dacia-bigster-db3l1-ph1-055-mobile.jpg.ximg.xsmall.jpg/4b67d90d3c.jpg',
  },
  {
    name: 'Dacia Jogger',
    description: 'Versatile family vehicle with 5 or 7 seats, up to 2,094 L of cargo space and hybrid/LPG powertrains.',
    image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/rji/jogger-ri1-ph2/herozone-banners/jogger-ri1-ph2-herozone-background-001-desktop.jpg.ximg.large.jpg/5224fc9270.jpg',
    price: 'from 16.650 EUR',
    category: 'Family',
  },
  {
    name: 'Dacia Sandero Stepway',
    description: 'Crossover with raised driving position, full hybrid 155 or factory LPG with automatic option.',
    image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/sandero-stepway/sandero-stepway-bi1-ph2/herozone-banners/sandero-stepway-bi1-ph2-herozone-background-desktop-001.jpg.ximg.large.jpg/48eb89e802.jpg',
    price: 'from 13.650 EUR',
    category: 'Crossover',
  },
  {
    name: 'Dacia Logan',
    description: 'Spacious sedan, the most powerful Logan yet, with a 120 HP factory LPG engine and dual-clutch automatic.',
    image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/logan/logan-li1-ph2/herozone-banners/dacia-logan-li1-ph2-herozone-background-001-desktop.jpg.ximg.large.jpg/f7b183dd4d.jpg',
    price: 'from 12.650 EUR',
    category: 'Sedan',
  },
  {
    name: 'Dacia Spring',
    description: '100% electric city car with 4 seats, up to 315 km urban WLTP range and a 100 HP motor.',
    price: 'from 17.121 EUR',
    category: 'City car',
    image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/dacia-bbg/spring-s2e-ph2-my26/overview/editorial/dacia-spring-s2e-ph2-overview-003.jpg.ximg.xsmall.jpg/5e53676620.jpg',
  },
];

// Brand palette from DESIGN_TOKENS' color tier. getThemedCardBg() darkens PALETTE[0]
// to luminance <= 0.12 so white text keeps WCAG AA contrast on the card info strip.
const PALETTE = ['#646b52', '#3860be', '#000000'];
function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  const [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const relLum = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 20; i += 1) {
    const m = (lo + hi) / 2;
    if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m;
  }
  const dr = Math.round(r * lo);
  const dg = Math.round(g * lo);
  const db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

const CARD_COLORS = ['#646b52', '#3860be', '#0fb5ae', '#e68619', '#8a6d3b', '#5a6b4a', '#4046ca', '#72b340'];

const ACCENT = '#646b52';

function fmtPrice(val) {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'number') {
    return `${new Intl.NumberFormat('en-US').format(val)} EUR`;
  }
  return String(val);
}

function buildCard(item, i, bridge) {
  const card = document.createElement('div');
  card.className = 'search-dacia-stock-vehicles-card';

  const imageBox = document.createElement('div');
  imageBox.className = 'search-dacia-stock-vehicles-image';
  const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
  const colorDiv = () => {
    const d = document.createElement('div');
    d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
    return d;
  };
  const name = item.model_name || item.name || 'Vehicle';
  if (item.image_url) {
    const img = document.createElement('img');
    img.src = item.image_url;
    img.alt = name;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror = () => { if (img.parentNode) img.parentNode.replaceChild(colorDiv(), img); };
    imageBox.appendChild(img);
  } else {
    imageBox.appendChild(colorDiv());
  }
  card.appendChild(imageBox);

  const info = document.createElement('div');
  info.className = 'search-dacia-stock-vehicles-info';
  info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

  const title = document.createElement('h3');
  title.className = 'search-dacia-stock-vehicles-title';
  title.textContent = name;
  info.appendChild(title);

  const trimBits = [item.trim, item.powertrain].filter(Boolean).join(' · ');
  const subText = trimBits || item.description || '';
  if (subText) {
    const sub = document.createElement('p');
    sub.className = 'search-dacia-stock-vehicles-sub';
    sub.textContent = subText;
    info.appendChild(sub);
  }

  const specBits = [];
  if (item.horsepower) specBits.push(`${item.horsepower} HP`);
  if (item.transmission) specBits.push(item.transmission);
  if (item.color) specBits.push(item.color);
  if (specBits.length) {
    const spec = document.createElement('p');
    spec.className = 'search-dacia-stock-vehicles-spec';
    spec.textContent = specBits.join(' · ');
    info.appendChild(spec);
  }

  const priceRow = document.createElement('div');
  priceRow.className = 'search-dacia-stock-vehicles-price-row';
  const promo = fmtPrice(item.promotional_price_eur ?? item.price);
  const list = fmtPrice(item.list_price_eur);
  if (promo) {
    const promoEl = document.createElement('span');
    promoEl.className = 'search-dacia-stock-vehicles-promo';
    promoEl.textContent = promo;
    priceRow.appendChild(promoEl);
  }
  if (list && list !== promo) {
    const listEl = document.createElement('span');
    listEl.className = 'search-dacia-stock-vehicles-list';
    listEl.textContent = list;
    priceRow.appendChild(listEl);
  }
  if (priceRow.childNodes.length) info.appendChild(priceRow);

  const chipRow = document.createElement('div');
  chipRow.className = 'search-dacia-stock-vehicles-chips';
  const rabla = fmtPrice(item.rabla_price_eur);
  if (rabla) {
    const rablaChip = document.createElement('span');
    rablaChip.className = 'search-dacia-stock-vehicles-rabla';
    rablaChip.textContent = `Rabla ${rabla}`;
    rablaChip.title = 'Rabla price assumes eligibility, which is not guaranteed';
    chipRow.appendChild(rablaChip);
  }
  const badgeText = item.category || (item.extra_equipment_count ? `+${item.extra_equipment_count} extras` : '');
  if (badgeText) {
    const badge = document.createElement('span');
    badge.className = 'search-dacia-stock-vehicles-badge';
    badge.textContent = badgeText;
    chipRow.appendChild(badge);
  }
  if (chipRow.childNodes.length) info.appendChild(chipRow);

  if (item.estimated_delivery) {
    const delivery = document.createElement('p');
    delivery.className = 'search-dacia-stock-vehicles-delivery';
    delivery.textContent = `Delivery: ${item.estimated_delivery}`;
    info.appendChild(delivery);
  }

  const cta = document.createElement('button');
  cta.type = 'button';
  cta.className = 'search-dacia-stock-vehicles-cta';
  cta.textContent = 'View Vehicle';
  const url = item.detail_url || item.reservation_url || item.url;
  cta.addEventListener('click', () => {
    if (bridge) {
      if (url) bridge.openLink(url);
      else bridge.sendMessage(`Tell me more about ${name}`);
    }
  });
  info.appendChild(cta);

  card.appendChild(info);
  return card;
}

function renderItems(block, items, bridge) {
  block.textContent = '';
  const list = (items || []).slice(0, 5);

  const summary = document.createElement('div');
  summary.className = 'search-dacia-stock-vehicles-summary';
  const count = (items || []).length;
  summary.textContent = count
    ? `${count} configuration${count === 1 ? '' : 's'} available — prices indicative, eligibility not guaranteed`
    : 'No configurations available';
  block.appendChild(summary);

  if (!list.length) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'search-dacia-stock-vehicles-wrapper';

  const track = document.createElement('div');
  track.className = 'search-dacia-stock-vehicles-track';
  list.forEach((item, i) => track.appendChild(buildCard(item, i, bridge)));
  wrapper.appendChild(track);

  const fade = document.createElement('div');
  fade.className = 'search-dacia-stock-vehicles-fade';
  fade.style.background = `linear-gradient(to right, transparent, ${theme?.bg ?? '#1a1a1a'}cc)`;
  wrapper.appendChild(fade);

  const mkArrow = (dir) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `search-dacia-stock-vehicles-arrow search-dacia-stock-vehicles-arrow-${dir}`;
    b.setAttribute('aria-label', dir === 'left' ? 'Scroll left' : 'Scroll right');
    b.textContent = dir === 'left' ? '◀' : '▶';
    const scrollBy = () => {
      const card = track.querySelector('.search-dacia-stock-vehicles-card');
      const amount = card ? card.offsetWidth + 16 : 236;
      track.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    };
    b.addEventListener('click', scrollBy);
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollBy(); }
    });
    return b;
  };
  const leftArrow = mkArrow('left');
  const rightArrow = mkArrow('right');
  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  const updateArrows = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    leftArrow.style.display = track.scrollLeft <= 2 ? 'none' : 'flex';
    rightArrow.style.display = track.scrollLeft >= maxScroll - 2 ? 'none' : 'flex';
    fade.style.display = track.scrollLeft >= maxScroll - 2 ? 'none' : 'block';
  };
  track.addEventListener('scroll', updateArrows);
  wrapper.appendChild(track);
  block.appendChild(wrapper);
  requestAnimationFrame(updateArrows);
}

export default async function decorate(block, bridge) {
  let items;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || {};
      // structuredContent.vehicles — bare array outputSchema; key derived from actionName "search_dacia_stock_vehicles"
      items = structuredContent?.vehicles || [];
    }
    renderItems(block, items, bridge);
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  } else {
    items = SAMPLE_DATA;
    renderItems(block, items, bridge);
  }
}
