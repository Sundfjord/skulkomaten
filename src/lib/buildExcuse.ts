import type { Activity, Place } from '../types'

/**
 * Pure function: expand activity and place tokens into a template frame.
 *
 * Token expansion:
 *   {aktivitet}      → "<prep> <tekst>"       e.g. "på surfekurs"
 *   {aktivitetNoPre} → "<tekst>"              e.g. "surfekurs"
 *   {sted}           → "<prep> <navn>"        e.g. "i Lom"
 *   {stedNoPre}      → "<navn>"               e.g. "Lom"
 *
 * The first letter of every sentence is uppercased so templates that start a
 * sentence with a token — e.g. "Nope. {aktivitet} {sted}." — don't leave the
 * expanded preposition ("på", "i") in lowercase.
 */
export function buildExcuse(
  activity: Activity,
  place: Place,
  frame: string,
): string {
  const aktivitetWithPrep = `${activity.prep} ${activity.tekst}`
  const aktivitetNoPrep = activity.tekst
  const stedWithPrep = `${place.prep} ${place.navn}`
  const stedNoPrep = place.navn

  const sentence = frame
    .replace(/{aktivitetNoPre}/g, aktivitetNoPrep)
    .replace(/{aktivitet}/g, aktivitetWithPrep)
    .replace(/{stedNoPre}/g, stedNoPrep)
    .replace(/{sted}/g, stedWithPrep)

  // Capitalise the first letter at the start of the string and after any
  // sentence-ending punctuation (. ! ?). Handles Norwegian å/æ/ø.
  return sentence.replace(
    /(^\s*|[.!?]\s+)([a-zæøå])/g,
    (_match, lead: string, letter: string) => lead + letter.toUpperCase(),
  )
}
