import type { ComponentProps, ReactNode } from "react"
import { Toaster as Sonner, toast as sonnerToast, type ExternalToast } from "sonner"

type ToasterProps = ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:bg-green-50 group-[.toaster]:border-green-200 group-[.toaster]:text-green-800",
          error: "group-[.toaster]:bg-red-50 group-[.toaster]:border-red-200 group-[.toaster]:text-red-800",
          warning: "group-[.toaster]:bg-amber-50 group-[.toaster]:border-amber-200 group-[.toaster]:text-amber-800",
          info: "group-[.toaster]:bg-blue-50 group-[.toaster]:border-blue-200 group-[.toaster]:text-blue-800",
        },
      }}
      {...props}
    />
  )
}

/**
 * Custom toast wrapper that enforces project toast patterns:
 * - Success toasts auto-dismiss after 4 seconds (Toaster default)
 * - Error toasts require manual dismissal (duration: Infinity)
 */
const toast = Object.assign(
  // Base toast function
  (message: string | ReactNode, data?: ExternalToast) => sonnerToast(message, data),
  {
    // Success: uses default duration (4s from Toaster config)
    success: (message: string | ReactNode, data?: ExternalToast) =>
      sonnerToast.success(message, data),

    // Error: always requires manual dismissal (AC2 - cannot be bypassed by caller)
    error: (message: string | ReactNode, data?: ExternalToast) =>
      sonnerToast.error(message, { ...data, duration: Infinity }),

    // Pass through other toast types
    info: sonnerToast.info,
    warning: sonnerToast.warning,
    loading: sonnerToast.loading,
    promise: sonnerToast.promise,
    custom: sonnerToast.custom,
    message: sonnerToast.message,
    dismiss: sonnerToast.dismiss,
  }
)

export { Toaster, toast }
