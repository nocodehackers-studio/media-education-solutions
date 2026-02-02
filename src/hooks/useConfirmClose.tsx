import { useState, useCallback, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UseConfirmCloseOptions {
  isDirty: boolean;
  onConfirmDiscard?: () => void;
}

/**
 * Guards sheet/dialog close when a form has unsaved changes.
 *
 * Returns `guardClose(proceedFn)` — call it instead of closing directly.
 * If dirty, an AlertDialog is shown; if clean, `proceedFn` fires immediately.
 *
 * Render `confirmDialog` as a sibling of the Sheet/Dialog.
 */
export function useConfirmClose({ isDirty, onConfirmDiscard }: UseConfirmCloseOptions) {
  const [showConfirm, setShowConfirm] = useState(false);
  const pendingCloseRef = useRef<(() => void) | null>(null);

  const guardClose = useCallback(
    (proceedWithClose: () => void) => {
      if (isDirty) {
        pendingCloseRef.current = proceedWithClose;
        setShowConfirm(true);
      } else {
        proceedWithClose();
      }
    },
    [isDirty],
  );

  const handleDiscard = useCallback(() => {
    setShowConfirm(false);
    onConfirmDiscard?.();
    pendingCloseRef.current?.();
    pendingCloseRef.current = null;
  }, [onConfirmDiscard]);

  const handleKeepEditing = useCallback(() => {
    setShowConfirm(false);
    pendingCloseRef.current = null;
  }, []);

  const confirmDialog = (
    <AlertDialog open={showConfirm} onOpenChange={(open) => !open && handleKeepEditing()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes that will be lost if you close this form.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleKeepEditing}>Keep Editing</AlertDialogCancel>
          <AlertDialogAction onClick={handleDiscard}>Discard</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { guardClose, confirmDialog };
}
