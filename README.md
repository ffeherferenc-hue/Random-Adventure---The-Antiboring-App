# Random Adventure

> Any free time can become an adventure.

**Public MVP · September 2026**

[Open the Hungarian adventure planner](https://ffeherferenc-hue.github.io/Random-Adventure---The-Antiboring-App/) · [Original English concept demo](https://ffeherferenc-hue.github.io/Random-Adventure---The-Antiboring-App/classic/)

Choose time, mood and transport. Get a small outdoor mission, choose an alternative and open its route in Google Maps. No account is needed.

## The updated planner

- A responsive green interface, Hungarian copy, system/light/dark appearance and **Alt + Shift + V** to switch light/dark. Only the appearance preference is stored on the device.
- Five sourced public outdoor destinations in Győr and Budapest. Coordinate references are area points, not surveyed entrances. Sources and access limitations are shown in the app.
- Single-destination trips, two-stop circuits and a surprise mode. Every outward, inter-stop and return leg, every activity and a separate buffer count toward the total. Only plans within the estimated time budget are offered.
- Walking, cycling, public transport, driving and EV. EV uses a driving estimate; charger suitability, availability, range and charging time are not provided.
- Optional nature, culture and detail-discovery preferences influence ranking. Surprise mode ignores those ranking preferences.
- Optional observation, quiet or companion tasks fit within the already allocated on-site time. Accepted tasks appear in the copied itinerary and printed mission.
- Google Maps URLs open actual public coordinates without an API key. The complete circuit and individual legs are available. Public transport opens one leg at a time. Waypoint handling varies by Google product.
- A clearly labelled partner concept remains available after the mission. It provides no live inventory, booking or transaction.

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
