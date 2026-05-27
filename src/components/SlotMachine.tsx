import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Reel } from './Reel'
import { useSpin } from '../lib/useSpin'
import { buildExcuse } from '../lib/buildExcuse'
import type { Activity, Place } from '../types'

interface SlotMachineProps {
  activities: Activity[]
  places: Place[]
  templates: string[]
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

  const [excuse, setExcuse] = useState<string | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [lockedReel, setLockedReel] = useState<'activity' | 'place' | null>(null)
  const settledCountRef = useRef(0)
  const [copied, setCopied] = useState(false)

  const pickExcuse = useCallback(
    (activityIdx: number, placeIdx: number) => {
      const frame = templates[Math.floor(Math.random() * templates.length)]
      const activity = activities[activityIdx]
      const place = places[placeIdx]
      if (activity && place && frame) {
        setExcuse(buildExcuse(activity, place, frame))
      }
    },
    [templates, activities, places],
  )

  const handleReroll = useCallback(() => {
    pickExcuse(activitySpin.targetIndex, placeSpin.targetIndex)
  }, [pickExcuse, activitySpin.targetIndex, placeSpin.targetIndex])

  const handleSpin = useCallback(() => {
    if (isSpinning) return
    setIsSpinning(true)
    setExcuse(null)
    // A locked reel never spins, so count it as already settled
    settledCountRef.current = lockedReel ? 1 : 0
    if (lockedReel !== 'activity') activitySpin.spin()
    if (lockedReel !== 'place') placeSpin.spin()
  }, [isSpinning, activitySpin, placeSpin, lockedReel])

  const handleHold = useCallback(() => {
    if (isSpinning) return
    setLockedReel((prev) => {
      if (prev === null) return 'activity'
      if (prev === 'activity') return 'place'
      return null
    })
  }, [isSpinning])

  const handleReelSettled = useCallback(
    (reel: 'activity' | 'place') => {
      void reel
      settledCountRef.current += 1

      if (settledCountRef.current >= 2) {
        pickExcuse(activitySpin.targetIndex, placeSpin.targetIndex)
        setIsSpinning(false)
      }
    },
    [pickExcuse, activitySpin.targetIndex, placeSpin.targetIndex],
  )

  const handleCopy = useCallback(async () => {
    if (!excuse) return
    try {
      await navigator.clipboard.writeText(excuse)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — silently ignore
    }
  }, [excuse])

  const activityItems = activities.map((a) => a.tekst.charAt(0).toUpperCase() + a.tekst.slice(1))
  const placeItems = places.map((p) => `${p.prep} ${p.navn}`)

  const sharedButtonBox = '0 0 0 5px #c9860a, 0 8px 28px rgba(0,0,0,0.8), inset 0 3px 10px rgba(255,255,255,0.25)'

  return (
    <div
      className="flex flex-col items-center w-full gap-10 p-8"
      style={{
          background: 'linear-gradient(to bottom, #ffe87a 0%, #f5d060 10%, #e8c020 20%, #c9860a 38%, #c9860a 55%, #a06800 67%, #7a4e00 83%, #4a2e00 100%)',
          borderRadius: '50% 50% 24px 24px / 40px 40px 24px 24px',
          boxShadow: '0 0 40px rgba(201,152,10,0.35), 0 16px 50px rgba(0,0,0,0.75), inset 0 2px 0 rgba(255,255,255,0.25)',
      }}
    >
      {/*
        Single golden body — one gradient flows from the arched sign top
        through the reel frame and into the control section bottom.
        Child elements carry no background of their own; they are transparent
        windows into this container's colour.
      */}
      <h1
        className="relative z-10 text-center font-display text-4xl font-black tracking-wider"
        style={{
          color: '#7a2f00',
          textShadow: '0 1px 0 rgba(255,220,80,0.6), 0 2px 0 rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.25)',
        }}
      >
        Skulkomaten
      </h1>

      <div className="flex flex-col items-center w-full gap-5">
        <div
          className="relative overflow-visible"
          role="region"
          aria-label="Spilleautomaten"
        >
          {/* Left arrow — protrudes from the left edge of the frame */}
          <span
            aria-hidden="true"
            className={`select-none text-5xl transition-opacity z-30`}
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              transform: 'translate(-50%, -50%)',
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
            className={`select-none text-5xl transition-opacity z-30`}
            style={{
              position: 'absolute',
              top: '50%',
              right: 0,
              transform: 'translate(50%, -50%)',
              background: 'linear-gradient(175deg, #ff8080 0%, #cc1515 30%, #800000 65%, #4a0000 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.8))',
            }}
          >{'◀︎'}</span>

          <div
            className="flex items-stretch rounded-2xl overflow-hidden"
          >
            <div className="flex flex-1 flex-col justify-center">
              <Reel
                items={activityItems}
                targetIndex={activitySpin.targetIndex}
                spinState={activitySpin.state}
                onSettled={() => handleReelSettled('activity')}
                label="Aktivitet"
                durationMs={ACTIVITY_DURATION}
                locked={lockedReel === 'activity'}
              />
            </div>

            <div className="flex flex-1 flex-col justify-center">
              <Reel
                items={placeItems}
                targetIndex={placeSpin.targetIndex}
                spinState={placeSpin.state}
                onSettled={() => handleReelSettled('place')}
                label="Sted"
                durationMs={PLACE_DURATION}
                locked={lockedReel === 'place'}
              />
            </div>
          </div>
        </div>

          {/* Shared-width container — both button rows fill exactly this width */}
          <div className="flex w-full flex-col gap-4">
            {/* Row 1: HOLD + SPINN */}
            <div className="flex gap-4">
              <motion.button
                type="button"
                onClick={handleHold}
                disabled={isSpinning}
                whileTap={{ scale: isSpinning ? 1 : 0.95 }}
                whileHover={{ scale: isSpinning ? 1 : 1.05 }}
                className="flex-1 rounded-3xl font-display text-xl font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-reel-accent"
                style={{
                  padding: '1.5rem 0',
                  background: 'radial-gradient(circle at 38% 30%, #8df58d, #1ea11e 45%, #0a5a0a)',
                  boxShadow: sharedButtonBox,
                  cursor: isSpinning ? 'not-allowed' : 'pointer',
                  opacity: isSpinning ? 0.65 : 1,
                  transition: 'opacity 0.2s, box-shadow 0.2s',
                }}
                aria-pressed={lockedReel !== null}
                aria-label={
                  lockedReel === 'activity'
                    ? 'Hold: aktivitet låst'
                    : lockedReel === 'place'
                      ? 'Hold: sted låst'
                      : 'Hold'
                }
              >
                HOLD
              </motion.button>

              <motion.button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning}
                whileTap={{ scale: isSpinning ? 1 : 0.95 }}
                whileHover={{ scale: isSpinning ? 1 : 1.05 }}
                className="flex-1 rounded-3xl font-display text-xl font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-reel-accent"
                style={{
                  padding: '1.5rem 0',
                  background: 'radial-gradient(circle at 38% 30%, #ff9090, #d01818 45%, #880000)',
                  boxShadow: sharedButtonBox,
                  cursor: isSpinning ? 'not-allowed' : 'pointer',
                  opacity: isSpinning ? 0.65 : 1,
                  transition: 'opacity 0.2s, box-shadow 0.2s',
                }}
                aria-busy={isSpinning}
              >
                SPINN
              </motion.button>
          </div>
        </div>
      </div>
      <div className="flex flex-col w-full items-center gap-5"> 
            {/* Message box — always rendered */}
            <ExcusePanel excuse={excuse} isSpinning={isSpinning} />

            {/* Row 2: NY + KOPIER */}
            <div className="flex w-full gap-4">
              <motion.button
                type="button"
                onClick={handleReroll}
                disabled={isSpinning || excuse === null}
                whileTap={{ scale: isSpinning || excuse === null ? 1 : 0.95 }}
                whileHover={{ scale: isSpinning || excuse === null ? 1 : 1.05 }}
                className="flex-1 rounded-3xl font-display text-xl font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-reel-accent px-4 py-2"
                style={{
                  background: 'radial-gradient(circle at 38% 30%, #c084fc, #7c3aed 45%, #4c1d95)',
                  boxShadow: sharedButtonBox,
                  cursor: isSpinning || excuse === null ? 'not-allowed' : 'pointer',
                  opacity: isSpinning || excuse === null ? 0.45 : 1,
                  transition: 'opacity 0.2s, box-shadow 0.2s',
                }}
                aria-label="Ny unnskyldning med samme hjul"
              >
                NY
              </motion.button>

              <motion.button
                type="button"
                onClick={handleCopy}
                disabled={isSpinning || excuse === null}
                whileTap={{ scale: isSpinning || excuse === null ? 1 : 0.95 }}
                whileHover={{ scale: isSpinning || excuse === null ? 1 : 1.05 }}
                aria-label={copied ? 'Kopiert!' : 'Kopier unnskyldningen'}
                className="flex-1 rounded-3xl font-display text-xl font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-reel-accent px-4 py-2"
                style={{
                  background: 'radial-gradient(circle at 38% 30%, #ffe484, #c9860a 45%, #6b4200)',
                  boxShadow: sharedButtonBox,
                  cursor: isSpinning || excuse === null ? 'not-allowed' : 'pointer',
                  opacity: isSpinning || excuse === null ? 0.45 : 1,
                  transition: 'opacity 0.2s, box-shadow 0.2s',
                }}
              >
                {copied ? 'KOPIERT!' : 'KOPIER'}
              </motion.button>
            </div>
        </div>
    </div>
  )
}

/** Message box — always rendered. Shows placeholder/spinner state when no excuse is ready. */
function ExcusePanel({ excuse, isSpinning }: { excuse: string | null; isSpinning: boolean }) {
  return (
    <div
      className="flex w-full flex-col items-center justify-center rounded-3xl bg-reel-bg px-6 py-6 ring-1 ring-white/10"
      style={{ minHeight: '6rem' }}
      role="region"
      aria-label="Din unnskyldning"
    >
      <AnimatePresence mode="wait">
        {excuse !== null ? (
          // Excuse present — stamp in with scale + opacity pop then settle
          <motion.p
            key={excuse}
            className="text-center text-lg font-medium text-white sm:text-xl"
            aria-live="polite"
            initial={{ opacity: 0, scale: 0.72, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            transition={{
              opacity: { duration: 0.18 },
              scale: { type: 'spring', stiffness: 420, damping: 22 },
              y: { type: 'spring', stiffness: 420, damping: 22 },
            }}
          >
            {excuse}
          </motion.p>
        ) : isSpinning ? (
          // Spinning — three pulsing dots
          <motion.span
            key="spinning"
            aria-label="Spinner…"
            aria-live="polite"
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="block h-2.5 w-2.5 rounded-full bg-white/40"
                animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.2, 0.8] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay: i * 0.18,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.span>
        ) : (
          // Idle before first spin
          <motion.p
            key="idle"
            className="text-center text-base italic text-white/35"
            aria-live="polite"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            Trykk SPINN for å få en unnskyldning
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
