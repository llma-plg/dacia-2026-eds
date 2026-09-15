// codegen:layout-pattern=booking-form
// Sample data for standalone/preview mode.
// In production, the confirmation comes dynamically from bridge.toolResult.
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
    price: 'from 16.650 EUR',
    category: 'Family',
    image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/rji/jogger-ri1-ph2/herozone-banners/jogger-ri1-ph2-herozone-background-001-desktop.jpg.ximg.large.jpg/5224fc9270.jpg',
  },
  {
    name: 'Dacia Sandero Stepway',
    description: 'Crossover with raised driving position, full hybrid 155 or factory LPG with automatic option.',
    price: 'from 13.650 EUR',
    category: 'Crossover',
    image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/sandero-stepway/sandero-stepway-bi1-ph2/herozone-banners/sandero-stepway-bi1-ph2-herozone-background-desktop-001.jpg.ximg.large.jpg/48eb89e802.jpg',
  },
  {
    name: 'Dacia Logan',
    description: 'Spacious sedan, the most powerful Logan yet, with a 120 HP factory LPG engine and dual-clutch automatic.',
    price: 'from 12.650 EUR',
    category: 'Sedan',
    image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/logan/logan-li1-ph2/herozone-banners/dacia-logan-li1-ph2-herozone-background-001-desktop.jpg.ximg.large.jpg/f7b183dd4d.jpg',
  },
  {
    name: 'Dacia Spring',
    description: '100% electric city car with 4 seats, up to 315 km urban WLTP range and a 100 HP motor.',
    price: 'from 17.121 EUR',
    category: 'City car',
    image_url: 'https://cdn.group.renault.com/dac/master/dacia-vn/vehicules/dacia-bbg/spring-s2e-ph2-my26/overview/editorial/dacia-spring-s2e-ph2-overview-003.jpg.ximg.xsmall.jpg/5e53676620.jpg',
  },
];

// Service categories offered by authorized Dacia after-sales centers.
const SERVICE_TYPES = [
  'Scheduled maintenance',
  'ITP preparation',
  'Bodywork',
  'Windscreen repair',
  'Inspection',
];

// Model options for the vehicle picker, derived from the sample range.
const MODEL_OPTIONS = SAMPLE_DATA.map((v) => v.name);

// Brand colors from DESIGN_TOKENS' color tier — khaki-olive accent, blue secondary, black.
const PALETTE = ['#646b52', '#3860be', '#000000'];
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

export default async function decorate(block, bridge) {
  let confirmation = null;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (!isPreview) {
      // Production — the booking confirmation comes from the MCP tool result.
      // outputSchema root is a flat object (confirmation_id, status, ...) — no wrapper
      // array key, so read structuredContent directly as the confirmation object.
      const _result = await bridge.toolResult;
      confirmation = _result?.structuredContent || null;
      if (confirmation && !confirmation.confirmation_id && !confirmation.status) {
        confirmation = null;
      }
    }
  }

  block.textContent = '';
  if (confirmation) {
    renderConfirmation(block, confirmation, bridge);
  } else {
    renderForm(block, bridge);
  }

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

function makeField(labelText, control) {
  const field = document.createElement('label');
  field.className = 'sdsv-field';
  const span = document.createElement('span');
  span.className = 'sdsv-field-label';
  span.textContent = labelText;
  field.appendChild(span);
  field.appendChild(control);
  return field;
}

function renderForm(block, bridge) {
  const card = document.createElement('div');
  card.className = 'sdsv-card';

  const header = document.createElement('div');
  header.className = 'sdsv-header';
  header.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;
  const title = document.createElement('h3');
  title.className = 'sdsv-title';
  title.textContent = 'Book a Dacia Service Visit';
  header.appendChild(title);
  const desc = document.createElement('p');
  desc.className = 'sdsv-desc';
  desc.textContent = 'Request an appointment at an authorized service center. Enter your vehicle, service, and preferred slot.';
  header.appendChild(desc);
  card.appendChild(header);

  const form = document.createElement('form');
  form.className = 'sdsv-form';

  const modelSel = document.createElement('select');
  modelSel.className = 'sdsv-input';
  modelSel.name = 'vehicle_model';
  MODEL_OPTIONS.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    modelSel.appendChild(opt);
  });
  form.appendChild(makeField('Vehicle model', modelSel));

  const serviceSel = document.createElement('select');
  serviceSel.className = 'sdsv-input';
  serviceSel.name = 'service_type';
  SERVICE_TYPES.forEach((s) => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    serviceSel.appendChild(opt);
  });
  form.appendChild(makeField('Requested service', serviceSel));

  const locInput = document.createElement('input');
  locInput.className = 'sdsv-input';
  locInput.type = 'text';
  locInput.name = 'location';
  locInput.placeholder = 'City, county, or service center';
  form.appendChild(makeField('Preferred location', locInput));

  const dateInput = document.createElement('input');
  dateInput.className = 'sdsv-input';
  dateInput.type = 'date';
  dateInput.name = 'preferred_date';
  form.appendChild(makeField('Preferred date', dateInput));

  const actions = document.createElement('div');
  actions.className = 'sdsv-actions';

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'sdsv-btn sdsv-btn-primary';
  submitBtn.textContent = 'Request Appointment';

  const changeBtn = document.createElement('button');
  changeBtn.type = 'button';
  changeBtn.className = 'sdsv-btn sdsv-btn-ghost';
  changeBtn.textContent = 'Change Service Center';

  actions.appendChild(submitBtn);
  actions.appendChild(changeBtn);
  form.appendChild(actions);
  card.appendChild(form);
  block.appendChild(card);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!bridge) return;
    const summary = [
      `model ${modelSel.value}`,
      `service ${serviceSel.value}`,
      locInput.value ? `location ${locInput.value}` : '',
      dateInput.value ? `preferred date ${dateInput.value}` : '',
    ].filter(Boolean).join(', ');
    bridge.sendMessage(`Request a Dacia service appointment: ${summary}`);
  });

  changeBtn.addEventListener('click', () => {
    if (!bridge) return;
    const near = locInput.value ? ` near ${locInput.value}` : '';
    bridge.sendMessage(`Show me other authorized Dacia service centers${near}`);
  });
}

function renderConfirmation(block, c, bridge) {
  const card = document.createElement('div');
  card.className = 'sdsv-card';

  const header = document.createElement('div');
  header.className = 'sdsv-header';
  header.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;
  const title = document.createElement('h3');
  title.className = 'sdsv-title';
  title.textContent = 'Service Appointment Requested';
  header.appendChild(title);
  if (c.status) {
    const chip = document.createElement('span');
    chip.className = 'sdsv-chip';
    chip.textContent = c.status;
    header.appendChild(chip);
  }
  card.appendChild(header);

  const body = document.createElement('div');
  body.className = 'sdsv-conf-body';

  const rows = [
    ['Confirmation', c.confirmation_id],
    ['Service', c.service_type],
    ['Service center', c.service_center_name],
    ['Requested date', c.requested_date],
    ['Vehicle', c.vehicle_summary],
  ];
  rows.forEach(([label, value]) => {
    if (!value) return;
    const row = document.createElement('div');
    row.className = 'sdsv-row';
    const k = document.createElement('span');
    k.className = 'sdsv-row-label';
    k.textContent = label;
    const v = document.createElement('span');
    v.className = 'sdsv-row-value';
    v.textContent = value;
    row.appendChild(k);
    row.appendChild(v);
    body.appendChild(row);
  });

  if (c.message) {
    const msg = document.createElement('p');
    msg.className = 'sdsv-message';
    msg.textContent = c.message;
    body.appendChild(msg);
  }
  card.appendChild(body);

  const actions = document.createElement('div');
  actions.className = 'sdsv-actions sdsv-actions-conf';

  const againBtn = document.createElement('button');
  againBtn.type = 'button';
  againBtn.className = 'sdsv-btn sdsv-btn-primary';
  againBtn.textContent = 'Request Appointment';

  const changeBtn = document.createElement('button');
  changeBtn.type = 'button';
  changeBtn.className = 'sdsv-btn sdsv-btn-ghost';
  changeBtn.textContent = 'Change Service Center';

  actions.appendChild(againBtn);
  actions.appendChild(changeBtn);
  card.appendChild(actions);
  block.appendChild(card);

  againBtn.addEventListener('click', () => {
    if (!bridge) return;
    bridge.sendMessage('Book another Dacia service appointment');
  });
  changeBtn.addEventListener('click', () => {
    if (!bridge) return;
    const name = c.service_center_name ? ` other than ${c.service_center_name}` : '';
    bridge.sendMessage(`Show me other authorized Dacia service centers${name}`);
  });
}
