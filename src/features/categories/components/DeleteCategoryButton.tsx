// DeleteCategoryButton - Story 2.5
// Delete button with confirmation dialog for categories

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  toast,
} from '@/components/ui';
import { useDeleteCategory } from '../hooks/useDeleteCategory';

interface DeleteCategoryButtonProps {
  categoryId: string;
  contestId: string;
  categoryName: string;
}

/**
 * Delete button with confirmation dialog
 * Only shown for draft categories
 */
export function DeleteCategoryButton({
  categoryId,
  contestId,
  categoryName,
}: DeleteCategoryButtonProps) {
  const deleteCategory = useDeleteCategory(contestId);

  const handleDelete = async () => {
    try {
      await deleteCategory.mutateAsync(categoryId);
      toast.success('Category deleted');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete category'
      );
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          data-testid="delete-category-button"
        >
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{categoryName}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this category. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteCategory.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteCategory.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
