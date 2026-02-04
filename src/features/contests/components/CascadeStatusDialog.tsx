import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui';

export interface CascadeStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
  categoryCount: number;
  fromCategoryStatus: 'draft' | 'published';
  toCategoryStatus: 'published' | 'closed';
}

export function CascadeStatusDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  isPending,
  categoryCount,
  fromCategoryStatus,
  toCategoryStatus,
}: CascadeStatusDialogProps) {
  const plural = categoryCount === 1 ? 'category is' : 'categories are';
  const pronoun = categoryCount === 1 ? 'it' : 'them';

  const description =
    fromCategoryStatus === 'draft' && toCategoryStatus === 'published'
      ? `${categoryCount} ${plural} still in draft. Would you like to publish ${pronoun} along with the contest?`
      : `${categoryCount} ${plural} still published. Would you like to close ${pronoun} along with the contest?`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Update Categories?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isPending}>
            No, Just Update Contest
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Updating...' : 'Yes, Update Categories'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
