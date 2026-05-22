/**
 * genActivities.ts
 *
 * LLM-generates ~150 plausible-but-skippable activities with correct
 * Norwegian prepositions, validated against the schema before writing.
 *
 * Output: src/data/activities.json
 *
 * Run via: npm run pregenerate -- activities
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import Anthropic from '@anthropic-ai/sdk'
import { ActivitiesSchema } from './schemas.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const MODEL = 'claude-haiku-4-5-20251001'
const TARGET_COUNT = 150

const SYSTEM_PROMPT = `Du er kreativ norsk tekstforfatter.

Din oppgave er å generere en liste med norske aktiviteter som høres plausible ut, men som er morsomme unnskyldninger for å slippe å gå i selskap.

REGLER:
1. Aktivitetsteksten skal være på norsk, i LOWERCASE (midtsetning-bruk).
2. Hvert objekt har feltene "tekst" (string) og "prep" (preposisjon som styrer aktiviteten).
3. Preposisjonsregler:
   - «på» foran kurs, retreat, seminar, mesterskap, tur, ekspedisjon, festival, workshop, møte (der møte brukes med «ha møte»): "på surfekurs", "på yogaretreat", "på halvmaraton"
   - «til» foran hendelser der man "drar til noe" som man normalt bruker til-konstruksjon: "til veving", "til bryting", "til begravelse"
   - «i» foran fritidsaktiviteter der man "deltar i noe": "i terningklubb", "i kor"
4. Aktivitetene skal leses som morsomme, men ikke umulige: kurs, retreater, arrangementer, idretter.
5. Returner et JSON-array — ingen forklaring, ingen kodeblokk.

EKSEMPLER:
[
  { "tekst": "surfekurs", "prep": "på" },
  { "tekst": "yogaretreat", "prep": "på" },
  { "tekst": "terningklubb", "prep": "i" },
  { "tekst": "alpakkavandringstur", "prep": "på" },
  { "tekst": "veving", "prep": "til" }
]`

export async function genActivities(): Promise<void> {
  const client = new Anthropic()

  console.log(`  Generating ~${TARGET_COUNT} activities…`)

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Generer eksakt ${TARGET_COUNT} norske aktiviteter som JSON-array. Aktivitetene skal være morsomme, varierte, og inkludere en miks av kurs, retreater, idretter, frivillighet og hobbyvirksomhet. Ikke gjenta aktivitetstyper.`,
      },
    ],
  })

  const raw = response.content[0]
  if (raw.type !== 'text') throw new Error('Unexpected LLM response type')

  let parsed: unknown
  try {
    // Strip potential markdown code fences
    const text = raw.text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    parsed = JSON.parse(text)
  } catch {
    throw new Error(`LLM returned non-JSON: ${raw.text.slice(0, 200)}`)
  }

  const validated = ActivitiesSchema.parse(parsed)

  const outPath = path.join(__dirname, '../src/data/activities.json')
  await fs.writeFile(outPath, JSON.stringify(validated, null, 2), 'utf-8')
  console.log(`  Written ${validated.length} activities to src/data/activities.json`)
}
