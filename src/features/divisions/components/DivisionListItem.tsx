// DivisionListItem - Story 2.9
// Display a single division with edit/delete actions

import { useState } from 'react';
import { Pencil, Trash2, FolderOpen } from 'lucide-react';
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
  Badge,
  Button,
  toast,
} from '@/components/ui';
import { useDeleteDivision } from '../hooks/useDeleteDivision';
import { EditDivisionSheet } from './EditDivisionSheet';
import type { Division } from '../types/division.types';

interface DivisionListItemProps {
  division: Division;
  contestId: string;
  isOnlyDivision: boolean;
}

/**
 * List item component displaying a single division
 * Includes edit/delete actions with delete confirmation
 */
export function DivisionListItem({
  division,
  contestId,
  isOnlyDivision,
}: DivisionListItemProps) {
  const [editOpen, setEditOpen] = useState(false);
  const deleteDivision = useDeleteDivision();

  // AC5: Show error toast if trying to delete the only division
  const handleDeleteOnlyDivision = () => {
    toast.error('Cannot delete the only division. A contest must have at least one division.');
  };

  const handleConfirmedDelete = async () => {
    try {
      await deleteDivision.mutateAsync({
        divisionId: division.id,
        contestId,
      });
      toast.success('Division deleted');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete division'
      );
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-medium">{division.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {division.categoryCount ?? 0} {division.categoryCount === 1 ? 'category' : 'categories'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Order: {division.displayOrder}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setEditOpen(true)}
          aria-label="Edit division"
        >
          <Pencil className="h-4 w-4" />
        </Button>

        {/* AC5: Show different behavior based on whether this is the only division */}
        {isOnlyDivision ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteOnlyDivision}
            aria-label="Delete division"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete division"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "{division.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all categories in this division. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmedDelete}
                  disabled={deleteDivision.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteDivision.isPending ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <EditDivisionSheet
        division={division}
        contestId={contestId}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
