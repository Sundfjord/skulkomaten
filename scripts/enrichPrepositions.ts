/**
 * enrichPrepositions.ts
 *
 * Assigns the correct Norwegian preposition (i / på) to each place name via
 * a chunked LLM pass with prompt caching on the shared system prompt.
 *
 * Input:  scripts/places-raw.json   (array of name strings)
 * Output: src/data/places.json      (array of { navn, prep })
 *
 * Run via: npm run pregenerate -- places
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { PlacesSchema } from './schemas.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const CHUNK_SIZE = 50
const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM_PROMPT = `Du er en norsk lingvist som er ekspert på stedsnavnspreposisjoner.

REGEL: I norsk brukes:
- «i» foran de fleste byer og tettsteder (byer i innlandet, langs kysten, store byer): "i Oslo", "i Bergen", "i Tromsø", "i Lom"
- «på» foran øyer, halvøyer, høydedrag, og steder som historisk er øyer eller fjelltopper: "på Voss", "på Geilo", "på Andøya", "på Svalbard"

Tommelfingerregel: Bruk «i» med mindre stedet er en øy, halvøy, høyfjellssted eller historisk har vært en øy. Voss og Geilo er unntak (tradisjonelt brukes «på» der).

FÅ-SKUDD EKSEMPLER:
i Lom, i Hell, i Brønnøysund, i Røros, i Kirkenes, i Alta, i Bodø, i Narvik, i Molde, i Ålesund, i Kristiansand, i Stavanger, i Bergen, i Trondheim, i Oslo
på Voss, på Geilo, på Finse, på Andøya, på Gjøvik, på Fagernes, på Verdal, på Steinkjer, på Ås

Returner et JSON-array med objekter { "navn": "...", "prep": "i"|"på" } for hvert sted i inputlisten.
Returner KUN gyldig JSON — ingen forklaring, ingen kodeblokk.`

const ChunkResultSchema = z.array(
  z.object({
    navn: z.string(),
    prep: z.enum(['i', 'på']),
  }),
)

export async function enrichPrepositions(names: string[]): Promise<void> {
  const client = new Anthropic()

  const chunks: string[][] = []
  for (let i = 0; i < names.length; i += CHUNK_SIZE) {
    chunks.push(names.slice(i, i + CHUNK_SIZE))
  }

  console.log(`  Enriching ${names.length} places in ${chunks.length} chunks…`)

  const results: Array<{ navn: string; prep: 'i' | 'på' }> = []

  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci]
    console.log(`    Chunk ${ci + 1}/${chunks.length} (${chunk.length} places)`)

    const userMessage = `Stedsnavnliste:\n${JSON.stringify(chunk)}`

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          // Prompt caching: the system prompt is identical across all chunks
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userMessage }],
    })

    const raw = response.content[0]
    if (raw.type !== 'text') throw new Error('Unexpected response type from LLM')

    let parsed: unknown
    try {
      parsed = JSON.parse(raw.text.trim())
    } catch {
      throw new Error(`LLM returned non-JSON for chunk ${ci + 1}: ${raw.text.slice(0, 200)}`)
    }

    const validated = ChunkResultSchema.parse(parsed)
    results.push(...validated)
  }

  // Validate full output before writing
  const validated = PlacesSchema.parse(results)

  const outPath = path.join(__dirname, '../src/data/places.json')
  await fs.writeFile(outPath, JSON.stringify(validated, null, 2), 'utf-8')
  console.log(`  Written ${validated.length} places to src/data/places.json`)
}
