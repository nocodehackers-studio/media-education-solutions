import { useMemo } from 'react'
import { useLocation, useParams } from 'react-router-dom'

interface BreadcrumbItem {
  label: string
  href: string
  isLast: boolean
}

interface BreadcrumbConfig {
  label: string
  parent?: string
}

/** Breadcrumb configuration for admin routes */
const breadcrumbConfig: Record<string, BreadcrumbConfig> = {
  '/admin/dashboard': { label: 'Dashboard' },
  '/admin/contests': { label: 'Contests' },
  '/admin/contests/:id': { label: 'Contest Details', parent: '/admin/contests' },
  '/admin/contests/:id/categories': { label: 'Categories', parent: '/admin/contests/:id' },
}

/**
 * Hook for generating breadcrumb items based on current route.
 * Returns an array of breadcrumb items for the current path.
 */
export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation()
  const params = useParams()
  const pathname = location.pathname

  const breadcrumbs = useMemo(() => {
    // Find matching config by checking exact match first, then patterns
    let matchedPath = pathname
    let config = breadcrumbConfig[pathname]

    // If no exact match, try pattern matching
    if (!config) {
      for (const [pattern, patternConfig] of Object.entries(breadcrumbConfig)) {
        if (pattern.includes(':')) {
          // Convert pattern to regex
          const regexPattern = pattern.replace(/:[\w]+/g, '[^/]+')
          const regex = new RegExp(`^${regexPattern}$`)
          if (regex.test(pathname)) {
            matchedPath = pattern
            config = patternConfig
            break
          }
        }
      }
    }

    if (!config) {
      return []
    }

    // Build breadcrumb trail
    const trail: BreadcrumbItem[] = []
    let current: BreadcrumbConfig | undefined = config
    let currentPath = matchedPath

    while (current) {
      // Resolve actual path by replacing params
      let actualPath = currentPath
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value) {
            actualPath = actualPath.replace(`:${key}`, value)
          }
        }
      }

      trail.unshift({
        label: current.label,
        href: actualPath,
        isLast: currentPath === matchedPath,
      })

      if (current.parent) {
        currentPath = current.parent
        current = breadcrumbConfig[currentPath]
      } else {
        break
      }
    }

    return trail
  }, [pathname, params])

  return breadcrumbs
}
