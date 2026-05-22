# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Skulkomaten (*skulke* "to skip/play truant" + *automat*) is a Norwegian-language web app
that generates random excuses for skipping events, styled as a slot machine. Two reels
(activity + place) spin and land on values that get inserted into a tone-organised template
to form a full Norwegian sentence. The full design rationale lives in `docs/PLAN.md`.

## Commands

```bash
npm run dev          # Vite dev server (HMR) at http://localhost:5173
npm run build        # tsc typecheck + vite production build
npm run preview      # serve the production build
npm run test         # vitest run (one-shot, not watch)

# Run a single test file or filter by name
npx vitest run src/lib/buildExcuse.test.ts
npx vitest run -t "capitalises a preposition that starts a sentence"

# Regenerate committed data files (offline, needs ANTHROPIC_API_KEY in .env)
npm run pregenerate -- places       # fetch Kartverket SSR + enrich with i/på
npm run pregenerate -- activities   # LLM-generate activities + prepositions
npm run pregenerate -- templates    # LLM-generate tone frames
npm run pregenerate -- all          # all of the above, in order
```

`pregenerate -- places` is the only subcommand that runs without an API key (the LLM
enrichment step still needs one). Copy `.env.example` to `.env` to set the key.

## Architecture

Two independent halves connected only by three JSON files in `src/data/`:

1. **Pre-generation pipeline** (`scripts/`, run offline via `tsx`, uses `@anthropic-ai/sdk`
   with model `claude-haiku-4-5-20251001` and prompt caching). `pregenerate.ts` orchestrates
   `fetchPlaces` → `enrichPrepositions` → `genActivities` → `genTemplates`, validates output
   against zod schemas in `scripts/schemas.ts`, and writes `activities.json`, `places.json`,
   `templates.json`. These JSON outputs are **committed**; the raw SSR download is gitignored.
2. **Static frontend** (`src/`, React + Vite + TS + Tailwind + Framer Motion). It imports the
   three JSON files at build time and runs entirely client-side — **no runtime API calls, no
   env vars in the client**. This is a hard constraint; do not add network fetches to the app.

### The grammaticality invariant (most important thing to understand)

Prepositions live in the **data**, not the templates. Each activity carries its own prep
(`på`/`til`/`i`) and each place its own (`i`/`på`). `src/lib/buildExcuse.ts` expands
`{aktivitet}` → `"<prep> <tekst>"` and `{sted}` → `"<prep> <navn>"`, then substitutes into
the frame. This is what makes **every** template × activity × place combination grammatical.

Consequences when editing:
- Template frames must read correctly with a prepositional phrase dropped into both token
  slots — e.g. a frame ending `"skal på {aktivitet}"` would produce "skal på på surfekurs".
  Never put a preposition immediately before a token; let the token's own prep supply it.
- `buildExcuse` capitalises the first letter of the string **and after every `. ! ?`**, so a
  prep that starts a sentence mid-frame (`"Nope. {aktivitet}…"` → "Nope. På…") is uppercased.
- Activity `tekst` is stored **lowercase** (for mid-sentence use); reels capitalise for
  display. Place `navn` is stored capitalised.
- The preposition rendered between the two reels in the UI is the **place** prep (the word
  grammatically linking activity → place), shown only once an excuse has been assembled.

### Reel animation flow

`src/lib/useSpin.ts` (one instance per reel) picks a random target index and tracks
`idle | spinning | settled`. `Reel.tsx` runs the actual Framer Motion animation: a single
keyframed `y` tween that scrolls fast at a constant rate then decelerates onto the target
(slot-machine coast), parameterised by `durationMs`. `SlotMachine.tsx` owns both reels,
staggers their stop times (place reel finishes last), and assembles the excuse via
`buildExcuse` once both reels report settled.

### Type definitions are duplicated by design

`src/types.ts` (frontend) and `scripts/schemas.ts` (zod, pre-generation) define the same
shapes — `Activity`, `Place`, `Templates`, and the `Tone` enum (`høflig | frekk | dramatisk`).
Keep them in sync when adding a tone or changing a preposition set. The zod
`TemplatesSchema` enforces that every frame contains both `{aktivitet}` and `{sted}` tokens.

## Language correctness

This is a Norwegian (Bokmål) app where the humour depends on grammatical output. When adding
or editing activities, places, or templates, the i/på/til prepositions and tone consistency
matter and are non-obvious (e.g. "på Voss" but "i Lom"). Treat data changes as linguistic
work, not just JSON edits.
