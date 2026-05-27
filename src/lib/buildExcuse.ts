import type { Place } from '../types'

/**
 * Pure function: expand activity and place tokens into a template frame.
 *
 * Token expansion:
 *   {aktivitet}  → aktivitetTekst (bare, no preposition — prep lives in the template)
 *   {sted}       → "<prep> <navn>"   e.g. "i Lom"
 *   {stedNoPre}  → "<navn>"          e.g. "Lom"
 *
 * The first letter of every sentence is uppercased so templates that start a
 * sentence with "på {aktivitet}" don't leave "på" in lowercase.
 *
 * Callers resolve the language-specific string from Activity before passing it in.
 */
export function buildExcuse(
  aktivitetTekst: string,
  place: Place,
  frame: string,
): string {
  const stedWithPrep = `${place.prep} ${place.navn}`
  const stedNoPrep = place.navn

  const sentence = frame
    .replace(/{aktivitet}/g, aktivitetTekst)
    .replace(/{stedNoPre}/g, stedNoPrep)
    .replace(/{sted}/g, stedWithPrep)

  // Capitalise the first letter at the start of the string and after any
  // sentence-ending punctuation (. ! ?). Handles Norwegian å/æ/ø.
  return sentence.replace(
    /(^\s*|[.!?]\s+)([a-zæøå])/g,
    (_match, lead: string, letter: string) => lead + letter.toUpperCase(),
  )
}
