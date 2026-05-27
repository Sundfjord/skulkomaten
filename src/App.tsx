import { SlotMachine } from './components/SlotMachine'

import activitiesData from './data/activities.json'
import placesData from './data/places.json'
import templatesData from './data/templates.json'

import type { Activity, Place, Templates } from './types'

const activities = activitiesData as Activity[]
const places = placesData as Place[]
const templates = templatesData as Templates

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#120020] via-[#1e0035] to-[#120020] px-4 py-12 sm:py-20">
      <main className="mx-auto flex max-w-lg flex-col items-center gap-12">
        {/* Slot machine */}
        <SlotMachine
          activities={activities}
          places={places}
          templates={templates}
        />
      </main>
    </div>
  )
}
