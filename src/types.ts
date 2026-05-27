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

/** Flat list of template frames — one is picked randomly each spin */
export type Templates = string[]
