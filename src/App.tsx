import { useState } from 'react'
import { SlotMachine } from './components/SlotMachine'
import { ToneSelector } from './components/ToneSelector'
import type { Tone } from './types'

import activitiesData from './data/activities.json'
import placesData from './data/places.json'
import templatesData from './data/templates.json'

import type { Activity, Place, Templates } from './types'

const activities = activitiesData as Activity[]
const places = placesData as Place[]
const templates = templatesData as Templates

export default function App() {
  const [tone, setTone] = useState<Tone>('høflig')

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d1a] via-reel-bg to-[#0d0d1a] px-4 py-12 sm:py-20">
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-12">
        {/* Header */}
        <header className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl">
            Skulkomaten
          </h1>
          <p className="max-w-md text-xl text-white/60 sm:text-2xl">
            La Skulkomaten ta jobben
          </p>
        </header>

        {/* Tone selector */}
        <section aria-label="Velg tone på unnskyldningen">
          <ToneSelector selected={tone} onChange={setTone} />
        </section>

        {/* Slot machine */}
        <SlotMachine
          activities={activities}
          places={places}
          templates={templates}
          tone={tone}
        />

        {/* Footer */}
        <footer className="mt-4 text-center text-sm text-white/30">
          Alle unnskyldninger er selvfølgelig helt sanne.
        </footer>
      </main>
    </div>
  )
}
