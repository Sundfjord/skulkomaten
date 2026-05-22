import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Reel, CELL_HEIGHT } from './Reel'
import { useSpin } from '../lib/useSpin'
import { buildExcuse } from '../lib/buildExcuse'
import type { Activity, Place, Templates, Tone } from '../types'

interface SlotMachineProps {
  activities: Activity[]
  places: Place[]
  templates: Templates
  tone: Tone
}

/**
 * SlotMachine owns all spin state and orchestrates the two reels.
 * The place reel stops slightly after the activity reel (stagger).
 */
export function SlotMachine({ activities, places, templates, tone }: SlotMachineProps) {
  const ACTIVITY_DURATION = 2400
  const PLACE_DURATION = 3300 // 900 ms stagger — place coasts to a stop last

  const activitySpin = useSpin({ count: activities.length, duration: ACTIVITY_DURATION })
  const placeSpin = useSpin({ count: places.length, duration: PLACE_DURATION })

  const [excuse, setExcuse] = useState<string | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const settledCountRef = useRef(0)
  const toneRef = useRef(tone)

  // Keep tone ref current so the settled callback uses the latest tone
  useEffect(() => {
    toneRef.current = tone
  }, [tone])

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
  const placeItems = places.map((p) => p.navn)

  // The connecting preposition (i / på) belongs to the place and only appears
  // once the location is determined — i.e. when an excuse has been assembled.
  const connectingPrep = excuse ? places[placeSpin.targetIndex]?.prep : null

  return (
    <div className="flex flex-col items-center gap-10">
      {/* Reels */}
      <div
        className="flex items-stretch gap-3 sm:gap-5 rounded-2xl bg-reel-bg p-8 shadow-2xl ring-1 ring-white/10"
        role="region"
        aria-label="Spilleautomaten"
      >
        <div className="flex flex-col items-center gap-3">
          <span className="text-sm font-medium uppercase tracking-widest text-white/50">
            Aktivitet
          </span>
          <Reel
            items={activityItems}
            targetIndex={activitySpin.targetIndex}
            spinState={activitySpin.state}
            onSettled={() => handleReelSettled('activity')}
            label="Aktivitet"
            durationMs={ACTIVITY_DURATION}
          />
        </div>

        {/* Connecting preposition — sits between the reels, independent of both */}
        <div className="flex flex-col items-center gap-3">
          <span
            aria-hidden="true"
            className="select-none text-sm font-medium uppercase tracking-widest text-transparent"
          >
            ·
          </span>
          <div
            className="flex items-center justify-center"
            style={{ height: CELL_HEIGHT }}
          >
            <AnimatePresence mode="wait">
              {connectingPrep && (
                <motion.span
                  key={connectingPrep}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="text-3xl font-semibold lowercase text-reel-accent sm:text-4xl"
                >
                  {connectingPrep}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <span className="text-sm font-medium uppercase tracking-widest text-white/50">
            Sted
          </span>
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

      {/* Spin button */}
      <motion.button
        type="button"
        onClick={handleSpin}
        disabled={isSpinning}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: isSpinning ? 1 : 1.04 }}
        className={[
          'rounded-full px-14 py-5 text-2xl font-bold tracking-wide text-white shadow-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-reel-accent',
          isSpinning
            ? 'cursor-not-allowed bg-reel-highlight opacity-60'
            : 'bg-reel-accent hover:bg-reel-accent/90 active:bg-reel-accent/80',
        ].join(' ')}
        aria-busy={isSpinning}
      >
        {isSpinning ? 'Snurrer…' : 'Spinn'}
      </motion.button>

      {/* Excuse display */}
      {excuse && <ExcusePanel excuse={excuse} />}
    </div>
  )
}

/** Inline excuse panel — avoids import cycle since ExcuseDisplay imports nothing from here */
function ExcusePanel({ excuse }: { excuse: string }) {
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
      className="flex w-full max-w-xl flex-col items-center gap-4 rounded-2xl bg-reel-highlight px-6 py-6 shadow-xl ring-1 ring-white/10"
      role="region"
      aria-label="Din unnskyldning"
    >
      <p className="text-center text-lg font-medium text-white sm:text-xl" aria-live="polite">
        {excuse}
      </p>

      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Kopiert!' : 'Kopier unnskyldningen'}
        className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {copied ? 'Kopiert!' : 'Kopier'}
      </button>
    </motion.div>
  )
}
