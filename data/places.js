// Local curated sample. Coordinates are public destination points, not surveyed entrances.
// Durations and activities are our editorial estimates. No live opening/charging data.
const gyorSource = 'https://hellogyor.hu/latnivalok/top10';
export const startPoints = {
  gyor: { id: 'gyor-start', name: 'Győr · Széchenyi tér', region: 'gyor', lat: 47.6883306, lng: 17.6344389,
    source: 'https://www.wikidata.org/wiki/Q1301916' },
  budapest: { id: 'budapest-start', name: 'Budapest · Hősök tere', region: 'budapest', lat: 47.515, lng: 19.07778,
    source: 'https://en.wikipedia.org/wiki/Heroes%27_Square_%28Budapest%29' },
  balaton: { id: 'balaton-start', name: 'Balatonfüred', region: 'balaton', lat: null, lng: null },
  pannonhalma: { id: 'pannonhalma-start', name: 'Pannonhalma', region: 'pannonhalma', lat: null, lng: null },
};
const common = { modes: ['walk', 'bike', 'transit', 'car', 'ev'], verified: true, verifiedOn: '2026-09-13',
  access: 'Szabadtéri program. A hozzáférés, lezárások és az időjárás nincsenek élőben ellenőrizve.' };
export const places = [
  { ...common, id: 'rado', region: 'gyor', name: 'Radó-sziget', title: 'Kapcsolj folyóparti üzemmódba.',
    lat: 47.68709, lng: 17.62901, duration: 20, category: 'Vízpart & feltöltődés', moods: ['calm', 'curious'], tags: ['nature'],
    action: 'Sétálj a fák alatt. Keress három különböző tükröződést a vízen, majd válassz egy padot öt perc csendhez.',
    source: gyorSource, coordinateSource: 'https://mapcarta.com/W104379319',
    coordinateNote: 'A sziget térképi referenciapontja; nem bejárat.', art: 'river' },
  { ...common, id: 'dunakapu', region: 'gyor', name: 'Dunakapu tér', title: 'Nézd más szemmel a várost.',
    lat: 47.69, lng: 17.6336111, duration: 6, category: 'Városi felfedezés', moods: ['curious', 'spark'], tags: ['culture'],
    action: 'Keress egy régi és egy mai részletet a téren. Állj meg úgy, hogy mindkettőt lásd, és találj ki egy címet a képnek.',
    source: 'https://hellogyor.hu/latnivalok/terek-parkok/27-dunakapu-ter', coordinateSource: 'https://wikimapia.org/14072626/hu/Dunakapu-t%C3%A9r',
    coordinateNote: 'A tér hozzávetőleges középpontja.', art: 'city' },
  { ...common, id: 'becsi', region: 'gyor', name: 'Bécsi kapu tér', title: 'Találj egy történetet a kövekben.',
    lat: 47.6875, lng: 17.6311111, duration: 15, category: 'Apró részletek', moods: ['curious', 'calm'], tags: ['culture', 'hidden'],
    action: 'Nézz fel a homlokzatokra. Válassz három apró díszt, amely mellett máskor elmennél. Melyiket vinnéd haza egy rajzon?',
    source: 'https://hellogyor.hu/helyszinek/310-becsi-kapu-ter',
    coordinateSource: 'https://www.panadea.com/hu/utazasi-kalauz-utikonyv/europa/magyarorszag/nyugat-magyarorszag/kisalfold/gyor/panorama-foto-panoramakep/pano-20050',
    coordinateNote: 'Nyilvános panorámafelvétel pontja a téren.', art: 'city' },
  { ...common, id: 'vajdahunyad', region: 'budapest', name: 'Vajdahunyad vára · kívülről', title: 'Lépj át egy másik történetbe.',
    lat: 47.5152778, lng: 19.0819444, duration: 25, category: 'Építészet & felfedezés', moods: ['curious', 'spark'], tags: ['culture', 'hidden'],
    action: 'Nézd meg kívülről a várat. Keress egy tornyot, egy ívet és egy szokatlan részletet. Találj ki belőlük egy hárommondatos történetet.',
    source: 'https://www.budapestinfo.hu/storage/files/GBm6FrGupWdIt02ktNeA30WVJalrL3tVD5oUN7nV.pdf', coordinateSource: 'https://www.wikidata.org/wiki/Q1092030',
    coordinateNote: 'A vár térképi referenciapontja. A küldetéshez nem kell múzeumbelépő.', art: 'city' },
  { ...common, id: 'szechenyi', region: 'budapest', name: 'Széchenyi fürdő · külső homlokzat', title: 'Gyűjts színeket a Ligetben.',
    lat: 47.518317, lng: 19.080978, duration: 20, category: 'Lassú városi kitérő', moods: ['calm', 'curious'], tags: ['nature', 'culture'],
    action: 'A fürdő előtt keress három árnyalatot az épületen és a környező fákon. Készíts róluk egy képet, vagy csak jegyezd meg a kedvencedet.',
    source: 'https://www.budapestinfo.hu/storage/files/GBm6FrGupWdIt02ktNeA30WVJalrL3tVD5oUN7nV.pdf',
    coordinateSource: 'https://commons.wikimedia.org/wiki/File:Sz%C3%A9chenyi_thermal_bath,_Budapest.jpg',
    coordinateNote: 'A külső homlokzat nyilvános fotózási pontja. Fürdőzés nincs a programban.', art: 'river' },
];
