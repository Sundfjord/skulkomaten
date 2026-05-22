/**
 * fetchPlaces.ts
 *
 * Downloads the Kartverket Sentralt Stedsnavnregister (SSR) GeoJSON and
 * extracts a filtered list of settlement place names to be passed to
 * enrichPrepositions.ts for LLM preposition assignment.
 *
 * Output: scripts/places-raw.json (gitignored)
 *
 * Run via: npm run pregenerate -- places
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Kartverket SSR WFS endpoint (GeoJSON, settlement types only) */
const SSR_URL =
  'https://ws.geonorge.no/SKWS3Index/v2/ssr/sok?navn=*&navneobjekttype=by,tettbebyggelse,bygd,grend&epsgKode=4326&antPerSide=5000&side=0&format=json'

/** Hand-picked comedic/famous places to always include */
const HAND_PICKED = [
  'Hell',
  'Å',
  'Brønnøysund',
  'Ås',
  'Os',
  'Mo i Rana',
  'Flåm',
  'Geilo',
  'Finse',
  'Røros',
]

interface SSRFeature {
  properties?: {
    stedsnavn?: string
    navneobjekttype?: string
  }
}

interface SSRResponse {
  navn?: SSRFeature[]
}

export async function fetchPlaces(): Promise<string[]> {
  console.log('Fetching SSR from Kartverket…')

  let names: string[] = []

  try {
    const res = await fetch(SSR_URL)
    if (!res.ok) throw new Error(`SSR fetch failed: ${res.status} ${res.statusText}`)

    const data = (await res.json()) as SSRResponse
    const features = data.navn ?? []

    const settlementTypes = new Set(['by', 'tettbebyggelse', 'bygd', 'grend'])

    names = features
      .filter(
        (f) =>
          f.properties?.navneobjekttype &&
          settlementTypes.has(f.properties.navneobjekttype.toLowerCase()),
      )
      .map((f) => f.properties?.stedsnavn ?? '')
      .filter(Boolean)

    console.log(`  SSR returned ${names.length} settlement names`)
  } catch (err) {
    console.warn('  SSR fetch failed, proceeding with hand-picked list only:', err)
  }

  // Merge hand-picked (dedupe case-insensitively)
  const normalised = new Set(names.map((n) => n.toLowerCase()))
  for (const hp of HAND_PICKED) {
    if (!normalised.has(hp.toLowerCase())) {
      names.push(hp)
    }
  }

  // Dedupe by name (keep first occurrence)
  const seen = new Set<string>()
  const deduped = names.filter((n) => {
    const key = n.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`  Total after merge + dedupe: ${deduped.length} names`)

  const outPath = path.join(__dirname, 'places-raw.json')
  await fs.writeFile(outPath, JSON.stringify(deduped, null, 2), 'utf-8')
  console.log(`  Written to ${outPath}`)

  return deduped
}
