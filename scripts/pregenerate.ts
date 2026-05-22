#!/usr/bin/env tsx
/**
 * pregenerate.ts — orchestrator for Skulkomaten pre-generation scripts.
 *
 * Usage:
 *   npm run pregenerate -- places      # fetch + enrich places only
 *   npm run pregenerate -- activities  # generate activities only
 *   npm run pregenerate -- templates   # generate templates only
 *   npm run pregenerate -- all         # run all three in order
 *
 * Requires ANTHROPIC_API_KEY in .env or environment.
 */

import { config } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env from project root
config({ path: path.join(__dirname, '../.env') })

async function main() {
  const subcommand = process.argv[2]

  if (!subcommand || !['places', 'activities', 'templates', 'all'].includes(subcommand)) {
    console.error(
      'Usage: npm run pregenerate -- <places|activities|templates|all>\n' +
        '\n' +
        '  places      Download SSR from Kartverket and enrich with i/på prepositions\n' +
        '  activities  Generate activities with prepositions via LLM\n' +
        '  templates   Generate tone-organised template frames via LLM\n' +
        '  all         Run all three steps in order\n',
    )
    process.exit(1)
  }

  if (!process.env.ANTHROPIC_API_KEY && subcommand !== 'places') {
    console.error(
      'Error: ANTHROPIC_API_KEY is not set.\n' +
        'Copy .env.example to .env and add your API key.\n',
    )
    process.exit(1)
  }

  const { fetchPlaces } = await import('./fetchPlaces.js')
  const { enrichPrepositions } = await import('./enrichPrepositions.js')
  const { genActivities } = await import('./genActivities.js')
  const { genTemplates } = await import('./genTemplates.js')

  if (subcommand === 'places' || subcommand === 'all') {
    console.log('\n--- Step 1: Fetch place names from Kartverket SSR ---')
    const names = await fetchPlaces()

    console.log('\n--- Step 2: Enrich place names with i/på prepositions ---')
    await enrichPrepositions(names)
  }

  if (subcommand === 'activities' || subcommand === 'all') {
    console.log('\n--- Step 3: Generate activities ---')
    await genActivities()
  }

  if (subcommand === 'templates' || subcommand === 'all') {
    console.log('\n--- Step 4: Generate template frames ---')
    await genTemplates()
  }

  console.log('\nDone!')
}

main().catch((err) => {
  console.error('Pre-generation failed:', err)
  process.exit(1)
})
