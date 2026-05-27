import { motion } from 'framer-motion'
import type { Lang } from '../types'

interface LanguagePickerProps {
  lang: Lang
  onChange: (lang: Lang) => void
}

const OPTIONS: { value: Lang; flag: string; label: string }[] = [
  { value: 'nn', flag: '🇳🇴', label: 'Nynorsk' },
  { value: 'nb', flag: '🇩🇰', label: 'Bokmål' },
]

export function LanguagePicker({ lang, onChange }: LanguagePickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Velg målform"
      className="flex border-b border-white/10"
    >
      {OPTIONS.map(({ value, flag, label }) => {
        const isSelected = lang === value
        return (
          <motion.button
            key={value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(value)}
            whileTap={{ scale: 0.97 }}
            className="relative flex flex-1 cursor-pointer items-center justify-center gap-2.5 py-3 font-display text-sm font-semibold tracking-wide focus-visible:outline focus-visible:outline-2 focus-visible:outline-reel-accent"
            animate={{
              backgroundColor: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0)',
              color: isSelected ? '#ffe87a' : 'rgba(255,232,122,0.4)',
            }}
            transition={{ duration: 0.18 }}
            style={{ border: 'none' }}
          >
            <span className="text-xl leading-none select-none">{flag}</span>
            <span>{label}</span>

            {/* Sliding gold underline indicator */}
            {isSelected && (
              <motion.span
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{ background: '#c9860a' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
