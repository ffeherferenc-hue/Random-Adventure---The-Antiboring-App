// Local demonstration only: no bank, card, payment or merchant connection.
const finite = n => typeof n === 'number' && Number.isFinite(n);
const id = s => typeof s === 'string' && s.trim().length > 0;
export function validOffer(o) {
  return o && id(o.id) && id(o.placeId) && id(o.title) && id(o.reason)
    && Number.isSafeInteger(o.capacity) && o.capacity >= 0
    && finite(o.startsAt) && finite(o.endsAt) && o.endsAt > o.startsAt
    && finite(o.visitMinutes) && o.visitMinutes > 0
    && Number.isSafeInteger(o.priceHuf) && o.priceHuf > 0
    && finite(o.discountRate) && o.discountRate >= 0 && o.discountRate <= 1
    && finite(o.pointMultiplier) && o.pointMultiplier >= 0
    && finite(o.commissionRate) && o.commissionRate >= 0 && o.commissionRate <= 1;
}
export const discountedPrice = o => Math.round(o.priceHuf * (1 - o.discountRate));
export class TransactionLedger {
  #offers; #records = new Map(); #balances = new Map(); #now;
  constructor(offers = [], now = Date.now) {
    this.#offers = new Map(offers.map(o => [o.id, structuredClone(o)])); this.#now = now;
  }
  getOffers() { return [...this.#offers.values()].map(o => structuredClone(o)); }
  balance(userId) { return this.#balances.get(userId) ?? 0; }
  records() { return [...this.#records.values()].map(r => structuredClone(r)); }
  updateCapacity(offerId, capacity) {
    const o = this.#offers.get(offerId);
    if (!o || !Number.isSafeInteger(capacity) || capacity < 0) return false;
    o.capacity = capacity; return true;
  }
  verify(payload = {}) {
    const { purchaseId, userId, placeId, offerId, amountHuf } = payload ?? {};
    const fail = status => ({ success: false, status });
    if (![purchaseId, userId, placeId, offerId].every(id)) return fail('invalid-payload');
    if (this.#records.has(purchaseId)) return fail('duplicate-transaction');
    if (!Number.isSafeInteger(amountHuf) || amountHuf <= 0) return fail('invalid-amount');
    const o = this.#offers.get(offerId);
    if (!validOffer(o)) return fail('invalid-offer');
    if (o.placeId !== placeId) return fail('offer-mismatch');
    if (o.capacity <= 0) return fail('sold-out');
    const now = this.#now();
    if (!finite(now) || now < o.startsAt || now > o.endsAt) return fail('offer-unavailable');
    const earnedPoints = Math.floor(amountHuf * o.pointMultiplier);
    const commissionHuf = Math.round(amountHuf * o.commissionRate);
    const balance = this.balance(userId) + earnedPoints;
    if (!Number.isSafeInteger(earnedPoints) || !Number.isSafeInteger(commissionHuf) || !Number.isSafeInteger(balance)) return fail('invalid-calculation');
    const record = { purchaseId, userId, placeId, offerId, amountHuf, earnedPoints, commissionHuf, status: 'verified', timestamp: now, demo: true };
    this.#records.set(purchaseId, record); this.#balances.set(userId, balance); o.capacity--;
    return { success: true, record: structuredClone(record), balance };
  }
  revoke(purchaseId) {
    const r = this.#records.get(purchaseId);
    if (!r || r.status !== 'verified') return { success: false, status: 'not-revocable' };
    r.status = 'revoked'; this.#balances.set(r.userId, this.balance(r.userId) - r.earnedPoints);
    // Cancellation restores the consumed unit in this demonstration.
    this.#offers.get(r.offerId).capacity++;
    return { success: true, balance: this.balance(r.userId), reversedCommissionHuf: r.commissionHuf };
  }
}
