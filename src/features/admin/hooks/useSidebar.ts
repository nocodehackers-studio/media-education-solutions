import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Hook for managing sidebar open/close state.
 * Automatically closes sidebar on route change.
 */
export function useSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false)
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
