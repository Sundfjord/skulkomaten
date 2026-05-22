import type { Tone } from '../types'

interface ToneSelectorProps {
  selected: Tone
  onChange: (tone: Tone) => void
}

const TONES: { value: Tone; label: string; emoji: string }[] = [
  { value: 'høflig', label: 'Høflig', emoji: '🎩' },
  { value: 'frekk', label: 'Frekk', emoji: '😏' },
  { value: 'dramatisk', label: 'Dramatisk', emoji: '🎭' },
]

/**
 * Tone chips — lets the user pick which template pool to draw from.
 * Uses a radiogroup for correct keyboard semantics (arrow-key navigation).
 */
export function ToneSelector({ selected, onChange }: ToneSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Velg tone" className="flex flex-wrap justify-center gap-3">
      {TONES.map(({ value, label, emoji }) => {
        const isSelected = selected === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(value)}
            className={[
              'flex items-center gap-2 rounded-full px-7 py-3 text-lg font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-reel-accent',
              isSelected
                ? 'bg-reel-accent text-white shadow-md shadow-reel-accent/40'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white',
            ].join(' ')}
          >
            <span aria-hidden="true">{emoji}</span>
            {label}
          </button>
        )
      })}
    </div>
  )
}
