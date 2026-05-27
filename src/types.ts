export interface Activity {
  /** Display text in Bokmål, stored lowercase for mid-sentence use */
  nb: string
  /** Display text in Nynorsk, stored lowercase for mid-sentence use */
  nn: string
}

export interface Place {
  /** Place name, capitalised as stored */
  navn: string
  /** Preposition governing this place: i / på (same in NB and NN) */
  prep: 'i' | 'på'
}

/** UI language selection */
export type Lang = 'nb' | 'nn'

/** One template frame in both written standards */
export interface Template {
  nb: string
  nn: string
}

/** Flat list of template frames — one is picked randomly each spin */
export type Templates = Template[]
