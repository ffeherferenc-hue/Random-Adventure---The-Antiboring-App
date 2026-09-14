import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAdventure, planAdventures, estimateLeg, distanceKm, directionsUrl, placeUrl, safeExternalUrl, planText } from '../src/engine.js';
import { places, startPoints } from '../data/places.js';
const input = { start: 'gyor', duration: 60, transport: 'walk', mood: 'curious', mode: 'single' };
const p = places[0], q = places[1], origin = startPoints.gyor;
const seeded = () => 0.5;

test('EV uses the driving route and includes the charging limitation in exports', () => {
  const result = planAdventures({ ...input, duration: 180, transport: 'ev', mode: 'round' }, places, startPoints, seeded);
  assert.equal(result.status, 'ok');
  const plan = result.adventures[0];
  assert.equal(plan.legs.length, 3);
  assert.ok(plan.total <= 180);
  assert.equal(new URL(directionsUrl(plan.route, 'ev')).searchParams.get('travelmode'), 'driving');
  assert.match(planText(plan), /töltési idő nincs a tervben/);
});

test('interest changes ranking without admitting an over-budget itinerary', () => {
  const nature = planAdventures({ ...input, interest: 'nature' }, places, startPoints, seeded);
  assert.equal(nature.adventures[0].stops[0].id, 'rado');
  const hidden = planAdventures({ ...input, interest: 'hidden' }, places, startPoints, seeded);
  assert.equal(hidden.adventures[0].stops[0].id, 'becsi');
  for (const result of [nature, hidden]) assert.ok(result.adventures.every(p => p.total <= input.duration));
  assert.equal(planAdventures({ ...input, interest: 'fake' }, places, startPoints).status, 'invalid-input');
});

test('an optional task is exported only while accepted, within the existing activity time', () => {
  const plan = buildAdventure([p], input, origin);
  const total = plan.total;
  assert.doesNotMatch(planText(plan), /Választott extra csavar/);
  plan.extra = 'Figyelj meg három hangot.';
  assert.match(planText(plan), /Figyelj meg három hangot/);
  assert.equal(plan.total, total);
  plan.extra = null;
  assert.doesNotMatch(planText(plan), /Választott extra csavar/);
});
test('a long itinerary is never clamped to the requested duration', () => {
  const plan = buildAdventure([{ ...p, duration: 150 }], { ...input, duration: 30 }, origin);
  assert.ok(plan.total > 150); assert.equal(plan.fits, false); assert.ok(plan.remaining < 0);
});
test('two stops include all three legs, both activities and a separate buffer', () => {
  const plan = buildAdventure([p, q], { ...input, duration: 180 }, origin);
  const expectedTravel = estimateLeg(origin, p, 'walk').minutes + estimateLeg(p, q, 'walk').minutes + estimateLeg(q, origin, 'walk').minutes;
  assert.equal(plan.legs.length, 3); assert.equal(plan.activity, p.duration + q.duration);
  assert.equal(plan.travel, expectedTravel); assert.equal(plan.total, expectedTravel + p.duration + q.duration + plan.buffer);
  assert.equal(plan.route.at(-1), origin); assert.ok(plan.buffer >= 10);
});
test('the budget boundary is inclusive and one minute below is rejected', () => {
  const plan = buildAdventure([p], input, origin);
  assert.ok(buildAdventure([p], { ...input, duration: plan.total }, origin).fits);
  assert.equal(buildAdventure([p], { ...input, duration: plan.total - 1 }, origin).fits, false);
});
test('missing coordinates, duration and invalid transport are not invented', () => {
  for (const bad of [{ ...p, lat: null }, { ...p, lng: NaN }, { ...p, duration: undefined }, { ...p, duration: 0 }, { ...p, lat: 120 }, { ...p, duration: Infinity }]) assert.equal(buildAdventure([bad], input, origin), null);
  assert.equal(buildAdventure([p], { ...input, transport: 'teleport' }, origin), null);
  assert.equal(estimateLeg(origin, { x: 50, y: 20 }, 'walk'), null);
});
test('invalid input is a separate state', () => {
  for (const bad of [{ ...input, duration: NaN }, { ...input, start: '__proto__' }, { ...input, mood: 'fake' }, { ...input, mode: 'fake' }, { ...input, duration: -1 }]) assert.equal(planAdventures(bad, places, startPoints).status, 'invalid-input');
});
test('empty region and corrupt dataset return missing-data', () => {
  assert.equal(planAdventures({ ...input, start: 'balaton' }, places, startPoints).status, 'missing-data');
  assert.equal(planAdventures(input, null, startPoints).status, 'missing-data');
  assert.equal(planAdventures(input, [], startPoints).status, 'missing-data');
  assert.equal(planAdventures(input, [{ ...p, lat: null }], startPoints).status, 'missing-data');
});
test('incomplete records are skipped and reported without discarding usable places', () => {
  const result = planAdventures(input, [p, { ...q, duration: null }], startPoints, seeded);
  assert.equal(result.status, 'ok'); assert.equal(result.incomplete, 1); assert.equal(result.adventures.length, 1);
});
test('unverified, unavailable and incompatible places are excluded', () => {
  for (const bad of [{ ...p, verified: false }, { ...p, available: false }, { ...p, modes: ['car'] }]) assert.equal(planAdventures(input, [bad], startPoints).status, 'missing-data');
});
test('valid places over the time budget return no-match and the real minimum', () => {
  const result = planAdventures({ ...input, duration: 15 }, places, startPoints, seeded);
  assert.equal(result.status, 'no-match'); assert.ok(result.minimum > 15); assert.deepEqual(result.adventures, []);
});
test('one candidate cannot silently become a two-stop circuit', () => {
  assert.equal(planAdventures({ ...input, mode: 'round' }, [p], startPoints, seeded).status, 'missing-data');
  assert.equal(buildAdventure([p, p], input, origin), null);
});
test('reversed circuits are not duplicate alternatives', () => {
  const result = planAdventures({ ...input, duration: 180, mode: 'round' }, places, startPoints, seeded);
  assert.equal(result.adventures.length, 3);
  assert.equal(new Set(result.adventures.map(p => p.stops.map(s => s.id).sort().join(','))).size, 3);
});
test('all offered combinations fit and conserve complete itinerary time', () => {
  let tested = 0;
  for (const start of ['gyor', 'budapest']) for (const transport of ['walk', 'bike', 'transit', 'car']) for (const mood of ['calm', 'curious', 'spark']) for (const mode of ['single', 'round', 'chaos']) for (const duration of [30, 60, 180, 720]) {
    const result = planAdventures({ start, transport, mood, mode, duration }, places, startPoints, seeded);
    for (const plan of result.adventures) {
      assert.ok(plan.total <= duration); assert.ok(plan.remaining >= 0);
      assert.equal(plan.total, plan.travel + plan.activity + plan.buffer);
      assert.equal(plan.travel, plan.legs.reduce((sum, leg) => sum + leg.minutes, 0));
      assert.equal(plan.stops.length, mode === 'round' ? 2 : 1);
      assert.ok(plan.stops.every(p => p.region === start)); tested++;
    }
  }
  assert.ok(tested > 0); console.log(`Validated ${tested} offered itineraries across 288 input combinations.`);
});
test('geographic calculations use degrees and kilometers with symmetric distance', () => {
  assert.equal(distanceKm(origin, origin), 0);
  assert.ok(Math.abs(distanceKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 }) - 111.195) < .01);
  assert.equal(distanceKm(origin, p), distanceKm(p, origin));
});
test('Google circuit URL includes every stop in order and returns to origin', () => {
  const url = new URL(directionsUrl([origin, p, q, origin], 'walk'));
  assert.equal(url.origin, 'https://www.google.com'); assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('origin'), url.searchParams.get('destination'));
  assert.equal(url.searchParams.get('waypoints'), `${p.lat},${p.lng}|${q.lat},${q.lng}`);
  assert.equal(url.searchParams.get('travelmode'), 'walking');
  assert.ok(!url.searchParams.has('key')); assert.ok(!url.searchParams.has('query_place_id'));
});
test('transit is linked per segment because waypoints are unsupported', () => {
  assert.equal(directionsUrl([origin, p, origin], 'transit'), null);
  const url = new URL(directionsUrl([origin, p], 'transit'));
  assert.equal(url.searchParams.get('travelmode'), 'transit'); assert.equal(url.searchParams.has('waypoints'), false);
});
test('unsafe links and invalid coordinates are rejected', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', 'http://test.com', 'https://user:pass@example.com', 'not a url']) assert.equal(safeExternalUrl(url), null);
  assert.equal(placeUrl({ lat: null, lng: 10 }), null); assert.equal(directionsUrl([origin, p], 'fake'), null);
  assert.equal(directionsUrl([origin, { x: 1, y: 2 }], 'walk'), null);
});
test('place links use coordinates without transmitting names or user preferences', () => {
  const url = new URL(placeUrl({ ...p, name: '<script>bad</script>' }));
  assert.equal(url.searchParams.get('query'), `${p.lat},${p.lng}`);
  assert.equal(url.searchParams.size, 2);
});
test('share text includes all stops, return time, buffer and all segment URLs', () => {
  const plan = buildAdventure([p, q], { ...input, duration: 180 }, origin), text = planText(plan);
  assert.ok(text.includes(p.name)); assert.ok(text.includes(q.name)); assert.ok(text.includes(`${plan.buffer} perc tartalék`));
  assert.equal((text.match(/maps\/dir/g) || []).length, 3); assert.ok(text.includes('nem élő útvonalterv'));
});
