// Pure planning functions. No network, location access or browser dependencies.
export const transportNames = { walk: 'Séta', bike: 'Bicikli', transit: 'Közösségi', car: 'Autó', ev: 'Elektromos autó' };
export const moodNames = { calm: 'Kikapcsolnék', curious: 'Felfedeznék', spark: 'Felpezsdülnék' };
const profiles = {
  walk: { speed: 4, detour: 1.6, overhead: 2 },
  bike: { speed: 10, detour: 1.7, overhead: 5 },
  transit: { speed: 15, detour: 1.8, overhead: 15 },
  car: { speed: 20, detour: 1.8, overhead: 15 },
  ev: { speed: 20, detour: 1.8, overhead: 15 },
};
export function validCoordinates(p) {
  return p != null && Number.isFinite(p.lat) && Number.isFinite(p.lng)
    && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;
}
export function distanceKm(a, b) {
  if (!validCoordinates(a) || !validCoordinates(b)) return null;
  const rad = n => n * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
export function estimateLeg(a, b, transport) {
  const km = distanceKm(a, b), profile = profiles[transport];
  if (km === null || !profile) return null;
  if (km < 0.001) return { minutes: 0, km: 0 };
  const estimatedKm = km * profile.detour;
  return { minutes: Math.ceil(estimatedKm / profile.speed * 60) + profile.overhead, km: estimatedKm };
}
function validPlace(p) {
  return p && typeof p.id === 'string' && p.id.length > 0 && typeof p.name === 'string' && p.name.length > 0
    && validCoordinates(p) && Number.isFinite(p.duration) && p.duration > 0
    && Array.isArray(p.modes) && Array.isArray(p.moods) && typeof p.action === 'string'
    && typeof p.title === 'string' && p.verified === true && p.available !== false;
}
export function buildAdventure(stops, input, origin) {
  if (!validCoordinates(origin) || !profiles[input?.transport] || !Number.isFinite(input?.duration)
      || input.duration <= 0 || !Array.isArray(stops) || stops.length === 0 || stops.length > 2
      || new Set(stops.map(p => p?.id)).size !== stops.length || !stops.every(validPlace)) return null;
  if (stops.some(p => !p.modes.includes(input.transport) || p.region !== origin.region)) return null;
  // Every outward, inter-stop and return leg belongs to the same itinerary.
  const route = [origin, ...stops, origin];
  const legs = route.slice(1).map((point, i) => ({ ...estimateLeg(route[i], point, input.transport), from: route[i], to: point }));
  if (legs.some(leg => !Number.isFinite(leg.minutes))) return null;
  const travel = legs.reduce((sum, leg) => sum + leg.minutes, 0);
  const activity = stops.reduce((sum, place) => sum + place.duration, 0);
  const buffer = Math.max(10, Math.ceil((travel + activity) * 0.2));
  const total = travel + activity + buffer;
  return { id: stops.map(p => p.id).join('~'), stops, route, legs, travel, activity, buffer, total,
    fits: total <= input.duration, remaining: input.duration - total,
    distance: legs.reduce((sum, leg) => sum + leg.km, 0), input: { ...input },
    title: stops[0].title, xp: 20 + stops.length * 10 + (input.mood === 'spark' ? 10 : 0) };
}
export function planAdventures(input, places, starts, random = Math.random) {
  if (!input || !Object.hasOwn(starts, input.start) || !profiles[input.transport] || !moodNames[input.mood]
    || !['single', 'round', 'chaos'].includes(input.mode) || !['any', 'nature', 'culture', 'hidden'].includes(input.interest ?? 'any')
    || !Number.isFinite(input.duration) || input.duration <= 0 || input.duration > 720) {
    return { status: 'invalid-input', adventures: [] };
  }
  const origin = starts[input.start];
  if (!Array.isArray(places) || !validCoordinates(origin)) return { status: 'missing-data', adventures: [] };
  const regional = places.filter(p => p?.region === origin.region);
  const valid = regional.filter(validPlace);
  const incomplete = regional.length - valid.length;
  const candidates = valid.filter(p => p.modes.includes(input.transport) && distanceKm(p, origin) > 0.02);
  if (!candidates.length) return { status: 'missing-data', adventures: [], incomplete };
  const plans = [];
  for (const p of candidates) {
    if (input.mode === 'round') {
      for (const q of candidates) if (q.id !== p.id) plans.push(buildAdventure([p, q], input, origin));
    } else plans.push(buildAdventure([p], input, origin));
  }
  const all = plans.filter(Boolean);
  if (!all.length) return { status: 'missing-data', adventures: [], incomplete };
  const fitting = all.filter(p => p.fits).map(p => ({ ...p,
    score: (input.mode === 'chaos' ? 0 : p.stops.reduce((s, stop) => s + (stop.moods.includes(input.mood) ? 20 : 0) + (stop.tags?.includes(input.interest) ? 30 : 0), 0)) + random() * 10,
  })).sort((a, b) => b.score - a.score);
  // Reversed two-stop circuits are the same alternative, not two new ideas.
  const seen = new Set();
  const unique = fitting.filter(p => { const key = p.stops.map(s => s.id).sort().join('~'); if (seen.has(key)) return false; seen.add(key); return true; });
  return { status: unique.length ? 'ok' : 'no-match', adventures: unique.slice(0, 3), incomplete,
    minimum: Math.min(...all.map(p => p.total)) };
}
export function safeExternalUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}
const coord = p => `${p.lat},${p.lng}`;
export function placeUrl(p) {
  if (!validCoordinates(p)) return null;
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query: coord(p) })}`;
}
export function directionsUrl(route, transport) {
  const travelmode = { walk: 'walking', bike: 'bicycling', car: 'driving', ev: 'driving', transit: 'transit' }[transport];
  if (!travelmode || !Array.isArray(route) || route.length < 2 || route.length > 5 || !route.every(validCoordinates)) return null;
  // Transit is deliberately opened one leg at a time, with a link for every leg in the UI.
  if (transport === 'transit' && route.length > 2) return null;
  const params = new URLSearchParams({ api: '1', origin: coord(route[0]), destination: coord(route.at(-1)), travelmode });
  if (route.length > 2) params.set('waypoints', route.slice(1, -1).map(coord).join('|'));
  return `https://www.google.com/maps/dir/?${params}`;
}
export function planText(plan) {
  const lines = ['Random Adventure · ' + plan.title, `Indulás és visszaérkezés: ${plan.route[0].name}`,
    `${transportNames[plan.input.transport]} · ${plan.total} perc becsült teljes idő / ${plan.input.duration} perc keret`,
    `${plan.travel} perc út + ${plan.activity} perc program + ${plan.buffer} perc tartalék`, ''];
  plan.stops.forEach((p, i) => { lines.push(`${i + 1}. ${p.name} · ${p.duration} perc`, p.action, placeUrl(p)); });
  if (plan.extra) lines.push('', `Választott extra csavar: ${plan.extra}`, 'A helyszíni program idején belül, külön kitérő nélkül.');
  if (plan.input.transport === 'ev') lines.push('', 'EV: autós útbecslés. Töltőhely, foglaltság és hatótáv nincs ellenőrizve; töltési idő nincs a tervben.');
  lines.push('', 'Odaút, megállók közötti út és visszaút:');
  plan.legs.forEach(leg => lines.push(`${leg.from.name} → ${leg.to.name}: kb. ${leg.minutes} perc`, directionsUrl([leg.from, leg.to], plan.input.transport)));
  lines.push('', 'Tájékoztató becslés, nem élő útvonalterv. Indulás előtt ellenőrizd az útvonalat, időjárást és hozzáférést. A térképlinkek nyilvános mintapontokat tartalmaznak.');
  return lines.join('\n');
}
