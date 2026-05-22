/**
 * ExcuseDisplay is kept as a standalone component for cases where it needs to
 * be rendered outside SlotMachine (e.g. in tests or a share page).
 * SlotMachine uses the inline ExcusePanel for co-location; this export is the
 * canonical, fully standalone version.
 */
import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface ExcuseDisplayProps {
  excuse: string
}

export function ExcuseDisplay({ excuse }: ExcuseDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(excuse)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available — no-op
    }
  }, [excuse])

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      aria-label="Din unnskyldning"
      className="flex w-full max-w-xl flex-col items-center gap-4 rounded-2xl bg-reel-highlight px-6 py-6 shadow-xl ring-1 ring-white/10"
    >
      <p className="text-center text-lg font-medium text-white sm:text-xl" aria-live="polite">
        {excuse}
      </p>

      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Kopiert!' : 'Kopier unnskyldningen til utklippstavlen'}
        className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {copied ? 'Kopiert!' : 'Kopier'}
      </button>
    </motion.section>
  )
}
