import { useEffect, useRef } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import type { SpinState } from '../lib/useSpin'

interface ReelProps {
  /** All items available on this reel */
  items: string[]
  /** Index the reel must land on */
  targetIndex: number
  spinState: SpinState
  onSettled: () => void
  /** Accessible label e.g. "Aktivitet" */
  label: string
  /** How long (ms) the full spin animation runs before it settles */
  durationMs: number
}

/** Height of each reel cell in pixels */
export const CELL_HEIGHT = 72

/** Visible viewport height — shows 3 cells (previous, current, next) */
export const REEL_HEIGHT = CELL_HEIGHT * 3

/** Number of full item-list loops scrolled before landing on the target */
const SPIN_LOOPS = 2

/**
 * Reel renders a vertical strip of items. When spinning it scrolls fast at a
 * constant rate then gradually decelerates onto the target — like a real slot
 * machine reel coasting to a stop. Items are looped via a repeating strip so
 * the scroll always travels forward regardless of count.
 */
export function Reel({ items, targetIndex, spinState, onSettled, label, durationMs }: ReelProps) {
  const controls = useAnimationControls()
  const prevStateRef = useRef<SpinState>('idle')
  const settledRef = useRef(false)

  useEffect(() => {
    const prev = prevStateRef.current
    prevStateRef.current = spinState

    if (spinState === 'spinning' && prev !== 'spinning') {
      settledRef.current = false
      controls.set({ y: 0 })

      // Land several loops down, offsetting by one cell so the target sits
      // centred in the 3-cell viewport (previous item above, next below).
      const landY = -((items.length * SPIN_LOOPS + targetIndex - 1) * CELL_HEIGHT)
      const midY = landY * 0.8

      controls
        .start({
          y: [0, midY, landY],
          transition: {
            duration: durationMs / 1000,
            // 45% of the time covers 80% of the distance (fast, constant),
            // the remaining 55% crawls the last 20% (decelerating tail).
            times: [0, 0.45, 1],
            ease: ['linear', [0.1, 0.6, 0.1, 1]],
          },
        })
        .then(() => {
          if (!settledRef.current) {
            settledRef.current = true
            onSettled()
          }
        })
    }

    if (spinState === 'idle' && prev !== 'idle') {
      controls.set({ y: -((items.length + targetIndex - 1) * CELL_HEIGHT) })
    }
  }, [spinState, targetIndex, controls, items.length, onSettled, durationMs])

  // Repeating strip: enough copies to cover the deepest landing position.
  // 5 copies so the centered landing offset never underflows the strip
  const strip = [...items, ...items, ...items, ...items, ...items]

  return (
    <div
      role="img"
      aria-label={`${label}: ${spinState === 'settled' || spinState === 'idle' ? items[targetIndex] : 'spinner'}`}
      aria-live="polite"
      aria-atomic="true"
      className="relative w-56 sm:w-72 overflow-hidden"
      style={{ height: REEL_HEIGHT }}
    >
      {/* Gradient overlays fade top/bottom cell so center item stands out */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/30 to-transparent"
        style={{ height: CELL_HEIGHT }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/30 to-transparent"
        style={{ height: CELL_HEIGHT }}
      />

      <motion.div
        animate={controls}
        className="will-change-transform"
        style={{ y: -((items.length + targetIndex - 1) * CELL_HEIGHT) }}
      >
        {strip.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-center px-3 text-center leading-tight break-words hyphens-auto bg-white text-gray-900 font-display font-semibold text-xl sm:text-2xl select-none"
            style={{ height: CELL_HEIGHT }}
          >
            {/* Capitalise for display even though data is lowercase */}
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </div>
        ))}
      </motion.div>
    </div>
  )
}
