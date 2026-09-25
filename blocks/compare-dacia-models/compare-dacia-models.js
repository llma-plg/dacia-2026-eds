// codegen:layout-pattern=comparison
// Sample data for standalone/preview mode. In production, data comes from bridge.toolResult.
// The two models the preview compares (Bigster vs Jogger), shaped to the outputSchema.
const SAMPLE_DATA = [
  {
    model_id: 'bigster',
    name: 'Dacia Bigster',
    body_style: 'C-segment SUV',
    starting_price_eur: 20490,
    seats: 5,
    cargo_capacity_liters: 702,
    powertrains: ['Hybrid 155', 'Mild Hybrid 140', 'ECO-G LPG'],
    transmission_options: ['Automatic', 'Manual'],
    consumption_summary: 'Hybrid approx. 4.7 L/100 km combined; ECO-G LPG dual-fuel range up to ~1,400 km.',
    key_features: ['702 L boot', 'Available 4x4', 'Roof bars', '10.1" touchscreen', 'Highway & Cruise pack'],
    best_suited_to: 'Longer road trips and outdoor gear — the biggest boot and available all-wheel drive make it the go-anywhere choice for five.',
    image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/bigster-db3l1-ph1/oveview/dacia-bigster-db3l1-ph1-055-mobile.jpg.ximg.xsmall.jpg/4b67d90d3c.jpg',
    configure_url: 'https://www.dacia.ro/gama/bigster.html',
  },
  {
    model_id: 'jogger',
    name: 'Dacia Jogger',
    body_style: 'Compact 7-seat estate',
    starting_price_eur: 16650,
    seats: 7,
    cargo_capacity_liters: 2094,
    powertrains: ['Hybrid 140', 'ECO-G LPG'],
    transmission_options: ['Automatic', 'Manual'],
    consumption_summary: 'Hybrid approx. 4.8 L/100 km combined; ECO-G LPG lowers running costs on long journeys.',
    key_features: ['Up to 7 seats', 'Removable 3rd row', '2,094 L max cargo', 'Roof bars', 'Media Display'],
    best_suited_to: 'Larger families and flexible loads — seven seats and a class-leading maximum cargo volume when the rear rows fold or come out.',
    image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/rji/jogger-ri1-ph2/herozone-banners/jogger-ri1-ph2-herozone-background-001-desktop.jpg.ximg.large.jpg/5224fc9270.jpg',
    configure_url: 'https://www.dacia.ro/gama/jogger.html',
  },
];

const PALETTE = ['#646b52', '#3860be', '#000000', '#ffffff'];
const ACCENT = '#646b52';

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
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m; }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}

const theme = getThemedCardBg(PALETTE);

function formatValue(v) {
  if (v === undefined || v === null || v === '') return '—';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'number') return v.toLocaleString('en-US');
  return String(v);
}

function formatPrice(v) {
  if (v === undefined || v === null || v === '') return '—';
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.]/g, ''));
  if (isNaN(n)) return String(v);
  return `from €${n.toLocaleString('en-US')}`;
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
      // structuredContent.models — bare array outputSchema; key derived from actionName "compare_dacia_models"
      items = structuredContent?.models || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  if (!items || !items.length) items = SAMPLE_DATA;

  block.textContent = '';
  renderComparison(block, items, bridge);

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

function renderComparison(block, items, bridge) {
  const itemA = items[0] || {};
  const itemB = items[1] || items[0] || {};

  const card = document.createElement('div');
  card.className = 'compare-dacia-models-card';

  function buildRowSpacer() {
    const spacer = document.createElement('div');
    spacer.className = 'compare-dacia-models-row-spacer';
    spacer.setAttribute('aria-hidden', 'true');
    return spacer;
  }

  function buildHeaderPanel(item) {
    const panel = document.createElement('div');
    panel.className = 'compare-dacia-models-header-panel';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'compare-dacia-models-header-image';
    const colorDiv = () => {
      const d = document.createElement('div');
      d.className = 'compare-dacia-models-header-image-placeholder';
      d.style.backgroundColor = ACCENT;
      return d;
    };
    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || '';
      img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
      imgWrap.appendChild(img);
    } else {
      imgWrap.appendChild(colorDiv());
    }
    panel.appendChild(imgWrap);

    const content = document.createElement('div');
    content.className = 'compare-dacia-models-header-content';
    content.style.background = theme?.bg ?? '#2a2c22';
    content.style.color = theme?.fg ?? '#fff';

    if (item.body_style) {
      const chip = document.createElement('span');
      chip.className = 'compare-dacia-models-header-chip';
      chip.textContent = item.body_style;
      content.appendChild(chip);
    }

    const title = document.createElement('h3');
    title.className = 'compare-dacia-models-header-title';
    title.textContent = item.name || '';
    content.appendChild(title);

    panel.appendChild(content);
    return panel;
  }

  const headerRow = document.createElement('div');
  headerRow.className = 'compare-dacia-models-header-row';
  headerRow.appendChild(buildRowSpacer());
  headerRow.appendChild(buildHeaderPanel(itemA));
  headerRow.appendChild(buildHeaderPanel(itemB));
  card.appendChild(headerRow);

  // Attribute table — one row per comparable field. Header panels already show
  // name/body_style; best_suited_to renders in its own band; CTAs render below.
  const ROW_DEFS = [
    { key: 'starting_price_eur', label: 'Price', lead: true, fmt: formatPrice },
    { key: 'seats', label: 'Seats', lead: true },
    { key: 'cargo_capacity_liters', label: 'Cargo (L)' },
    { key: 'powertrains', label: 'Powertrains' },
    { key: 'transmission_options', label: 'Transmission' },
    { key: 'consumption_summary', label: 'Efficiency' },
    { key: 'key_features', label: 'Features' },
  ];

  const rows = ROW_DEFS.filter((def) => itemA[def.key] !== undefined || itemB[def.key] !== undefined);

  const table = document.createElement('div');
  table.className = 'compare-dacia-models-table';

  rows.slice(0, 6).forEach((def) => {
    const tr = document.createElement('div');
    tr.className = 'compare-dacia-models-table-row' + (def.lead ? ' compare-dacia-models-table-row-lead' : '');

    const label = document.createElement('div');
    label.className = 'compare-dacia-models-table-label';
    label.textContent = def.label;
    tr.appendChild(label);

    const fmt = def.fmt || formatValue;
    const da = fmt(itemA[def.key]);
    const dbv = fmt(itemB[def.key]);
    const differs = da !== dbv;
    [da, dbv].forEach((text) => {
      const val = document.createElement('div');
      val.className = 'compare-dacia-models-table-value' + (differs ? ' compare-dacia-models-table-value-diff' : '');
      val.textContent = text;
      tr.appendChild(val);
    });

    table.appendChild(tr);
  });

  card.appendChild(table);

  // "Best suited to" summary band — one emphasis cell per column.
  if (itemA.best_suited_to || itemB.best_suited_to) {
    const suited = document.createElement('div');
    suited.className = 'compare-dacia-models-suited-row';

    const sLabel = document.createElement('div');
    sLabel.className = 'compare-dacia-models-suited-label';
    sLabel.textContent = 'Best suited to';
    suited.appendChild(sLabel);

    [itemA, itemB].forEach((item) => {
      const cell = document.createElement('div');
      cell.className = 'compare-dacia-models-suited-cell';
      cell.textContent = item.best_suited_to || '—';
      suited.appendChild(cell);
    });

    card.appendChild(suited);
  }

  // CTA block — three CTAs per column, stacked, aligned to the value columns via the spacer.
  const ctaBlock = document.createElement('div');
  ctaBlock.className = 'compare-dacia-models-cta-block';

  const CTA_DEFS = [
    {
      cls: 'compare-dacia-models-cta-primary',
      label: 'Configure This Model',
      action: (item) => {
        if (item.configure_url) bridge.openLink(item.configure_url);
        else bridge.sendMessage(`Help me configure the ${item.name}`);
      },
    },
    {
      cls: 'compare-dacia-models-cta-secondary',
      label: 'Find in Stock',
      action: (item) => bridge.sendMessage(`Find the ${item.name} in stock near me`),
    },
    {
      cls: 'compare-dacia-models-cta-ghost',
      label: 'Book Test Drive',
      action: (item) => bridge.sendMessage(`Book a test drive for the ${item.name}`),
    },
  ];

  const ctaRow = document.createElement('div');
  ctaRow.className = 'compare-dacia-models-cta-row';
  ctaRow.appendChild(buildRowSpacer());

  [itemA, itemB].forEach((item) => {
    const col = document.createElement('div');
    col.className = 'compare-dacia-models-cta-col';
    CTA_DEFS.forEach((def) => {
      const btn = document.createElement('button');
      btn.className = 'compare-dacia-models-cta ' + def.cls;
      btn.textContent = def.label;
      if (bridge) btn.addEventListener('click', () => def.action(item));
      col.appendChild(btn);
    });
    ctaRow.appendChild(col);
  });

  ctaBlock.appendChild(ctaRow);
  card.appendChild(ctaBlock);

  block.appendChild(card);
}
