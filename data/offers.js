// Fictional offers at public sample coordinates. No commercial relationship is claimed.
export function sampleOffers(now = Date.now()) {
  return [
    { id: 'demo-breakfast', placeId: 'becsi', title: 'Reggeli csomag · mintapartner', reason: 'Alacsony kihasználtság', capacity: 4, visitMinutes: 15, priceHuf: 2500, discountRate: .2, pointMultiplier: .1, commissionRate: .08 },
    { id: 'demo-stock', placeId: 'rado', title: 'Piknikcsomag · mintapartner', reason: 'Megmaradt készlet', capacity: 2, visitMinutes: 10, priceHuf: 3000, discountRate: .3, pointMultiplier: .15, commissionRate: .05 },
    { id: 'demo-budapest', placeId: 'vajdahunyad', title: 'Frissítő · mintapartner', reason: 'Szabad kapacitás', capacity: 3, visitMinutes: 10, priceHuf: 1500, discountRate: .1, pointMultiplier: .1, commissionRate: .06 },
  ].map(o => ({ ...o, startsAt: now, endsAt: now + 4 * 60 * 60000, demo: true }));
}
