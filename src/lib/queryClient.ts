import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 30 seconds before considered stale
      staleTime: 30_000,
      // Retry failed requests 3 times
      retry: 3,
      // Disable aggressive refetching globally to prevent input focus spam
      // AC5.1/AC5.2: Clicking inputs should NOT trigger network requests
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
})
