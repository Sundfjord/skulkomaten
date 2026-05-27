import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Reel } from './Reel'
import { useSpin } from '../lib/useSpin'
import { buildExcuse } from '../lib/buildExcuse'
import type { Activity, Place, Templates, Tone } from '../types'

interface SlotMachineProps {
  activities: Activity[]
  places: Place[]
  templates: Templates
}

/**
 * SlotMachine owns all spin state and orchestrates the two reels.
 * The place reel stops slightly after the activity reel (stagger).
 */
export function SlotMachine({ activities, places, templates }: SlotMachineProps) {
  const ACTIVITY_DURATION = 2400
  const PLACE_DURATION = 3300 // 900 ms stagger — place coasts to a stop last

  const activitySpin = useSpin({ count: activities.length, duration: ACTIVITY_DURATION })
  const placeSpin = useSpin({ count: places.length, duration: PLACE_DURATION })

  const [tone, setTone] = useState<Tone>('høflig')
  const [excuse, setExcuse] = useState<string | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const settledCountRef = useRef(0)
  const toneRef = useRef(tone)

  // Keep tone ref current so the settled callback uses the latest tone
  useEffect(() => {
    toneRef.current = tone
  }, [tone])

  const handleToneChange = useCallback(
    (newTone: Tone) => {
      setTone(newTone)
      if (isSpinning || excuse === null) return
      const frames = templates[newTone] ?? []
      if (frames.length === 0) return
      const frame = frames[Math.floor(Math.random() * frames.length)]
      const activity = activities[activitySpin.targetIndex]
      const place = places[placeSpin.targetIndex]
      if (activity && place && frame) {
        setExcuse(buildExcuse(activity, place, frame))
      }
    },
    [isSpinning, excuse, activities, places, templates, activitySpin.targetIndex, placeSpin.targetIndex],
  )

  const handleSpin = useCallback(() => {
    if (isSpinning) return
    setIsSpinning(true)
    setExcuse(null)
    settledCountRef.current = 0
    activitySpin.spin()
    placeSpin.spin()
  }, [isSpinning, activitySpin, placeSpin])

  const handleReelSettled = useCallback(
    (reel: 'activity' | 'place') => {
      // Each reel calls this when it stops; build excuse once both have settled
      void reel // reel identity is informational only for now
      settledCountRef.current += 1

      if (settledCountRef.current >= 2) {
        const frames = templates[toneRef.current] ?? []
        if (frames.length === 0) return

        const frame = frames[Math.floor(Math.random() * frames.length)]
        const activity = activities[activitySpin.targetIndex]
        const place = places[placeSpin.targetIndex]

        if (activity && place && frame) {
          setExcuse(buildExcuse(activity, place, frame))
        }
        setIsSpinning(false)
      }
    },
    [activities, places, templates, activitySpin.targetIndex, placeSpin.targetIndex],
  )

  const activityItems = activities.map((a) => a.tekst)
  // Preposition is now part of the place reel label: "i Lom", "på Voss"
  const placeItems = places.map((p) => `${p.prep} ${p.navn}`)

  return (
    <div className="flex flex-col items-center">
      {/*
        Single golden body — one gradient flows from the arched sign top
        through the reel frame and into the control section bottom.
        Child elements carry no background of their own; they are transparent
        windows into this container's colour.
      */}
      <div
        className="w-full"
        style={{
          position: 'relative',
          background: 'linear-gradient(to bottom, #ffe87a 0%, #f5d060 10%, #e8c020 20%, #c9860a 38%, #c9860a 55%, #a06800 67%, #7a4e00 83%, #4a2e00 100%)',
          borderRadius: '50% 50% 24px 24px / 40px 40px 24px 24px',
          boxShadow: '0 0 40px rgba(201,152,10,0.35), 0 16px 50px rgba(0,0,0,0.75), inset 0 2px 0 rgba(255,255,255,0.25)',
          overflow: 'visible',
        }}
      >
        <CasinoSign />

        {/* Reel area — transparent; 10 px padding is the visible gold border */}
        <div
          role="region"
          aria-label="Spilleautomaten"
          style={{ position: 'relative', padding: 10, overflow: 'visible' }}
        >
          {/* Left arrow — protrudes from the left edge of the frame */}
          <span
            aria-hidden="true"
            className={`select-none text-5xl transition-opacity ${!isSpinning ? 'animate-neon-pulse' : 'opacity-20'}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              background: 'linear-gradient(175deg, #ff8080 0%, #cc1515 30%, #800000 65%, #4a0000 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.8))',
            }}
          >{'▶︎'}</span>

          {/* Right arrow — protrudes from the right edge of the frame */}
          <span
            aria-hidden="true"
            className={`select-none text-5xl transition-opacity ${!isSpinning ? 'animate-neon-pulse' : 'opacity-20'}`}
            style={{
              position: 'absolute',
              top: '50%',
              right: 0,
              transform: 'translate(50%, -50%)',
              zIndex: 10,
              background: 'linear-gradient(175deg, #ff8080 0%, #cc1515 30%, #800000 65%, #4a0000 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.8))',
            }}
          >{'◀︎'}</span>

          <div
            className="flex items-stretch bg-reel-bg overflow-hidden"
            style={{ borderRadius: 15 }}
          >
            <div className="flex flex-col justify-center">
              <Reel
                items={activityItems}
                targetIndex={activitySpin.targetIndex}
                spinState={activitySpin.state}
                onSettled={() => handleReelSettled('activity')}
                label="Aktivitet"
                durationMs={ACTIVITY_DURATION}
              />
            </div>


<div className="flex flex-col justify-center">
              <Reel
                items={placeItems}
                targetIndex={placeSpin.targetIndex}
                spinState={placeSpin.state}
                onSettled={() => handleReelSettled('place')}
                label="Sted"
                durationMs={PLACE_DURATION}
              />
            </div>
          </div>
        </div>

        {/* Control section — transparent; sits in the lower, darker gradient band */}
        <div className="flex flex-col items-center gap-5 px-4 pb-10 pt-6">
          <motion.button
            type="button"
            onClick={handleSpin}
            disabled={isSpinning}
            whileTap={{ scale: isSpinning ? 1 : 0.95 }}
            whileHover={{ scale: isSpinning ? 1 : 1.05 }}
            className="rounded-3xl font-display text-xl font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-reel-accent"
            style={{
              padding: '1.5rem 3rem',
              background: 'radial-gradient(circle at 38% 30%, #ff9090, #d01818 45%, #880000)',
              boxShadow: '0 0 0 5px #c9860a, 0 8px 28px rgba(0,0,0,0.8), inset 0 3px 10px rgba(255,255,255,0.25)',
              cursor: isSpinning ? 'not-allowed' : 'pointer',
              opacity: isSpinning ? 0.65 : 1,
              transition: 'opacity 0.2s, box-shadow 0.2s',
            }}
            aria-busy={isSpinning}
          >
            {'Spinn'.toUpperCase()}
          </motion.button>

          {excuse && <ExcusePanel excuse={excuse} tone={tone} onToneChange={handleToneChange} />}
        </div>
      </div>
    </div>
  )
}

/** Title area — no background of its own; shows the parent container's gradient */
function CasinoSign() {
  return (
    <div
      className="relative w-full"
      style={{
        paddingTop: '2.5rem',
        paddingBottom: '1.25rem',
        paddingLeft: '3.5rem',
        paddingRight: '3.5rem',
      }}
    >
      <h1
        className="relative z-10 text-center font-display text-3xl font-black tracking-wider sm:text-4xl"
        style={{
          color: '#7a2f00',
          textShadow: '0 1px 0 rgba(255,220,80,0.6), 0 2px 0 rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.25)',
        }}
      >
        Skulkomaten
      </h1>
    </div>
  )
}

const TONE_OPTIONS: { value: Tone; label: string; emoji: string }[] = [
  { value: 'høflig', label: 'Høflig', emoji: '🎩' },
  { value: 'frekk', label: 'Frekk', emoji: '😏' },
  { value: 'dramatisk', label: 'Dramatisk', emoji: '🎭' },
]

/** Inline excuse panel — avoids import cycle since ExcuseDisplay imports nothing from here */
function ExcusePanel({
  excuse,
  tone,
  onToneChange,
}: {
  excuse: string
  tone: Tone
  onToneChange: (tone: Tone) => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(excuse)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — silently ignore
    }
  }, [excuse])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex w-full max-w-xl flex-col items-center gap-4 rounded-3xl bg-reel-bg px-6 py-6 shadow-xl ring-1 ring-white/10"
      role="region"
      aria-label="Din unnskyldning"
    >
      <p className="text-center text-lg font-medium text-white sm:text-xl" aria-live="polite">
        {excuse}
      </p>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label
            htmlFor="tone-select"
            className="text-xs font-display uppercase tracking-widest text-white/50"
          >
            Tone
          </label>
          <select
            id="tone-select"
            value={tone}
            onChange={(e) => onToneChange(e.target.value as Tone)}
            className="cursor-pointer rounded-lg bg-white/10 px-3 py-1.5 text-sm font-display text-white focus:outline-none focus:ring-1 focus:ring-reel-accent"
          >
            {TONE_OPTIONS.map(({ value, label, emoji }) => (
              <option key={value} value={value}>
                {emoji} {label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Kopiert!' : 'Kopier unnskyldningen'}
          className="rounded-lg bg-white/10 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {copied ? 'Kopiert!' : 'Kopier'}
        </button>
      </div>
    </motion.div>
  )
}
