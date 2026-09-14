const $ = selector => document.querySelector(selector);
const form = $('#adventure-form');
const state = { adventures: [], selected: 0, result: null };
let api, places, starts;
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
let appearance = 'system';
function setTheme(preference) {
  appearance = ['system', 'light', 'dark'].includes(preference) ? preference : 'system';
  const dark = appearance === 'system' ? systemTheme.matches : appearance === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.dataset.appearance = appearance;
  $('#theme-select').value = appearance;
}
try { setTheme(localStorage.getItem('ra-appearance') || 'system'); } catch { setTheme('system'); }
$('#theme-select').addEventListener('change', event => {
  setTheme(event.target.value);
  try { localStorage.setItem('ra-appearance', appearance); } catch { /* Optional local preference. */ }
  announce(appearance === 'system' ? 'A megjelenés követi a rendszer beállítását.' : appearance === 'dark' ? 'Sötét megjelenés bekapcsolva.' : 'Világos megjelenés bekapcsolva.');
});
systemTheme.addEventListener('change', () => { if (appearance === 'system') setTheme('system'); });
document.addEventListener('keydown', event => {
  if (event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey && event.code === 'KeyV' && !event.repeat && !event.isComposing) {
    event.preventDefault();
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(theme);
    try { localStorage.setItem('ra-appearance', theme); } catch { /* Optional local preference. */ }
    announce(theme === 'dark' ? 'Sötét megjelenés bekapcsolva.' : 'Világos megjelenés bekapcsolva.');
  }
});
const make = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined && text !== null) element.textContent = text;
  if (className) element.className = className;
  return element;
};
function announce(text) { $('#announcement').textContent = text; }
function inputs() {
  const values = new FormData(form);
  return { duration: Number(values.get('duration')), mood: values.get('mood'), transport: values.get('transport'), start: values.get('start'), mode: values.get('mode'), interest: values.get('interest') };
}
function externalLink(text, href, className) {
  const safe = api.safeExternalUrl(href);
  if (!safe) return make('span', `${text} · nincs biztonságos hivatkozás`, className);
  const link = make('a', text, className);
  link.href = safe; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer';
  return link;
}
function showEmpty(status, minimum, focus = false) {
  const content = {
    'missing-data': ['Ehhez még kevés a helyadat.', 'Ezen a kiindulóponton vagy ehhez a közlekedéshez még nincs elegendő ellenőrzött célpont. Próbáld Győrt vagy Budapestet; két megállóhoz két külön helyre van szükség.'],
    'no-match': ['Ez most nem fér bele.', `A legrövidebb ilyen kaland is kb. ${minimum} percet igényel a visszaúttal és tartalékkal együtt. Adj több időt, válassz egy célpontot vagy próbálj más közlekedést.`],
    'invalid-input': ['Nézzük át a beállításokat.', 'Válassz időt, hangulatot, közlekedést és egy kiindulópontot.'],
    'load-error': ['A kalandok most nem töltődtek be.', 'Az oldal egyik szükséges fájlja nem érhető el. Ellenőrizd az internetkapcsolatot, majd töltsd újra az oldalt.'],
  }[status];
  state.adventures = []; state.selected = 0;
  $('#plan-output').hidden = true; $('#empty-state').hidden = false;
  $('#empty-title').textContent = content[0]; $('#empty-message').textContent = content[1];
  $('#recover').hidden = false;
  $('#recover').textContent = status === 'load-error' ? 'Oldal újratöltése' : 'Vissza a beállításokhoz';
  $('#recover').onclick = () => { if (status === 'load-error') location.reload(); else { $('#start').focus(); $('#planner').scrollIntoView({ block: 'start' }); } };
  $('#copy-text').value = ''; $('#copy-fallback').hidden = true;
  $('#maps-link').removeAttribute('href');
  announce(content.join(' '));
  if (focus) $('#empty-state').focus({ preventScroll: true });
}
function generate({ focus = false, reroll = false } = {}) {
  try {
    const previous = state.adventures[state.selected]?.id;
    const result = api.planAdventures(inputs(), places, starts);
    state.result = result;
    if (result.status !== 'ok') { showEmpty(result.status, result.minimum, focus); return; }
    state.adventures = result.adventures;
    state.selected = reroll && state.adventures.length > 1 ? Math.max(0, state.adventures.findIndex(p => p.id !== previous)) : 0;
    render();
    if (focus) {
      $('#mission-title').focus({ preventScroll: true });
      $('#mission-title').scrollIntoView({ block: 'center', behavior: 'instant' });
    }
    const p = state.adventures[state.selected];
    announce(`${p.title} ${p.total} perc becsült teljes idő, ${p.input.duration} perc keretben. ${state.adventures.length} választható kaland.${result.incomplete ? ' Hiányos helyadatokat kihagytunk.' : ''}${reroll && state.adventures.length === 1 ? ' Jelenleg ez az egy változat fér bele.' : ''}`);
  } catch (error) {
    console.error('A helyi kalandgenerálás sikertelen.', error);
    showEmpty('load-error', null, focus);
  }
}
function render() {
  const p = state.adventures[state.selected];
  $('#empty-state').hidden = true; $('#plan-output').hidden = false;
  $('#copy-fallback').hidden = true; $('#copy-text').value = '';
  $('#copy-plan').textContent = 'Terv másolása';
  $('#category').textContent = p.stops[0].category;
  const countryside = p.stops.some(stop => stop.setting === 'rural' || api.distanceKm(p.route[0], stop) > 5);
  $('.landscape').src = countryside ? './assets/countryside.svg' : './assets/adventure.svg';
  $('#visual-region').textContent = p.route[0].region === 'gyor' ? 'GYŐR' : 'BUDAPEST';
  $('#mission-kicker').textContent = p.input.mode === 'chaos' ? 'Meglepetés, a kereteiden belül' : 'A következő kalandod';
  $('#xp').textContent = 'Opcionális extra csavar';
  $('#mission-title').textContent = p.title;
  $('#mission-place').textContent = p.stops.map(s => s.name).join(' → ');
  $('#mission-intro').textContent = {
    calm: 'Nem kell sietni. Most az a feladat, hogy egy kicsit megállj, és valami másra figyelj.',
    curious: 'Egy ismerős városban is várhat egy új részlet. A mai feladatod: találj valamit, ami mellett eddig elmentél.',
    spark: 'Legyen egy apró fordulat a napodban. Indulj el, nézz körül, és hozz vissza egy történetet.',
  }[p.input.mood];
  $('#total').textContent = `~${p.total} perc`;
  $('#distance').textContent = `~${p.distance.toLocaleString('hu-HU', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} km`;
  $('#fit-note').textContent = `✓ A becslés szerint belefér a ${p.input.duration} perces keretbe · ${p.remaining} perc marad. Indulás előtt ellenőrizd az útvonalat.`;
  $('#stop-count').textContent = `${p.stops.length} megálló · ${api.transportNames[p.input.transport]}`;
  const list = $('#mission-steps'); list.replaceChildren();
  p.stops.forEach((stop, i) => {
    const li = make('li'), body = make('div');
    body.append(make('strong', `${stop.name} · ${stop.duration} perc a helyszínen`), make('p', `Előtte: kb. ${p.legs[i].minutes} perc út ${p.legs[i].from.name} ponttól. ${stop.action}`));
    li.append(body); list.append(li);
  });
  const last = make('li'), body = make('div');
  body.append(make('strong', `Visszaérkezés · ${p.route[0].name}`), make('p', `Kb. ${p.legs.at(-1).minutes} perc visszaút. A teljes terv ezen felül ${p.buffer} perc tartalékot is tartalmaz.`));
  last.append(body); list.append(last);
  $('#time-equation').textContent = `${p.travel} + ${p.activity} + ${p.buffer} = ${p.total} perc`;
  const breakdown = $('#time-breakdown'); breakdown.replaceChildren();
  const row = (text, minutes) => { const r = make('div', null, 'breakdown-row'); r.append(make('span', text), make('span', `${minutes} perc`)); breakdown.append(r); };
  p.legs.forEach((leg, i) => { row(`${leg.from.name} → ${leg.to.name}`, leg.minutes); if (i < p.stops.length) row(`Program: ${p.stops[i].name}`, p.stops[i].duration); });
  row('Tartalék (legalább 10 perc, egyébként 20%)', p.buffer); row('Teljes becsült idő', p.total);
  const maps = api.directionsUrl(p.route, p.input.transport);
  $('#maps-link').href = maps || api.directionsUrl([p.route[0], p.route[1]], p.input.transport);
  $('#maps-link').textContent = maps ? 'Útvonal a Google Mapsben ↗' : 'Első szakasz a Google Mapsben ↗';
  $('#maps-note').textContent = maps ? 'Külső térképen nyílik meg. Csak a nyilvános mintapontok kerülnek a linkbe. A köztes megállók kezelése eszközfüggő; az egyes szakaszok lent külön is megnyithatók.' : 'A közösségi út külön szakaszokban nyílik meg. Az összes szakasz linkjét lent, az útvonalvázlatban találod. Nincs élő menetrendi adat.';
  $('#ev-note').hidden = p.input.transport !== 'ev';
  $('#partner-description').textContent = p.input.transport === 'ev'
    ? `Egy későbbi változat a(z) ${p.stops[0].name} közelében megfelelő töltőt és a töltés idejére programot kereshetne.`
    : `Egy későbbi változat a(z) ${p.stops[0].name} közelében ellenőrzött pihenő- vagy étkezési lehetőséget ajánlhatna, ha az belefér az utadba.`;
  renderExtra(); renderAlternatives(); renderMap(p); renderSources(p);
}
const extraTasks = {
  notice: 'A helyszínen keress egy részletet, amely mellett máskor elmennél. Adj neki egy saját címet.',
  quiet: 'A helyszínen tedd el a telefonod egy percre, és figyelj meg három különböző hangot.',
  social: 'Ha társasággal érkezel, válasszon valaki egy részletet, te pedig találj ki hozzá egy mondatot. Egyedül járva adj neki címet egy barátodnak szánt képeslaphoz.',
};
function renderExtra() {
  const p = state.adventures[state.selected];
  if (!p) return;
  $('.extra-twist').dataset.accepted = String(Boolean(p.extra));
  $('#extra-kind').value = p.extraKind || 'notice';
  $('#extra-description').textContent = extraTasks[p.extraKind || 'notice'];
  $('#extra-toggle').textContent = p.extra ? 'Hozzáadva ✓ · Mégsem kérem' : 'Benne vagyok';
  $('#extra-toggle').setAttribute('aria-pressed', String(Boolean(p.extra)));
}
$('#extra-kind').addEventListener('change', event => {
  const p = state.adventures[state.selected]; if (!p) return;
  p.extraKind = event.target.value;
  if (p.extra) p.extra = extraTasks[p.extraKind];
  renderExtra(); $('#copy-plan').textContent = 'Terv másolása'; $('#copy-fallback').hidden = true;
});
$('#extra-toggle').addEventListener('click', () => {
  const p = state.adventures[state.selected]; if (!p) return;
  p.extra = p.extra ? null : extraTasks[p.extraKind || 'notice'];
  renderExtra(); $('#copy-plan').textContent = 'Terv másolása'; $('#copy-fallback').hidden = true;
  announce(p.extra ? 'Az extra feladat bekerült a tervbe, a helyszíni időn belül.' : 'Az extra feladatot kivettük a tervből.');
});
function renderAlternatives() {
  const container = $('#alternatives'); container.replaceChildren();
  $('#alternative-count').textContent = `${state.adventures.length} beleférő ötlet`;
  state.adventures.forEach((p, index) => {
    const b = make('button', null, 'alternative'); b.type = 'button'; b.setAttribute('aria-pressed', String(state.selected === index));
    b.append(make('span', p.stops.length === 2 ? 'Két megállós felfedezés' : p.stops[0].category, 'alt-tag'),
      make('strong', p.stops.map(s => s.name).join(' + ')), make('span', `~${p.total} perc · ${p.stops.length} megálló`, 'alt-meta'));
    const choice = make('span', state.selected === index ? 'Kiválasztva' : 'Ezt választom', 'alt-choice'); choice.append(make('span', state.selected === index ? '✓' : '↗')); b.append(choice);
    b.addEventListener('click', () => { state.selected = index; render(); $('#mission-title').focus({ preventScroll: true }); $('#mission-title').scrollIntoView({ block: 'center', behavior: 'instant' }); announce(`Kiválasztva: ${p.title} Becsült teljes idő: ${p.total} perc.`); });
    container.append(b);
  });
}
function renderMap(p) {
  const svg = $('#route-map'); svg.replaceChildren();
  const ns = 'http://www.w3.org/2000/svg';
  function shape(tag, attrs, text) { const n = document.createElementNS(ns, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, String(v))); if (text) n.textContent = text; svg.append(n); return n; }
  shape('title', {}, 'Földrajzi vázlat: ' + p.route.map(point => point.name).join(' → '));
  const unique = p.route.slice(0, -1), factor = Math.cos(p.route[0].lat * Math.PI / 180);
  const coords = unique.map(pt => [pt.lng * factor, -pt.lat]);
  const minX = Math.min(...coords.map(c => c[0])), maxX = Math.max(...coords.map(c => c[0]));
  const minY = Math.min(...coords.map(c => c[1])), maxY = Math.max(...coords.map(c => c[1]));
  const scale = Math.min(500 / Math.max(maxX - minX, .00001), 155 / Math.max(maxY - minY, .00001));
  const points = coords.map(c => [320 + (c[0] - (minX + maxX) / 2) * scale, 136 + (c[1] - (minY + maxY) / 2) * scale]);
  for (let x = 40; x < 640; x += 40) shape('line', { x1: x, y1: 0, x2: x, y2: 260, stroke: '#dce2d4', 'stroke-width': 1 });
  for (let y = 20; y < 260; y += 40) shape('line', { x1: 0, y1: y, x2: 640, y2: y, stroke: '#dce2d4', 'stroke-width': 1 });
  shape('text', { x: 600, y: 30, fill: '#304f42', 'font-size': 17, 'text-anchor': 'middle' }, 'É ↑');
  shape('polyline', { points: [...points, points[0]].map(v => v.join(',')).join(' '), fill: 'none', stroke: '#9d482b', 'stroke-width': 3, 'stroke-dasharray': '8 7', 'stroke-linejoin': 'round' });
  points.forEach(([x, y], i) => { shape('circle', { cx: x, cy: y, r: 18, fill: i ? '#203f37' : '#fffefb', stroke: '#203f37', 'stroke-width': 2 }); shape('text', { x, y: y + 5, fill: i ? '#fffefb' : '#203f37', 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700 }, i ? String(i) : 'S'); });
  $('#route-legend').replaceChildren(...p.route.map((pt, i) => make('li', `${i === 0 ? 'Indulás' : i === p.route.length - 1 ? 'Visszaérkezés' : 'Megálló ' + i}: ${pt.name}`)));
  $('#leg-links').replaceChildren(...p.legs.map((leg, i) => externalLink(`${i + 1}. szakasz · ${i === p.legs.length - 1 ? 'Visszaút' : leg.to.name} ↗`, api.directionsUrl([leg.from, leg.to], p.input.transport))));
}
function renderSources(p) {
  const container = $('#source-links'); container.replaceChildren();
  const origin = make('div', null, 'source-entry'); origin.append(make('strong', `Indulópont: ${p.route[0].name}`), externalLink('Koordinátaforrás ↗', p.route[0].source)); container.append(origin);
  p.stops.forEach(stop => {
    const entry = make('div', null, 'source-entry');
    entry.append(make('strong', stop.name), make('p', stop.coordinateNote), externalLink('Helyszín forrása ↗', stop.source), externalLink('Koordinátaforrás ↗', stop.coordinateSource));
    container.append(entry);
  });
}
async function copyPlan() {
  const current = state.adventures[state.selected]; if (!current) return;
  const text = api.planText(current);
  try { await navigator.clipboard.writeText(text); $('#copy-plan').textContent = 'Másolva ✓'; announce('A küldetés és az útvonalszakaszok a vágólapra kerültek.'); }
  catch { $('#copy-fallback').hidden = false; $('#copy-text').value = text; $('#copy-text').focus(); $('#copy-text').select(); announce('A vágólap nem érhető el. A tervet kijelöltük kézi másoláshoz.'); }
}
form.addEventListener('submit', event => { event.preventDefault(); if (api) generate({ focus: true, reroll: true }); });
form.addEventListener('change', () => { if (api) generate(); });
$('#reroll').addEventListener('click', () => generate({ focus: true, reroll: true }));
$('#copy-plan').addEventListener('click', copyPlan);
$('#print-plan').addEventListener('click', () => window.print());
try {
  const [engine, data] = await Promise.all([import('./engine.js'), import('../data/places.js')]);
  api = engine; places = data.places; starts = data.startPoints;
  $('#generate').disabled = false;
  generate();
} catch (error) { console.error('A helyi adatfájl nem tölthető be.', error); showEmpty('load-error'); }
