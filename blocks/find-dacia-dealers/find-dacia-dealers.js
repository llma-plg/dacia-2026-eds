// codegen:layout-pattern=store-locator
// Sample data for standalone/preview mode. In production, data comes from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'AMAT', address: 'Bd. Nicolae Balcescu 204, 110331 Pitesti', city: 'Pitesti', county: 'Arges', phone: '0248 223 555', latitude: 44.8744273, longitude: 24.8475421 },
  { name: 'Auto Bara & Co', address: 'Sos. Borsului 22, 410605 Oradea', city: 'Oradea', county: 'Bihor', phone: '0259 440 000', latitude: 47.0889722, longitude: 21.8760141 },
  { name: 'Auto Cobalcescu', address: 'Splaiul Unirii 309, Sector 3, 010193 Bucuresti', city: 'Bucuresti', county: 'Bucuresti', phone: '0374 495 486', latitude: 44.4189593, longitude: 26.1118229 },
  { name: 'Auto Europa', address: 'Calea Sagului 142/A, 300516 Timisoara', city: 'Timisoara', county: 'Timis', phone: '0356 803 450', latitude: 45.7135833, longitude: 21.1924723 },
  { name: 'Dacia Service Cluj', address: 'Calea Turzii 253-255, 400495 Cluj-Napoca', city: 'Cluj-Napoca', county: 'Cluj', phone: '0264 438 443', latitude: 46.7414643, longitude: 23.591943 },
  { name: 'BRAS SRL', address: 'DN28, Soseaua Iasi-Targu Frumos KM 10, 707305 Iasi', city: 'Iasi', county: 'Iasi', phone: '0232 276 320', latitude: 47.1858555, longitude: 27.4495487 },
];

const ACCENT = '#646b52';
const MAX_STORES = 6;

// Brand colors from DESIGN_TOKENS' color tier. getThemedCardBg darkens PALETTE[0]
// to luminance <= 0.12 so white text keeps WCAG AA contrast.
const PALETTE = ['#646b52', '#3860be', '#000000', '#ffffff'];
function getThemedCardBg(p) {
  if (!p || !p[0]) return null;
  let hex = p[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  const [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const rl = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
  if (rl(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0; let hi = 1;
  for (let i = 0; i < 20; i += 1) { const m = (lo + hi) / 2; if (rl(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m; }
  const dr = Math.round(r * lo); const dg = Math.round(g * lo); const db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

// ── Map engine ───────────────────────────────────────────────────────────────
const MAP_LEAFLET_VERSION = '1.9.4';
const MAP_LEAFLET_CSS = 'https://unpkg.com/leaflet@' + MAP_LEAFLET_VERSION + '/dist/leaflet.css';
const MAP_LEAFLET_JS = 'https://unpkg.com/leaflet@' + MAP_LEAFLET_VERSION + '/dist/leaflet.js';
const MAP_TILE_URL = 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const MAP_TILE_ATTRIB = 'Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const MAP_TILE_MAX_NATIVE_ZOOM = 16;
const MAP_TILE_MAX_ZOOM = 18;

let __mapLeafletPromise = null;

function loadLeaflet() {
  const cssLink = document.querySelector('link[data-leaflet="' + MAP_LEAFLET_VERSION + '"]');
  if (window.L && cssLink && cssLink.dataset.loaded === '1') {
    return Promise.resolve(window.L);
  }
  if (__mapLeafletPromise) return __mapLeafletPromise;

  const cssReady = new Promise(function (resolve) {
    const existing = document.querySelector('link[data-leaflet="' + MAP_LEAFLET_VERSION + '"]');
    if (existing) {
      if (existing.dataset.loaded === '1') resolve();
      else existing.addEventListener('load', function () { resolve(); }, { once: true });
      setTimeout(resolve, 1500);
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = MAP_LEAFLET_CSS;
    link.dataset.leaflet = MAP_LEAFLET_VERSION;
    link.addEventListener('load', function () { link.dataset.loaded = '1'; resolve(); }, { once: true });
    link.addEventListener('error', function () { resolve(); }, { once: true });
    document.head.appendChild(link);
    setTimeout(resolve, 1500);
  });

  const jsReady = new Promise(function (resolve, reject) {
    if (window.L) { resolve(window.L); return; }
    const script = document.createElement('script');
    script.src = MAP_LEAFLET_JS;
    script.async = true;
    script.onload = function () {
      if (window.L) resolve(window.L);
      else reject(new Error('Leaflet loaded but window.L is missing'));
    };
    script.onerror = function () { reject(new Error('Failed to load Leaflet')); };
    document.head.appendChild(script);
  });

  __mapLeafletPromise = Promise.all([jsReady, cssReady]).then(function (r) { return r[0]; });
  return __mapLeafletPromise;
}

function mapCoordsOf(item) {
  if (!item) return null;
  const num = function (v) {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : null;
  };
  const lat = num(item.latitude !== undefined ? item.latitude : item.lat);
  let lngRaw = item.longitude;
  if (lngRaw === undefined) lngRaw = item.lng;
  if (lngRaw === undefined) lngRaw = item.lon;
  const lng = num(lngRaw);
  if (lat === null || lng === null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat: lat, lng: lng };
}

function mapPointsFrom(items) {
  const out = [];
  (items || []).forEach(function (item, index) {
    const c = mapCoordsOf(item);
    if (c) out.push({ item: item, index: index, lat: c.lat, lng: c.lng });
  });
  return out;
}

function mapProject(points, box) {
  const b = box || [14, 14, 72, 72];
  const lats = points.map(function (p) { return p.lat; });
  const lngs = points.map(function (p) { return p.lng; });
  const minLat = Math.min.apply(null, lats);
  const maxLat = Math.max.apply(null, lats);
  const minLng = Math.min.apply(null, lngs);
  const maxLng = Math.max.apply(null, lngs);
  const spanLat = maxLat - minLat;
  const spanLng = maxLng - minLng;
  return points.map(function (p) {
    const fx = spanLng > 0 ? (p.lng - minLng) / spanLng : 0.5;
    const fy = spanLat > 0 ? (maxLat - p.lat) / spanLat : 0.5;
    return { x: b[0] + fx * b[2], y: b[1] + fy * b[3] };
  });
}

function mapMakePin(point, ordinal, opts, asButton) {
  const pin = document.createElement(asButton ? 'button' : 'span');
  if (asButton) pin.type = 'button';
  pin.className = 'find-dacia-dealers-map-pin';
  if (opts.pinColor) pin.style.background = opts.pinColor;
  const num = document.createElement('span');
  num.className = 'find-dacia-dealers-map-pin-num';
  num.textContent = String(ordinal);
  pin.appendChild(num);
  const label = String(point.item[opts.labelField] || point.item.name || '').trim();
  if (asButton) pin.setAttribute('aria-label', label || ('Location ' + ordinal));
  return pin;
}

function mapWhenWidthStable(el) {
  return new Promise(function (resolve) {
    let last = -1;
    let stable = 0;
    const started = Date.now();
    const tick = function () {
      const w = el.offsetWidth;
      if (w > 0 && w === last) stable += 1; else stable = 0;
      last = w;
      if ((w > 0 && stable >= 2) || Date.now() - started > 2000) { resolve(w); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function mapRenderFallback(container, points, onSelect, opts) {
  container.classList.add('is-fallback');
  const grid = document.createElement('div');
  grid.className = 'find-dacia-dealers-map-grid';
  container.appendChild(grid);

  const projected = mapProject(points, opts.fallbackBox);
  const pins = points.map(function (p, i) {
    const anchor = document.createElement('div');
    anchor.className = 'find-dacia-dealers-map-anchor';
    anchor.style.left = projected[i].x + '%';
    anchor.style.top = projected[i].y + '%';
    const pin = mapMakePin(p, i + 1, opts, true);
    anchor.appendChild(pin);
    pin.addEventListener('click', function () { onSelect(p.index); });
    container.appendChild(anchor);
    return pin;
  });

  return {
    setActive: function (index) {
      points.forEach(function (p, i) { pins[i].classList.toggle('is-active', p.index === index); });
    },
    invalidate: function () {},
  };
}

function mapDynamicMaxZoom(bounds) {
  const lats = bounds.map(function (b) { return b[0]; });
  const lngs = bounds.map(function (b) { return b[1]; });
  const span = Math.max(
    Math.max.apply(null, lats) - Math.min.apply(null, lats),
    Math.max.apply(null, lngs) - Math.min.apply(null, lngs),
  );
  if (span > 8) return 6;
  if (span > 2) return 8;
  if (span > 0.3) return 10;
  return 11;
}

function mapRenderLeaflet(L, container, points, onSelect, opts) {
  const map = L.map(container, {
    scrollWheelZoom: false,
    zoomControl: opts.zoomControl !== false,
    attributionControl: true,
  });
  if (map.attributionControl) map.attributionControl.setPrefix('');

  const tiles = L.tileLayer(MAP_TILE_URL, {
    attribution: MAP_TILE_ATTRIB,
    detectRetina: false,
    maxNativeZoom: MAP_TILE_MAX_NATIVE_ZOOM,
    maxZoom: MAP_TILE_MAX_ZOOM,
    keepBuffer: 4,
    updateWhenIdle: false,
    updateWhenZooming: true,
  }).addTo(map);

  const bounds = points.map(function (p) { return [p.lat, p.lng]; });
  if (bounds.length === 1) {
    map.setView(bounds[0], opts.singleZoom || 11);
  } else {
    map.fitBounds(bounds, {
      paddingTopLeft: opts.fitPaddingTopLeft || [30, 30],
      paddingBottomRight: opts.fitPaddingBottomRight || [30, 30],
      maxZoom: opts.maxZoom || mapDynamicMaxZoom(bounds),
    });
  }

  points.forEach(function (p, i) {
    const marker = L.marker([p.lat, p.lng], {
      icon: L.divIcon({ className: 'find-dacia-dealers-map-marker', html: '', iconSize: null, iconAnchor: [0, 0] }),
      keyboard: true,
      riseOnHover: true,
      title: String(p.item[opts.labelField] || p.item.name || ''),
      alt: String(p.item[opts.labelField] || p.item.name || 'Location'),
    }).addTo(map);

    const pin = mapMakePin(p, i + 1, opts, false);
    p.marker = marker;
    p.pin = pin;

    const attach = function () {
      const host = marker.getElement();
      if (host) host.appendChild(pin);
    };
    marker.on('add', attach);
    attach();

    marker.on('click', function () { onSelect(p.index); });
  });

  const refresh = function () {
    map.invalidateSize(false);
    tiles.redraw();
  };
  requestAnimationFrame(refresh);
  [80, 200, 400, 800, 1400].forEach(function (ms) { setTimeout(refresh, ms); });

  if (typeof ResizeObserver !== 'undefined') {
    let lastW = container.offsetWidth;
    let lastH = container.offsetHeight;
    const ro = new ResizeObserver(function () {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      refresh();
    });
    ro.observe(container);
  }

  return {
    setActive: function (index, pan) {
      points.forEach(function (p) {
        const on = p.index === index;
        if (p.pin) p.pin.classList.toggle('is-active', on);
        if (p.marker && p.marker.setZIndexOffset) p.marker.setZIndexOffset(on ? 1000 : 0);
        if (on && pan) map.panTo([p.lat, p.lng], { animate: true });
      });
    },
    invalidate: refresh,
  };
}

function mountMap(container, points, onSelect, options) {
  if (!points || !points.length) return Promise.resolve(null);
  const opts = Object.assign({ pinStyle: 'number', labelField: 'name' }, options || {});

  const loading = document.createElement('div');
  loading.className = 'find-dacia-dealers-map-loading';
  loading.textContent = 'Loading map…';
  container.appendChild(loading);

  return Promise.all([loadLeaflet(), mapWhenWidthStable(container)])
    .then(function (r) {
      loading.remove();
      return mapRenderLeaflet(r[0], container, points, onSelect, opts);
    })
    .catch(function () {
      container.textContent = '';
      container.classList.remove('leaflet-container');
      return mapRenderFallback(container, points, onSelect, opts);
    });
}

// ── Widget ───────────────────────────────────────────────────────────────────

const SERVICE_LABELS = {
  vehicle_sales: 'Vehicle Sales',
  test_drive: 'Test Drive',
  maintenance: 'Maintenance',
  body_repair: 'Body Repair',
  lpg_repair: 'LPG Repair',
};

function serviceLabel(s) {
  const key = String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return SERVICE_LABELS[key] || String(s);
}

export default async function decorate(block, bridge) {
  let allStores = null;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext && bridge.hostContext.preview === true;
    if (isPreview) {
      allStores = SAMPLE_DATA;
    } else {
      try {
        const _result = await bridge.toolResult;
        const sc = (_result && _result.structuredContent) || {};
        // structuredContent.dealers — bare array outputSchema; key derived from actionName "find_dacia_dealers"
        allStores = sc.dealers || (Array.isArray(sc) ? sc : null);
      } catch (e) { allStores = null; }
    }
  } else {
    allStores = SAMPLE_DATA;
  }

  // Sort by distance when the field is present.
  if (Array.isArray(allStores)) {
    allStores = allStores.slice().sort(function (a, b) {
      const da = typeof a.distance_km === 'number' ? a.distance_km : Infinity;
      const db = typeof b.distance_km === 'number' ? b.distance_km : Infinity;
      return da - db;
    });
  }

  function renderNoResults() {
    const empty = document.createElement('div');
    empty.className = 'find-dacia-dealers-empty';

    const formCard = document.createElement('div');
    formCard.className = 'find-dacia-dealers-form-card';
    formCard.style.background = theme ? theme.bg : '#5d644d';

    const pin = document.createElement('span');
    pin.className = 'find-dacia-dealers-pin';
    pin.textContent = '◎';
    pin.style.color = theme ? theme.fg : '#fff';
    formCard.appendChild(pin);

    const heading = document.createElement('h3');
    heading.className = 'find-dacia-dealers-heading';
    heading.textContent = 'No stores found';
    heading.style.color = theme ? theme.fg : '#fff';
    formCard.appendChild(heading);

    const hint = document.createElement('p');
    hint.className = 'find-dacia-dealers-hint';
    hint.textContent = 'Try another location.';
    hint.style.color = theme ? theme.fg : '#fff';
    formCard.appendChild(hint);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'find-dacia-dealers-input';
    input.placeholder = 'Enter ZIP code…';
    input.setAttribute('aria-label', 'ZIP code or locality');
    formCard.appendChild(input);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'find-dacia-dealers-search-btn';
    btn.textContent = 'Find Nearby';
    formCard.appendChild(btn);

    const submit = function () {
      const value = input.value.trim();
      if (!value) { input.focus(); return; }
      if (bridge && bridge.sendMessage) bridge.sendMessage('Find stores near ' + value);
    };
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });

    empty.appendChild(formCard);
    block.appendChild(empty);
  }

  function buildCtas(store) {
    const ctas = document.createElement('div');
    ctas.className = 'find-dacia-dealers-ctas';
    const label = store.name || 'this location';

    const dir = document.createElement('button');
    dir.type = 'button';
    dir.className = 'find-dacia-dealers-cta is-primary';
    dir.textContent = 'Get Directions';
    dir.addEventListener('click', function () {
      if (!bridge) return;
      if (store.directions_url) bridge.openLink(store.directions_url);
      else if (bridge.sendMessage) bridge.sendMessage('Get directions to ' + label);
    });
    ctas.appendChild(dir);

    const call = document.createElement('button');
    call.type = 'button';
    call.className = 'find-dacia-dealers-cta';
    call.textContent = 'Call Location';
    call.addEventListener('click', function () {
      if (bridge && bridge.sendMessage) bridge.sendMessage('Call ' + label + (store.phone ? ' at ' + store.phone : ''));
    });
    ctas.appendChild(call);

    const test = document.createElement('button');
    test.type = 'button';
    test.className = 'find-dacia-dealers-cta';
    test.textContent = 'Book Test Drive';
    test.addEventListener('click', function () {
      if (bridge && bridge.sendMessage) bridge.sendMessage('Book a test drive at ' + label);
    });
    ctas.appendChild(test);

    const svc = document.createElement('button');
    svc.type = 'button';
    svc.className = 'find-dacia-dealers-cta';
    svc.textContent = 'Schedule Service';
    svc.addEventListener('click', function () {
      if (bridge && bridge.sendMessage) bridge.sendMessage('Schedule a service appointment at ' + label);
    });
    ctas.appendChild(svc);

    return ctas;
  }

  function renderResults(stores) {
    if (!stores || !stores.length) { renderNoResults(); return; }
    const shown = stores.slice(0, MAX_STORES);
    const points = mapPointsFrom(shown);

    const layout = document.createElement('div');
    layout.className = 'find-dacia-dealers-layout';

    const mapEl = document.createElement('div');
    mapEl.className = 'find-dacia-dealers-map';
    mapEl.setAttribute('role', 'application');
    mapEl.setAttribute('aria-label', 'Map of ' + points.length + ' location' + (points.length === 1 ? '' : 's'));

    const side = document.createElement('div');
    side.className = 'find-dacia-dealers-side';

    const rowWrap = document.createElement('div');
    rowWrap.className = 'find-dacia-dealers-row-wrap';

    const row = document.createElement('div');
    row.className = 'find-dacia-dealers-row';

    const cards = shown.map(function (store, i) {
      const card = document.createElement('div');
      card.className = 'find-dacia-dealers-store-card';
      card.tabIndex = 0;
      card.style.background = theme ? theme.bg : '#5d644d';
      card.style.color = theme ? theme.fg : '#fff';

      const top = document.createElement('div');
      top.className = 'find-dacia-dealers-store-top';

      const pinDiv = document.createElement('div');
      pinDiv.className = 'find-dacia-dealers-store-pin';
      const pinOrdinal = points.findIndex(function (p) { return p.index === i; });
      pinDiv.textContent = pinOrdinal >= 0 ? String(pinOrdinal + 1) : '◎';
      if (pinOrdinal >= 0) pinDiv.style.background = ACCENT;
      top.appendChild(pinDiv);

      const headings = document.createElement('div');
      if (store.location_type) {
        const type = document.createElement('div');
        type.className = 'find-dacia-dealers-store-type';
        type.textContent = store.location_type;
        headings.appendChild(type);
      }
      const name = document.createElement('div');
      name.className = 'find-dacia-dealers-store-name';
      name.textContent = store.name || '';
      headings.appendChild(name);
      top.appendChild(headings);
      card.appendChild(top);

      if (store.address) {
        const addr = document.createElement('div');
        addr.className = 'find-dacia-dealers-store-addr';
        addr.textContent = store.address;
        card.appendChild(addr);
      }

      if (typeof store.distance_km === 'number') {
        const dist = document.createElement('div');
        dist.className = 'find-dacia-dealers-store-dist';
        dist.textContent = store.distance_km + ' km away';
        card.appendChild(dist);
      }

      if (store.phone) {
        const phone = document.createElement('div');
        phone.className = 'find-dacia-dealers-store-phone';
        phone.textContent = store.phone;
        card.appendChild(phone);
      }

      if (store.opening_hours) {
        const hours = document.createElement('div');
        hours.className = 'find-dacia-dealers-store-hours';
        hours.textContent = store.opening_hours;
        card.appendChild(hours);
      }

      if (Array.isArray(store.services) && store.services.length) {
        const badges = document.createElement('div');
        badges.className = 'find-dacia-dealers-badges';
        store.services.forEach(function (s) {
          const b = document.createElement('span');
          b.className = 'find-dacia-dealers-badge';
          b.textContent = serviceLabel(s);
          badges.appendChild(b);
        });
        card.appendChild(badges);
      }

      card.appendChild(buildCtas(store));

      card.addEventListener('click', function () { select(i); });
      card.addEventListener('focusin', function () { select(i); });
      row.appendChild(card);
      return card;
    });

    rowWrap.appendChild(row);

    const fade = document.createElement('div');
    fade.className = 'find-dacia-dealers-fade';
    fade.style.background = 'linear-gradient(to right, transparent, ' + (theme ? theme.bg : '#5d644d') + 'cc)';
    rowWrap.appendChild(fade);
    side.appendChild(rowWrap);

    if (points.length) layout.appendChild(mapEl);
    layout.appendChild(side);
    block.appendChild(layout);

    let mapApi = null;
    let activeIdx = -1;

    function select(index) {
      if (index === activeIdx) return;
      activeIdx = index;
      cards.forEach(function (c, i) { c.classList.toggle('is-selected', i === index); });
      if (mapApi) mapApi.setActive(index, true);
      const card = cards[index];
      if (card) row.scrollLeft = Math.max(0, card.offsetLeft - row.offsetLeft - 4);
    }

    if (points.length) {
      mountMap(mapEl, points, select, {
        pinStyle: 'number',
        pinColor: ACCENT,
        labelField: 'name',
        maxZoom: 13,
        singleZoom: 13,
      }).then(function (api) {
        mapApi = api;
        if (api && activeIdx >= 0) api.setActive(activeIdx, false);
      });
    }

    if (cards.length) select(0);
  }

  renderResults(allStores);

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { bridge.reportSize(block.offsetWidth, block.offsetHeight); }, 150);
    });
    ro.observe(block);
  }
}
