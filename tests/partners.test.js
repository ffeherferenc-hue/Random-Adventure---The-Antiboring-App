import test from 'node:test';
import assert from 'node:assert/strict';
import { TransactionLedger } from '../src/partners.js';
import { planPartnerDetours, buildAdventure, directionsUrl } from '../src/engine.js';
import { sampleOffers } from '../data/offers.js';
import { places, startPoints } from '../data/places.js';
const now = 1000000, offers = sampleOffers(now);
const input = { start: 'gyor', duration: 180, transport: 'walk', mood: 'curious', mode: 'round' };
const base = buildAdventure(places.filter(p => p.region === 'gyor').slice(0, 2), input, startPoints.gyor);
const payload = { purchaseId: 'p1', userId: 'u', placeId: offers[0].placeId, offerId: offers[0].id, amountHuf: 2000 };
test('detours preserve existing stops, time budget, map and original plan', () => {
  const original = structuredClone(base);
  const result = planPartnerDetours(base, places, offers, now);
  assert.ok(result.length > 0);
  for (const a of result) {
    assert.ok(a.plan.total <= input.duration);
    assert.equal(new Set(a.plan.stops.map(p => p.id)).size, a.plan.stops.length);
    assert.ok(a.plan.activity > base.activity);
    assert.ok(directionsUrl(a.plan.route, 'walk'));
    assert.equal(a.plan.total - base.total, a.extraMinutes);
  }
  assert.deepEqual(base, original);
});
test('zero budget, exhausted capacity, invalid types and expired windows exclude offers', () => {
  assert.deepEqual(planPartnerDetours(base, places, offers, now, 0), []);
  for (const value of [0, -1, NaN, Infinity, true, '3', null]) {
    assert.deepEqual(planPartnerDetours(base, places, [{...offers[0],capacity:value}], now), []);
  }
  assert.deepEqual(planPartnerDetours(base, places, offers, now + 5*3600000), []);
  assert.deepEqual(planPartnerDetours(base, places, [{...offers[0], endsAt:now + 1}], now), []);
});
test('commission changes never alter detour selection or ordering', () => {
  const a = planPartnerDetours(base, places, offers, now);
  const b = planPartnerDetours(base, places, offers.map(o=>({...o, commissionRate:1})), now);
  assert.deepEqual(a.map(x=>[x.offer.id,x.plan.id]),b.map(x=>[x.offer.id,x.plan.id]));
});
test('a third location can be inserted into a two-stop itinerary', () => {
  const third = {...places[0], id:'third', lat:47.688, duration:5};
  const a = planPartnerDetours(base,[...places,third],[{...offers[0],placeId:'third'}],now);
  assert.equal(a[0].plan.stops.length,3);
});
test('stored rates override caller values; copies cannot change internal offers or records', () => {
  const ledger = new TransactionLedger(offers,()=>now);
  ledger.getOffers()[0].pointMultiplier=999;
  const r=ledger.verify({...payload, pointMultiplier:999, commissionRate:1});
  assert.equal(r.record.earnedPoints,200);assert.equal(r.record.commissionHuf,160);
  r.record.earnedPoints=999;
  assert.equal(ledger.records()[0].earnedPoints,200);
});
test('purchase IDs are idempotent, capacity is consumed and cancellation restores points and commission', () => {
  const ledger = new TransactionLedger([{...offers[0],capacity:1}],()=>now);
  assert.equal(ledger.verify(payload).success,true);
  assert.equal(ledger.verify(payload).status,'duplicate-transaction');
  assert.equal(ledger.verify({...payload,purchaseId:'p2'}).status,'sold-out');
  assert.equal(ledger.balance('u'),200);
  assert.equal(ledger.revoke('p1').reversedCommissionHuf,160);
  assert.equal(ledger.balance('u'),0);assert.equal(ledger.getOffers()[0].capacity,1);
  assert.equal(ledger.revoke('p1').success,false);
  assert.equal(ledger.verify(payload).status,'duplicate-transaction');
});
test('purchase rejects empty store, wrong location, invalid amounts, rates and expired offers', () => {
  assert.equal(new TransactionLedger().verify(payload).success,false);
  const ledger=new TransactionLedger(offers,()=>now);
  assert.equal(ledger.verify({...payload,placeId:'wrong'}).status,'offer-mismatch');
  for(const amountHuf of [0,-1,Infinity,NaN,true,'2000',1.5]) assert.equal(ledger.verify({...payload,amountHuf}).status,'invalid-amount');
  for(const change of [{commissionRate:-1},{commissionRate:2},{pointMultiplier:-1},{pointMultiplier:Infinity},{capacity:true}])
    assert.equal(new TransactionLedger([{...offers[0],...change}],()=>now).verify(payload).status,'invalid-offer');
  assert.equal(new TransactionLedger(offers,()=>now+5*3600000).verify(payload).status,'offer-unavailable');
});
test('new demo ledger resets all points and records', () => {
  const a=new TransactionLedger(offers,()=>now);a.verify(payload);
  const b=new TransactionLedger(offers,()=>now);assert.equal(b.balance('u'),0);assert.deepEqual(b.records(),[]);
});
