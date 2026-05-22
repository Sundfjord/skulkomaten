# Skulkomaten — Implementation Plan

## Context

**Skulkomaten** (*skulke* "to skip / play truant" + *automat*) is a fun web app that
generates random textual excuses for skipping events. The UI behaves like a slot machine:
two reels "spin" — one for an **activity**, one for a **place** — and when they stop the
landed values are inserted into a pre-defined **excuse template** to form a full Norwegian
sentence (e.g. *"Jeg skal dessverre på surfekurs i Lom den dagen."*).

This is a greenfield project living at
`/Users/yngvesundfjord/Developer/private/Skulkomaten/`.
Node 25 / npm 11 / Python 3.13 are available locally.

### Decisions locked with the user
- **Two reels** (activity + place) whose landed values are **inserted into a template**.
- Templates are **organised by tone**; the user selects a tone, and within that tone a
  random frame is chosen per spin (many frames per tone → variety).
- **Each activity stores its own preposition** (`på`/`til`/`i`), like places do.
- **Place names come from Kartverket SSR** (open data), enriched with the correct
  preposition (`i`/`på`) via a one-time LLM pass.
- The shipped app is **fully static** — pre-generated JSON only, no runtime API calls,
  no API keys in the client. (A serverless "fresh excuse" endpoint is an explicit phase-2,
  out of scope here.)

## Architecture overview

Two pieces:
1. **Pre-generation scripts** (run once / occasionally, offline, Node + TypeScript +
   `@anthropic-ai/sdk`). They produce three committed JSON data files.
2. **Static frontend** (React + Vite + TypeScript + Tailwind + Framer Motion) that loads
   the JSON, runs the slot animation, and assembles the excuse client-side.

```
Skulkomaten/
├── docs/
│   └── PLAN.md             # this document
├── package.json            # scripts: dev, build, preview, pregenerate
├── vite.config.ts  tsconfig.json  tailwind.config.js  index.html
├── .env.example            # ANTHROPIC_API_KEY (scripts only)
├── src/
│   ├── main.tsx  App.tsx  index.css
│   ├── components/
│   │   ├── SlotMachine.tsx   # owns spin state, orchestrates two reels
│   │   ├── Reel.tsx          # one animated vertical strip
│   │   ├── ToneSelector.tsx  # tone chips (høflig / frekk / dramatisk / …)
│   │   └── ExcuseDisplay.tsx # final sentence + copy-to-clipboard
│   ├── lib/
│   │   ├── buildExcuse.ts    # pure: (activity, place, template) -> string
│   │   └── useSpin.ts        # random target selection + stop timing
│   ├── types.ts              # shared Activity / Place / Templates types
│   └── data/                 # generated, committed
│       ├── activities.json  places.json  templates.json
└── scripts/
    ├── pregenerate.ts        # orchestrator (CLI subcommands)
    ├── fetchPlaces.ts        # download + filter Kartverket SSR
    ├── enrichPrepositions.ts # LLM pass: place -> i/på
    ├── genActivities.ts      # LLM: activities + preposition
    └── genTemplates.ts       # LLM: tone-organised frames
```

## Data schemas (`src/data/`)

```jsonc
// activities.json — text stored lowercase (mid-sentence); capitalise for reel display
[ { "tekst": "surfekurs", "prep": "på" }, { "tekst": "yogaretreat", "prep": "på" } ]

// places.json
[ { "navn": "Lom", "prep": "i" }, { "navn": "Voss", "prep": "på" } ]

// templates.json — keyed by tone; tokens {aktivitet} and {sted}
{
  "høflig":     ["Tusen takk for invitasjonen, men jeg skal {aktivitet} {sted} den dagen."],
  "frekk":      ["Orker ikke. Skal {aktivitet} {sted}."],
  "dramatisk":  ["Skjebnen kaller — jeg MÅ {aktivitet} {sted}."]
}
```

`buildExcuse` expands `{aktivitet}` → `"<prep> <tekst>"` (`"på surfekurs"`) and
`{sted}` → `"<prep> <navn>"` (`"i Lom"`), then substitutes into the chosen frame.
Keeping prepositions in the data (not the template) is what makes every
template × activity × place combination grammatical.

## Pre-generation scripts (`scripts/`)

Single entry `pregenerate.ts` with subcommands (`places`, `activities`, `templates`,
`all`), run via `npm run pregenerate -- <cmd>`. Uses `@anthropic-ai/sdk` with
**`claude-haiku-4-5-20251001`** (cheap, fast, strong enough for Norwegian) and
**prompt caching** on the shared system prompt across chunked calls.

1. **`fetchPlaces.ts`** — download SSR from Kartverket/Geonorge
   (kartkatalog.geonorge.no → "Sentralt stedsnavnregister (SSR)", GeoJSON). Filter to
   settlement object types (`by`, `tettbebyggelse`, `bygd`, `grend`), dedupe by name,
   keep a recognisable subset (a few hundred), and union in a hand-picked list of
   famously-named places (Hell, Å, Brønnøysund, …) for comedic value. Emit raw names.
2. **`enrichPrepositions.ts`** — the genuinely hard Norwegian bit: assign `i` vs `på`
   per place via a chunked LLM pass (batches of ~50, JSON-out, cached system prompt with
   the i/på conventions + few-shot examples). Flag low-confidence ones for spot-check.
3. **`genActivities.ts`** — LLM-generate ~150 plausible-but-skippable activities, each as
   `{ tekst (lowercase), prep }`. Prompt steers toward courses/retreats/events that read
   funny.
4. **`genTemplates.ts`** — LLM-generate ~20–40 frames **per tone** (tones:
   `høflig`, `frekk`, `dramatisk`, plus any the user wants), each frame containing exactly
   the `{aktivitet}` and `{sted}` tokens. Validate token presence before writing.

All outputs validated against the schema (zod) and written to `src/data/`. The raw SSR
download is kept out of the committed tree (gitignored input artifact); the processed
JSON is committed so the app needs no network at build/run time.

## Frontend behaviour

- **App.tsx**: loads the three JSON files, holds selected tone (default `høflig`).
- **ToneSelector**: chips to switch tone; affects only which template pool is used.
- **SlotMachine** + two **Reel**s: on "Spinn", pick random target indices for activity and
  place; each reel animates a fast vertical cycle easing to its target, with the place reel
  stopping slightly after the activity reel (classic stagger). Framer Motion `animate` with
  a keyframed `y`, or a long CSS transform transition.
- On both reels settled → pick a random frame from the selected tone, run `buildExcuse`,
  reveal the sentence in **ExcuseDisplay** with a copy-to-clipboard button and "Spinn igjen".
- Mobile-first, Tailwind styling. No backend, no env vars in the client.

## Verification

- **Pre-gen**: `npm run pregenerate -- all` produces non-empty, schema-valid
  `activities.json`, `places.json`, `templates.json`; manually spot-check ~20 place
  prepositions and a sample of templates for grammaticality.
- **Unit**: a small test for `buildExcuse` (deterministic given fixed inputs) covering
  token substitution and preposition expansion.
- **End-to-end**: `npm run dev`, open localhost — select each tone, spin several times,
  confirm reels animate and stop, the assembled sentence is grammatical
  ("… på surfekurs i Lom …"), copy-to-clipboard works, and "Spinn igjen" reseeds.
- **Build**: `npm run build && npm run preview` serves with no network calls (verify in
  devtools Network tab) — proving the app is fully static.

## Out of scope (phase 2)
- Serverless `/fresh-excuse` endpoint calling Claude on demand.
- Sharing / deep-link to a specific excuse, history, favourites.
