import { useNavigate } from 'react-router-dom';
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
import { useDeleteContest } from '../hooks/useDeleteContest';

interface DeleteContestButtonProps {
  contestId: string;
}

/**
 * Delete button with confirmation dialog
 * Shows warning about cascading deletions before confirming
 */
export function DeleteContestButton({ contestId }: DeleteContestButtonProps) {
  const navigate = useNavigate();
  const deleteContest = useDeleteContest();

  const handleDelete = async () => {
    try {
      await deleteContest.mutateAsync(contestId);
      toast.success('Contest deleted');
      navigate('/admin/contests');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete contest'
      );
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          data-testid="delete-contest-button"
        >
          Delete Contest
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete all categories, submissions, and codes. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteContest.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteContest.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
