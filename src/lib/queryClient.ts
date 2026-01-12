import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Don't refetch on window focus in development
      refetchOnWindowFocus: import.meta.env.PROD,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
})
