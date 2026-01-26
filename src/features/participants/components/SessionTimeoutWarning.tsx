import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui'

interface SessionTimeoutWarningProps {
  open: boolean
  onExtend: () => void
  onLogout: () => void
}

/**
 * Modal warning displayed 5 minutes before session expiry.
 * Allows user to extend session or log out.
 */
export function SessionTimeoutWarning({
  open,
  onExtend,
  onLogout,
}: SessionTimeoutWarningProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in less than 5 minutes due to inactivity.
            Would you like to stay signed in?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onLogout}>Log Out</AlertDialogCancel>
          <AlertDialogAction onClick={onExtend}>Stay Signed In</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
