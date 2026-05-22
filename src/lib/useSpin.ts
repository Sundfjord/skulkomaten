import { useState, useCallback, useRef } from 'react'

export type SpinState = 'idle' | 'spinning' | 'settled'

export interface UseSpinOptions {
  /** Total number of items in this reel */
  count: number
  /** How long (ms) this reel spins before stopping. Activity reel is shorter. */
  duration: number
}

export interface UseSpinResult {
  /** Index the reel should land on */
  targetIndex: number
  state: SpinState
  /** Call to trigger a new spin */
  spin: () => void
  /** Called by the Reel animation when it finishes */
  onSettled: () => void
}

export function useSpin({ count, duration }: UseSpinOptions): UseSpinResult {
  const [targetIndex, setTargetIndex] = useState(0)
  const [state, setState] = useState<SpinState>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const spin = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    const newTarget = Math.floor(Math.random() * count)
    setTargetIndex(newTarget)
    setState('spinning')

    timerRef.current = setTimeout(() => {
      setState('settled')
    }, duration)
  }, [count, duration])

  const onSettled = useCallback(() => {
    setState((prev) => (prev === 'spinning' ? 'settled' : prev))
  }, [])

  return { targetIndex, state, spin, onSettled }
}
