import { render, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRef } from 'react'
import { Turnstile, type TurnstileRef } from './Turnstile'

describe('Turnstile', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRender: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockReset: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRemove: any

  beforeEach(() => {
    mockRender = vi.fn().mockReturnValue('widget-1')
    mockReset = vi.fn()
    mockRemove = vi.fn()

    window.turnstile = {
      render: mockRender,
      reset: mockReset,
      remove: mockRemove,
      getResponse: vi.fn() as unknown as TurnstileInstance['getResponse'],
    } as TurnstileInstance
  })

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).turnstile
    vi.restoreAllMocks()
  })

  it('renders nothing when window.turnstile is not available', () => {
    delete (window as unknown as Record<string, unknown>).turnstile
    const { container } = render(<Turnstile onVerify={vi.fn()} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders widget container when turnstile is available', () => {
    const { container } = render(<Turnstile onVerify={vi.fn()} />)
    expect(container.querySelector('div')).toBeTruthy()
  })

  it('calls window.turnstile.render with correct options', () => {
    const onVerify = vi.fn()
    render(<Turnstile onVerify={onVerify} />)
    expect(mockRender).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      expect.objectContaining({
        callback: onVerify,
        theme: 'light',
        size: 'flexible',
      }),
    )
  })

  it('calls window.turnstile.remove on unmount', () => {
    const { unmount } = render(<Turnstile onVerify={vi.fn()} />)
    unmount()
    expect(mockRemove).toHaveBeenCalledWith('widget-1')
  })

  it('exposes reset via imperative handle', () => {
    const ref = createRef<TurnstileRef>()
    render(<Turnstile ref={ref} onVerify={vi.fn()} />)
    act(() => {
      ref.current?.reset()
    })
    expect(mockReset).toHaveBeenCalledWith('widget-1')
  })

  it('auto-resets on expired callback and calls onExpire', () => {
    const onExpire = vi.fn()
    render(<Turnstile onVerify={vi.fn()} onExpire={onExpire} />)

    const renderOptions = mockRender.mock.calls[0][1]
    act(() => {
      renderOptions['expired-callback']()
    })

    expect(mockReset).toHaveBeenCalledWith('widget-1')
    expect(onExpire).toHaveBeenCalled()
  })

  it('calls onError callback on error', () => {
    const onError = vi.fn()
    render(<Turnstile onVerify={vi.fn()} onError={onError} />)

    const renderOptions = mockRender.mock.calls[0][1]
    act(() => {
      renderOptions['error-callback']()
    })

    expect(onError).toHaveBeenCalled()
  })

  it('renders widget after script loads asynchronously', () => {
    vi.useFakeTimers()
    delete (window as unknown as Record<string, unknown>).turnstile

    const onVerify = vi.fn()
    const { container } = render(<Turnstile onVerify={onVerify} />)

    // Initially renders nothing
    expect(container.innerHTML).toBe('')
    expect(mockRender).not.toHaveBeenCalled()

    // Simulate script loading
    window.turnstile = {
      render: mockRender,
      reset: mockReset,
      remove: mockRemove,
      getResponse: vi.fn() as unknown as TurnstileInstance['getResponse'],
    } as TurnstileInstance

    // Advance timer to trigger poll
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Now widget should render
    expect(container.querySelector('div')).toBeTruthy()
    expect(mockRender).toHaveBeenCalled()

    vi.useRealTimers()
  })
})
