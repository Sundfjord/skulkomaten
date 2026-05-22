/**
 * genTemplates.ts
 *
 * LLM-generates 20–40 excuse template frames per tone with prompt caching,
 * validates that every frame contains both {aktivitet} and {sted} tokens,
 * then writes to src/data/templates.json.
 *
 * Output: src/data/templates.json
 *
 * Run via: npm run pregenerate -- templates
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { TemplatesSchema } from './schemas.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const MODEL = 'claude-haiku-4-5-20251001'
const FRAMES_PER_TONE = 30

const TONES = ['høflig', 'frekk', 'dramatisk'] as const

const SYSTEM_PROMPT = `Du er kreativ norsk tekstforfatter som lager unnskyldningsmaler for en moro-app kalt Skulkomaten.

REGLER:
1. Hvert frame er en norsk setning med nøyaktig disse to tokenene: {aktivitet} og {sted}.
2. {aktivitet} utvides til "<prep> <aktivitetstekst>" (f.eks. "på surfekurs").
3. {sted} utvides til "<prep> <stedsnavn>" (f.eks. "i Lom").
4. Aldri inkluder noen annen preposisjon rett foran tokenene — preposisjonene kommer fra dataene.
5. Tonen skal være konsistent med den angitte stilen.
6. Returner et JSON-array av strings — ingen forklaring, ingen kodeblokk.

EKSEMPEL OUTPUT for "høflig":
["Tusen takk for invitasjonen, men jeg skal {aktivitet} {sted} den dagen.", "Jeg har dessverre allerede en avtale — jeg er {aktivitet} {sted}."]`

const FramesSchema = z
  .array(z.string())
  .min(1)
  .refine(
    (frames) => frames.every((f) => f.includes('{aktivitet}') && f.includes('{sted}')),
    { message: 'Every frame must contain {aktivitet} and {sted}' },
  )

const TONE_DESCRIPTIONS: Record<(typeof TONES)[number], string> = {
  høflig:
    'Høflig og takknemlig tone. Unnskyldningen er vennlig, litt beklgende og respektfull. Bruk "Tusen takk", "Dessverre", "Jeg setter pris på". Fulle, grammatiske setninger.',
  frekk:
    'Frekk, ubrydd tone. Korte setninger. Ingen unødvendige ord. Viser tydelig at man ikke gidder. Kan bruke "Nei.", "Nope.", "Orker ikke.", men fortsatt grammatisk norsk.',
  dramatisk:
    'Overdramatisk og teatralsk tone. Bruker ord som "skjebnen", "kallet", "universet", "sjelen". Gjerne store bokstaver for å understreke. Litt absurd og overdrevet.',
}

export async function genTemplates(): Promise<void> {
  const client = new Anthropic()

  const results: Record<string, string[]> = {}

  for (const tone of TONES) {
    console.log(`  Generating ${FRAMES_PER_TONE} frames for tone "${tone}"…`)

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
          content: `Tone: ${tone}\nBeskrivelse: ${TONE_DESCRIPTIONS[tone]}\n\nGenerer eksakt ${FRAMES_PER_TONE} unnskyldningsmaler som JSON-array. Hvert element er en string med tokenene {aktivitet} og {sted}.`,
        },
      ],
    })

    const raw = response.content[0]
    if (raw.type !== 'text') throw new Error(`Unexpected LLM response for tone ${tone}`)

    let parsed: unknown
    try {
      const text = raw.text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      parsed = JSON.parse(text)
    } catch {
      throw new Error(`LLM returned non-JSON for tone ${tone}: ${raw.text.slice(0, 200)}`)
    }

    const validated = FramesSchema.parse(parsed)
    results[tone] = validated
    console.log(`    OK: ${validated.length} frames`)
  }

  const validated = TemplatesSchema.parse(results)

  const outPath = path.join(__dirname, '../src/data/templates.json')
  await fs.writeFile(outPath, JSON.stringify(validated, null, 2), 'utf-8')
  console.log(`  Written templates to src/data/templates.json`)
}
