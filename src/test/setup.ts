import '@testing-library/jest-dom'

// Mock Supabase environment variables for tests
// These are test-only values - actual values come from .env in dev/prod
import.meta.env.VITE_SUPABASE_URL = 'https://test-project.supabase.co'
import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key-for-unit-tests'

// Mock matchMedia for components that use media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock pointer capture methods for Radix UI components
// These methods don't exist in jsdom but are used by Radix Select
Element.prototype.hasPointerCapture = () => false
Element.prototype.setPointerCapture = () => {}
Element.prototype.releasePointerCapture = () => {}

// Mock scrollIntoView for Radix UI Select
Element.prototype.scrollIntoView = () => {}
