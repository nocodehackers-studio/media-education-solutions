import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react'

export interface TurnstileRef {
  reset: () => void
}

interface TurnstileProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: () => void
}

export const Turnstile = forwardRef<TurnstileRef, TurnstileProps>(
  function Turnstile({ onVerify, onExpire, onError }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)
    const [scriptReady, setScriptReady] = useState(!!window.turnstile)

    const reset = useCallback(() => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current)
      }
    }, [])

    useImperativeHandle(ref, () => ({ reset }), [reset])

    // Poll for Turnstile script load (handles async script loading)
    useEffect(() => {
      if (scriptReady) return
      const interval = setInterval(() => {
        if (window.turnstile) {
          setScriptReady(true)
          clearInterval(interval)
        }
      }, 100)
      return () => clearInterval(interval)
    }, [scriptReady])

    // Render widget once script is loaded
    useEffect(() => {
      if (!scriptReady || !containerRef.current || !window.turnstile) return

      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
        callback: onVerify,
        'expired-callback': () => {
          // Auto-reset widget so user gets a fresh token
          if (widgetIdRef.current && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current)
          }
          onExpire?.()
        },
        'error-callback': onError,
        theme: 'auto',
      })

      widgetIdRef.current = widgetId

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scriptReady])

    if (!scriptReady) return null

    return <div ref={containerRef} />
  },
)
