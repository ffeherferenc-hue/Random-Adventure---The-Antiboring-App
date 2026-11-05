# Random Adventure

> Any free time can become an adventure.

**Public MVP · September 2026**

[Open the Hungarian adventure planner](https://ffeherferenc-hue.github.io/Random-Adventure---The-Antiboring-App/) · [Original English concept demo](https://ffeherferenc-hue.github.io/Random-Adventure---The-Antiboring-App/classic/)

Choose time, mood and transport. Get a small outdoor mission, choose an alternative and open its route in Google Maps. No account is needed.

## The updated planner

- A responsive green interface, Hungarian copy, system/light/dark appearance and **Alt + Shift + V** to switch light/dark. Only the appearance preference persists on the device; partner demonstration state is held in page memory.
- Five sourced public outdoor destinations in Győr and Budapest. Coordinate references are area points, not surveyed entrances. Sources and access limitations are shown in the app.
- Single-destination trips, two-stop circuits and a surprise mode. Every outward, inter-stop and return leg, every activity and a separate buffer count toward the total. Only plans within the estimated time budget are offered.
- Walking, cycling, public transport, driving and EV. EV uses a driving estimate; charger suitability, availability, range and charging time are not provided.
- Optional nature, culture and detail-discovery preferences influence ranking. Surprise mode ignores those ranking preferences.
- Optional observation, quiet or companion tasks fit within the already allocated on-site time. Accepted tasks appear in the copied itinerary and printed mission.
- Google Maps URLs open actual public coordinates without an API key. The complete circuit and individual legs are available. Public transport opens one leg at a time. Waypoint handling varies by Google product.
- A clearly labelled fictional partner demonstration provides optional route changes, sample capacity and a separate simulated purchase/points/commission flow; see the expansion section below. It provides no live inventory, booking or transaction.

Balatonfüred and Pannonhalma currently show an explicit missing-data state. The five outdoor activities do not require a programme ticket; transport and parking costs are separate. There is no fabricated venue fallback.

## Existing product concepts are preserved

The previous English application remains at **`classic/`**, retaining its 15 illustrative missions, location-independent and social quests, budget and interest controls, four adventure modes, optional twist, and EV/partner concepts. Its illustrative data must not be treated as verified destinations or live navigation. It is linked from the new planner and has a link back.

This update does not represent the whole expanded Random Adventure product roadmap. Food experiences, reservations, charging services and commercial integrations still need real data and implementation.

## Timing and integration boundary

Travel estimates use public coordinates, straight-line distance with a detour factor, assumed speed and per-leg overhead:

| Transport | Speed | Detour factor | Overhead per leg |
| --- | ---: | ---: | ---: |
| Walk | 4 km/h | 1.6 | 2 min |
| Bike | 10 km/h | 1.7 | 5 min |
| Transit | 15 km/h | 1.8 | 15 min |
| Car / EV | 20 km/h | 1.8 | 15 min |

The buffer is 20% of travel plus activities, with a minimum of 10 minutes. These are editorial planning assumptions, not measured arrival times. Opening hours, closures, accessibility, terrain, timetables, traffic and parking are not checked live. The all-day choice is a maximum time budget, not a promise to fill an entire day.

The inline map is a coordinate sketch with straight connections. Google Maps opens externally after a click. This is not an embedded Maps API or live routing integration. No paid Google API is used. No location permission, analytics, external AI, account or payment is required.

## Development and verification

Requires Node.js with ES modules and the built-in test runner; no external package dependencies.

- `npm start` serves the app on `http://127.0.0.1:4285`.
- `npm test` runs planning, time-boundary, route/export, input-validation and EV/interest/optional-task checks.

The old English version already reported full trip time and overtime. The new planner adds explicit buffer time, complete two-stop accounting and strict fit filtering. Its timing changes should not be described as fixing a time-clamping bug in the previous public version.

## Use and licensing

No open-source licence is currently provided for this repository. Public visibility of the source does not by itself grant permission to reuse, modify or redistribute it.

## Partner demonstration expansion — 5 November 2026

The existing Hungarian planner and `classic/` experience are preserved. The Hungarian planner now demonstrates the commercial flow with **fictional offers** at the existing public sample coordinates:

1. Generate/select the original adventure.
2. Compare eligible partner alternatives showing total extra time, discounted HUF price, savings, capacity and estimated arrival.
3. Accept an alternative: the actual itinerary, map links, time breakdown and copied plan change. No points are earned by accepting a detour.
4. Trigger a separate labelled simulated purchase, using a purchase ID and integer HUF amount. Points and commission use the stored offer rates, capacity decreases, and repeated IDs are rejected.
5. Reverse a simulated purchase: its points and commission are reversed and its capacity unit is restored. The purchase ID remains used.

A manual sample-capacity control demonstrates partner signalling. A separate offer budget includes an explicit zero-HUF choice. Original stops remain in order; each possible insertion slot is checked and the least extra-time eligible option is shown. Existing stops are extended with offer activity time rather than duplicated. Both arrival and offer activity completion must fall inside the sample offer window. Capacity, budget, region, transport and total itinerary duration constrain suggestions. Commission does not influence their ordering.

### Data and integration limits

`data/offers.js` creates fictional four-hour offer windows relative to page load. No actual café, merchant, discount or agreement is represented. Purchase confirmation is a user-triggered test event, not evidence of a physical visit or bank transaction. There is no card issuance, credit, payment, reservation, bank-feed or merchant/POS integration.

`src/partners.js` stores offers, purchase records and points in page memory, with defensive copies on input/output. Reloading resets all demo state. Points have no specified cash value. Integer HUF commission rounding and restoring a capacity unit on cancellation are demonstration policies, not agreed commercial terms. A production integration needs authenticated merchant verification, durable atomic storage, authoritative inventory and wall-clock availability, currency rules and reconciliation.

### Verification

`npm test` runs the original 21 planning tests plus 8 partner tests (29 total). The original suite checks 438 offered itineraries across 288 input combinations. Additional tests cover third-stop insertion, preserving existing stops, total-time fit, offer completion window, zero budget, invalid capacities/rates/amounts, stored-rate calculation, defensive copies, duplicate IDs, sold-out capacity, reversal and reset. These tests do not establish exhaustive coverage or production readiness.

UI verification: `npm install` installs the optional development dependency; `npm run test:ui` runs the DOM integration check for startup, detour acceptance, unchanged points before purchase, purchase/duplicate/reversal, original-route restore, zero budget, round trips, alternatives, theme, optional task, copy and missing-data state. This is a DOM simulation, not a real-browser rendering or mobile-layout test. The local Chromium launch was blocked by the execution environment; visual/mobile and real browser verification remain outstanding. Runtime serving and the engine tests have no external dependencies. Development UI tests require Node 24.15+.
