// codegen:layout-pattern=carousel
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'Dacia Duster', description: 'Iconic compact SUV, now with hybrid and factory LPG, available with automatic gearbox and 4x4 traction.', price: 'from 17.100 EUR', category: 'SUV', image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/duster-p1310/overview/editorial/dacia-duster-p1310-overview-004-1-mobile.jpg.ximg.xsmall.jpg/ba4175c768.jpg' },
  { name: 'Dacia Bigster', description: 'The largest, best-equipped model in the range, with a 702 L boot, hybrid/LPG powertrains and available 4x4.', price: 'from 20.490 EUR', category: 'SUV', image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/bigster-db3l1-ph1/oveview/dacia-bigster-db3l1-ph1-055-mobile.jpg.ximg.xsmall.jpg/4b67d90d3c.jpg' },
  { name: 'Dacia Jogger', description: 'Versatile family vehicle with 5 or 7 seats, up to 2,094 L of cargo space and hybrid/LPG powertrains.', price: 'from 16.650 EUR', category: 'Family', image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/rji/jogger-ri1-ph2/herozone-banners/jogger-ri1-ph2-herozone-background-001-desktop.jpg.ximg.large.jpg/5224fc9270.jpg' },
  { name: 'Dacia Sandero Stepway', description: 'Crossover with raised driving position, full hybrid 155 or factory LPG with automatic option.', price: 'from 13.650 EUR', category: 'Crossover', image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/sandero-stepway/sandero-stepway-bi1-ph2/herozone-banners/sandero-stepway-bi1-ph2-herozone-background-desktop-001.jpg.ximg.large.jpg/48eb89e802.jpg' },
  { name: 'Dacia Logan', description: 'Spacious sedan, the most powerful Logan yet, with a 120 HP factory LPG engine and dual-clutch automatic.', price: 'from 12.650 EUR', category: 'Sedan', image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/logan/logan-li1-ph2/herozone-banners/dacia-logan-li1-ph2-herozone-background-001-desktop.jpg.ximg.large.jpg/f7b183dd4d.jpg' },
  { name: 'Dacia Spring', description: '100% electric city car with 4 seats, up to 315 km urban WLTP range and a 100 HP motor.', price: 'from 17.121 EUR', category: 'City car', image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/dacia-bbg/spring-s2e-ph2-my26/overview/editorial/dacia-spring-s2e-ph2-overview-003.jpg.ximg.xsmall.jpg/5e53676620.jpg' },
];

// Brand palette from DESIGN_TOKENS.color (khaki-olive accent, secondary blue, black, white).
const PALETTE = ['#646b52', '#3860be', '#000000', '#ffffff'];
const CTA_REST = '#646b52';
const CTA_HOVER = '#4f5441';
const CARD_COLORS = ['#378ef0', '#9256d9', '#0fb5ae', '#e68619', '#d83790', '#2dca72', '#4046ca', '#72b340'];

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

function formatPrice(item) {
  if (item.starting_price_eur != null && item.starting_price_eur !== '') {
    const n = Number(item.starting_price_eur);
    if (!isNaN(n)) return `from €${n.toLocaleString('en-US')}`;
  }
  return item.price || '';
}

function deriveBadges(item) {
  const hay = [
    ...(Array.isArray(item.powertrains) ? item.powertrains : []),
    item.description || '',
    item.fit_summary || '',
  ].join(' ').toLowerCase();
  const badges = [];
  if (/electric|\bev\b|100%\s*electric/.test(hay)) badges.push('Electric');
  if (/hybrid/.test(hay)) badges.push('Hybrid');
  if (/lpg/.test(hay)) badges.push('LPG');
  const seats = Number(item.seats);
  if ((!isNaN(seats) && seats >= 7) || /7\s*seat|seven[- ]?seat|5 or 7/.test(hay)) badges.push('7 seats');
  return badges;
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
      // structuredContent.models — bare array outputSchema; key derived from actionName "discover_dacia_models"
      items = structuredContent?.models || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  renderCarousel(block, items || [], bridge);

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

function renderCarousel(block, items, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'discover-dacia-models-wrapper';

  const track = document.createElement('div');
  track.className = 'discover-dacia-models-track';

  items.slice(0, 6).forEach((item, i) => {
    track.appendChild(buildCard(item, i, bridge));
  });

  const scrollBy = () => {
    const card = track.querySelector('.discover-dacia-models-card');
    return card ? card.offsetWidth + 16 : 236;
  };

  const leftBtn = document.createElement('button');
  leftBtn.className = 'discover-dacia-models-nav discover-dacia-models-nav-left';
  leftBtn.type = 'button';
  leftBtn.setAttribute('aria-label', 'Scroll left');
  leftBtn.textContent = '◀';
  leftBtn.addEventListener('click', () => track.scrollBy({ left: -scrollBy(), behavior: 'smooth' }));

  const rightBtn = document.createElement('button');
  rightBtn.className = 'discover-dacia-models-nav discover-dacia-models-nav-right';
  rightBtn.type = 'button';
  rightBtn.setAttribute('aria-label', 'Scroll right');
  rightBtn.textContent = '▶';
  rightBtn.addEventListener('click', () => track.scrollBy({ left: scrollBy(), behavior: 'smooth' }));

  const fade = document.createElement('div');
  fade.className = 'discover-dacia-models-fade';
  fade.style.background = `linear-gradient(to right, transparent, ${theme?.bg ?? '#1a1a1a'}cc)`;

  const updateNav = () => {
    const maxScroll = track.scrollWidth - track.clientWidth - 2;
    leftBtn.style.display = track.scrollLeft <= 2 ? 'none' : 'flex';
    const atEnd = track.scrollLeft >= maxScroll;
    rightBtn.style.display = atEnd ? 'none' : 'flex';
    fade.style.display = atEnd ? 'none' : 'block';
  };
  track.addEventListener('scroll', updateNav);

  wrapper.appendChild(track);
  wrapper.appendChild(fade);
  wrapper.appendChild(leftBtn);
  wrapper.appendChild(rightBtn);
  block.appendChild(wrapper);
  requestAnimationFrame(updateNav);
}

function buildCard(item, i, bridge) {
  const card = document.createElement('div');
  card.className = 'discover-dacia-models-card';

  const imageBox = document.createElement('div');
  imageBox.className = 'discover-dacia-models-image';
  const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
  const colorDiv = () => {
    const d = document.createElement('div');
    d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
    return d;
  };
  if (item.image_url) {
    const img = document.createElement('img');
    img.src = item.image_url;
    img.alt = item.name || '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror = () => { if (img.parentNode) img.parentNode.replaceChild(colorDiv(), img); };
    imageBox.appendChild(img);
  } else {
    imageBox.appendChild(colorDiv());
  }
  card.appendChild(imageBox);

  const info = document.createElement('div');
  info.className = 'discover-dacia-models-info';
  info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  const name = document.createElement('h3');
  name.className = 'discover-dacia-models-name';
  name.textContent = item.name || '';
  info.appendChild(name);

  const summary = document.createElement('p');
  summary.className = 'discover-dacia-models-summary';
  const summaryText = item.fit_summary || item.description || '';
  summary.textContent = summaryText.length > 68 ? `${summaryText.slice(0, 67).trimEnd()}…` : summaryText;
  info.appendChild(summary);

  const badges = deriveBadges(item);
  if (badges.length) {
    const badgeRow = document.createElement('div');
    badgeRow.className = 'discover-dacia-models-badges';
    badges.forEach((b) => {
      const chip = document.createElement('span');
      chip.className = 'discover-dacia-models-badge';
      chip.textContent = b;
      badgeRow.appendChild(chip);
    });
    info.appendChild(badgeRow);
  }

  const meta = document.createElement('div');
  meta.className = 'discover-dacia-models-meta';
  const price = document.createElement('span');
  price.className = 'discover-dacia-models-price';
  price.textContent = formatPrice(item);
  meta.appendChild(price);
  const bodyStyle = item.body_style || item.category;
  if (bodyStyle) {
    const cat = document.createElement('span');
    cat.className = 'discover-dacia-models-category';
    cat.textContent = bodyStyle;
    meta.appendChild(cat);
  }
  info.appendChild(meta);

  const actions = document.createElement('div');
  actions.className = 'discover-dacia-models-actions';

  const viewBtn = document.createElement('button');
  viewBtn.className = 'discover-dacia-models-cta';
  viewBtn.type = 'button';
  viewBtn.textContent = 'View Model';
  viewBtn.addEventListener('click', () => {
    if (!bridge) return;
    if (item.model_url) bridge.openLink(item.model_url);
    else bridge.sendMessage(`Tell me more about the ${item.name}`);
  });
  actions.appendChild(viewBtn);

  const compareBtn = document.createElement('button');
  compareBtn.className = 'discover-dacia-models-cta discover-dacia-models-cta-secondary';
  compareBtn.type = 'button';
  compareBtn.textContent = 'Compare';
  compareBtn.addEventListener('click', () => {
    if (bridge) bridge.sendMessage(`Compare the ${item.name} with other Dacia models`);
  });
  actions.appendChild(compareBtn);

  const configBtn = document.createElement('button');
  configBtn.className = 'discover-dacia-models-cta discover-dacia-models-cta-secondary';
  configBtn.type = 'button';
  configBtn.textContent = 'Configure';
  configBtn.addEventListener('click', () => {
    if (!bridge) return;
    if (item.configure_url) bridge.openLink(item.configure_url);
    else bridge.sendMessage(`Help me configure the ${item.name}`);
  });
  actions.appendChild(configBtn);

  info.appendChild(actions);
  card.appendChild(info);
  return card;
}
