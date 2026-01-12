/**
 * Example Query Hook Pattern (AC4)
 * Demonstrates TanStack Query states: isLoading, isFetching, error
 *
 * This file provides reusable patterns for TanStack Query usage.
 * Copy and adapt these patterns for your specific use cases.
 */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib'

/**
 * Profile data from the profiles table
 */
interface Profile {
  id: string
  email: string
  role: 'admin' | 'judge'
  firstName: string | null
  lastName: string | null
  createdAt: string
}

/**
 * Example query hook demonstrating TanStack Query patterns.
 * Uses the profiles table as a real-world example.
 *
 * Usage in component:
 * ```tsx
 * function ProfileList() {
 *   const { data, isLoading, isFetching, error } = useProfiles();
 *
 *   // isLoading: true on initial load (no cached data)
 *   if (isLoading) return <Skeleton className="h-20 w-full" />;
 *
 *   // error: Error object if the query failed
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return (
 *     <div>
 *       {/* isFetching: true when refetching in background *}
 *       {isFetching && <span>Refreshing...</span>}
 *       {data?.map(profile => <div key={profile.id}>{profile.email}</div>)}
 *     </div>
 *   );
 * }
 * ```
 *
 * States explained:
 * - isLoading: true on initial load (no cached data)
 * - isFetching: true whenever a request is in-flight (including refetches)
 * - error: Error object if the query failed
 */
// Row type from Supabase database
type ProfileRow = {
  id: string
  email: string
  role: 'admin' | 'judge'
  first_name: string | null
  last_name: string | null
  created_at: string
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, first_name, last_name, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      // Type assertion needed due to Supabase generics limitation
      const rows = (data ?? []) as ProfileRow[]

      // Transform snake_case to camelCase (per project conventions)
      return rows.map((item) => ({
        id: item.id,
        email: item.email,
        role: item.role,
        firstName: item.first_name,
        lastName: item.last_name,
        createdAt: item.created_at,
      }))
    },
    // Optional: configure stale time (5 minutes)
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Example of using the query with a parameter (single item fetch).
 * Demonstrates the `enabled` option for conditional queries.
 */
export function useProfileById(id: string | undefined) {
  return useQuery({
    queryKey: ['profiles', id],
    queryFn: async (): Promise<Profile | null> => {
      if (!id) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, first_name, last_name, created_at')
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Type assertion needed due to Supabase generics limitation
      const row = data as ProfileRow | null

      return row
        ? {
            id: row.id,
            email: row.email,
            role: row.role,
            firstName: row.first_name,
            lastName: row.last_name,
            createdAt: row.created_at,
          }
        : null
    },
    enabled: !!id, // Only run query if id is provided
  })
}
