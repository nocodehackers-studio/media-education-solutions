import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Hook for managing sidebar open/close state.
 * Automatically closes sidebar on route change.
 */
export function useSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const previousPathRef = useRef(location.pathname)

  // Close sidebar on route change using ref comparison
  useEffect(() => {
    if (previousPathRef.current !== location.pathname) {
      previousPathRef.current = location.pathname
      // Schedule state update for next tick to avoid synchronous setState in effect
      queueMicrotask(() => setIsOpen(false))
    }
  }, [location.pathname])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  return {
    isOpen,
    setIsOpen,
    open,
    close,
    toggle,
  }
}
