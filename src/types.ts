export interface Activity {
  /** Display text, stored lowercase for mid-sentence use */
  tekst: string
}

export interface Place {
  /** Place name, capitalised as stored */
  navn: string
  /** Preposition governing this place: i / på */
  prep: 'i' | 'på'
}

/** Available tone identifiers */
export type Tone = 'høflig' | 'frekk' | 'dramatisk'

/**
 * Template bank, keyed by tone.
 * Every string must contain exactly the tokens {aktivitet} and {sted}.
 */
export type Templates = Record<Tone, string[]>
