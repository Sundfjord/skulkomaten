import { describe, it, expect } from 'vitest'
import { buildExcuse } from './buildExcuse'
import type { Activity, Place } from '../types'

const surfekurs: Activity = { tekst: 'surfekurs', prep: 'på' }
const lom: Place = { navn: 'Lom', prep: 'i' }

const yogaretreat: Activity = { tekst: 'yogaretreat', prep: 'på' }
const voss: Place = { navn: 'Voss', prep: 'på' }

const møte: Activity = { tekst: 'halvdagsmøte om fremtiden til sopprisotto', prep: 'til' }
const hell: Place = { navn: 'Hell', prep: 'i' }

describe('buildExcuse', () => {
  it('substitutes {aktivitet} and {sted} into a høflig frame', () => {
    const frame = 'Tusen takk for invitasjonen, men jeg skal {aktivitet} {sted} den dagen.'
    expect(buildExcuse(surfekurs, lom, frame)).toBe(
      'Tusen takk for invitasjonen, men jeg skal på surfekurs i Lom den dagen.',
    )
  })

  it('expands prepositions correctly', () => {
    const frame = 'Jeg skal {aktivitet} {sted}.'
    expect(buildExcuse(surfekurs, lom, frame)).toBe('Jeg skal på surfekurs i Lom.')
  })

  it('handles "på" place preposition', () => {
    const frame = 'Jeg skal {aktivitet} {sted}.'
    expect(buildExcuse(yogaretreat, voss, frame)).toBe('Jeg skal på yogaretreat på Voss.')
  })

  it('handles "til" activity preposition with "i" place preposition', () => {
    const frame = 'Beklager, men jeg reiser {aktivitet} {sted}.'
    expect(buildExcuse(møte, hell, frame)).toBe(
      'Beklager, men jeg reiser til halvdagsmøte om fremtiden til sopprisotto i Hell.',
    )
  })

  it('capitalises the first character when frame starts with lowercase', () => {
    const frame = 'orker ikke, skal {aktivitet} {sted}.'
    expect(buildExcuse(surfekurs, lom, frame)).toBe('Orker ikke, skal på surfekurs i Lom.')
  })

  it('capitalises the first character when frame starts with {aktivitet}', () => {
    const frame = '{aktivitet} {sted} — det er svaret.'
    expect(buildExcuse(surfekurs, lom, frame)).toBe('På surfekurs i Lom — det er svaret.')
  })

  it('capitalises a preposition that starts a sentence mid-frame', () => {
    const frame = 'Nope. {aktivitet} {sted}. Ha det.'
    expect(buildExcuse(surfekurs, lom, frame)).toBe('Nope. På surfekurs i Lom. Ha det.')
  })

  it('capitalises after both . and other sentence-enders', () => {
    const frame = 'Glem det! {aktivitet} {sted}. Punktum.'
    expect(buildExcuse(yogaretreat, voss, frame)).toBe(
      'Glem det! På yogaretreat på Voss. Punktum.',
    )
  })

  it('does not double-capitalise when frame already starts with uppercase', () => {
    const frame = 'Tusen takk, men jeg er {aktivitet} {sted}.'
    const result = buildExcuse(surfekurs, lom, frame)
    expect(result.startsWith('Tusen takk')).toBe(true)
  })

  it('is a pure function — same inputs always produce same output', () => {
    const frame = 'Jeg er {aktivitet} {sted}.'
    const result1 = buildExcuse(surfekurs, lom, frame)
    const result2 = buildExcuse(surfekurs, lom, frame)
    expect(result1).toBe(result2)
  })
})
