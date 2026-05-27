import { describe, it, expect } from 'vitest'
import { buildExcuse } from './buildExcuse'
import type { Activity, Place } from '../types'

const surfekurs: Activity = { tekst: 'surfekurs' }
const lom: Place = { navn: 'Lom', prep: 'i' }

const yogaretreat: Activity = { tekst: 'yogaretreat' }
const voss: Place = { navn: 'Voss', prep: 'på' }

const møte: Activity = { tekst: 'halvdagsmøte om fremtiden til sopprisotto' }
const hell: Place = { navn: 'Hell', prep: 'i' }

describe('buildExcuse', () => {
  it('substitutes {aktivitet} and {sted} into a høflig frame', () => {
    const frame = 'Tusen takk for invitasjonen, men jeg skal på {aktivitet} {sted} den dagen.'
    expect(buildExcuse(surfekurs, lom, frame)).toBe(
      'Tusen takk for invitasjonen, men jeg skal på surfekurs i Lom den dagen.',
    )
  })

  it('substitutes {aktivitet} as bare tekst without a preposition', () => {
    const frame = 'Jeg skal på {aktivitet} {sted}.'
    expect(buildExcuse(surfekurs, lom, frame)).toBe('Jeg skal på surfekurs i Lom.')
  })

  it('handles "på" place preposition', () => {
    const frame = 'Jeg skal på {aktivitet} {sted}.'
    expect(buildExcuse(yogaretreat, voss, frame)).toBe('Jeg skal på yogaretreat på Voss.')
  })

  it('handles activity with complex tekst that itself contains a preposition', () => {
    const frame = 'Beklager, men jeg reiser til {aktivitet} {sted}.'
    expect(buildExcuse(møte, hell, frame)).toBe(
      'Beklager, men jeg reiser til halvdagsmøte om fremtiden til sopprisotto i Hell.',
    )
  })

  it('capitalises the first character when frame starts with lowercase', () => {
    const frame = 'orker ikke, skal på {aktivitet} {sted}.'
    expect(buildExcuse(surfekurs, lom, frame)).toBe('Orker ikke, skal på surfekurs i Lom.')
  })

  it('capitalises "på" when frame starts with it', () => {
    const frame = 'på {aktivitet} {sted} — det er svaret.'
    expect(buildExcuse(surfekurs, lom, frame)).toBe('På surfekurs i Lom — det er svaret.')
  })

  it('capitalises "på" that starts a sentence mid-frame', () => {
    const frame = 'Nope. på {aktivitet} {sted}. Ha det.'
    expect(buildExcuse(surfekurs, lom, frame)).toBe('Nope. På surfekurs i Lom. Ha det.')
  })

  it('capitalises after both . and other sentence-enders', () => {
    const frame = 'Glem det! på {aktivitet} {sted}. Punktum.'
    expect(buildExcuse(yogaretreat, voss, frame)).toBe(
      'Glem det! På yogaretreat på Voss. Punktum.',
    )
  })

  it('does not double-capitalise when frame already starts with uppercase', () => {
    const frame = 'Tusen takk, men jeg er på {aktivitet} {sted}.'
    const result = buildExcuse(surfekurs, lom, frame)
    expect(result.startsWith('Tusen takk')).toBe(true)
  })

  it('is a pure function — same inputs always produce same output', () => {
    const frame = 'Jeg er på {aktivitet} {sted}.'
    const result1 = buildExcuse(surfekurs, lom, frame)
    const result2 = buildExcuse(surfekurs, lom, frame)
    expect(result1).toBe(result2)
  })

  it('expands {stedNoPre} to bare place navn without preposition', () => {
    const frame = 'Jeg drives mot på {aktivitet} {stedNoPre}.'
    expect(buildExcuse(surfekurs, lom, frame)).toBe('Jeg drives mot på surfekurs Lom.')
  })

  it('bare {aktivitet} in terse frame without explicit prep', () => {
    const frame = 'Skal {aktivitet} {stedNoPre} nå.'
    expect(buildExcuse(surfekurs, lom, frame)).toBe('Skal surfekurs Lom nå.')
  })

  it('handles frames mixing bare and prepped forms', () => {
    const frame = '{aktivitet} i {stedNoPre}? Nei. på {aktivitet} {sted}.'
    expect(buildExcuse(surfekurs, lom, frame)).toBe(
      'Surfekurs i Lom? Nei. På surfekurs i Lom.',
    )
  })
})
