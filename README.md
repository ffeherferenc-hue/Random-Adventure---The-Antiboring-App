# Random Adventure

> Any free time can become an adventure.

Random Adventure is an anti-boredom quest generator. It turns a small amount of context into a short, actionable adventure that can be started immediately.

**Current status: Public MVP v0.1**

[Open the live MVP](https://ffeherferenc-hue.github.io/Random-Adventure---The-Antiboring-App/)

## The MVP promise

A user chooses three things:

- available time;
- current mood;
- preferred way to move.

Random Adventure then produces a mission that fits the selected context, offers two alternatives, and gives the user enough information to start without opening another service.

The MVP is complete when this single flow works reliably:

`choose → generate → select → start`

## What the public MVP includes

- a no-account, single-page experience;
- deterministic mission generation from illustrative local data;
- three immediately actionable mission options;
- time, distance, transport and cost estimates;
- a compact mission, an optional extra twist and an illustrative route shape;
- clear disclosure that destinations, availability and travel estimates are sample data.

## What is deliberately outside the MVP

The public MVP does not provide live location, turn-by-turn navigation, real-time availability, calendar access, bookings, payments, partner inventory or external AI generation.

EV and partner references demonstrate how later data and commercial layers could fit the experience. They are not live integrations and do not affect the current MVP claim.

Future possibilities belong to the roadmap. They are not requirements for calling the present product an MVP.

## Acceptance checks

The public MVP must:

1. respond to the selected time, mood and transport inputs;
2. generate an actionable mission without an account or external API;
3. keep the proposed mission within the selected time window;
4. allow one of the alternatives to replace the primary mission;
5. identify illustrative estimates and non-live data clearly;
6. complete the core flow without browser errors.

## Verification snapshot

Verified on 8 September 2026 against the public GitHub Pages deployment:

- the default flow generated a mission successfully;
- a 30-minute, thrill, bicycle scenario produced a 25-minute mission;
- changing to a second alternative replaced the primary mission;
- advanced location, budget, mood and transport controls affected the generated output;
- no browser warnings or errors appeared during the tested flows;
- responsive layout rules are present for tablet and mobile breakpoints.

## Data and implementation boundary

The current version uses curated sample data and deterministic browser-side logic. It is a product-validation build: it tests whether constrained spontaneity can become an executable adventure.

It does not claim live guidance, verified availability or automated transactions.

## Use and licensing

No open-source licence is currently provided for this repository. Public visibility of the source does not by itself grant permission to reuse, modify or redistribute it.
