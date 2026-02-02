// DuplicateCategoryDialog - Story 2.9
// Dialog for duplicating a category to one or more divisions

import { useState } from 'react';
import { Copy } from 'lucide-react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  toast,
} from '@/components/ui';
import { useDivisions } from '../hooks/useDivisions';
import { useDuplicateCategory } from '../hooks/useDuplicateCategory';
import { useConfirmClose } from '@/hooks/useConfirmClose';

interface DuplicateCategoryDialogProps {
  categoryId: string;
  categoryName: string;
  contestId: string;
  currentDivisionId: string;
}

/**
 * Dialog for selecting target divisions to duplicate a category to
 * Allows multi-select of divisions (excludes current division)
 */
export function DuplicateCategoryDialog({
  categoryId,
  categoryName,
  contestId,
  currentDivisionId,
}: DuplicateCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const { data: divisions } = useDivisions(contestId);
  const duplicateCategory = useDuplicateCategory();

  const { guardClose, confirmDialog } = useConfirmClose({
    isDirty: selectedDivisions.length > 0,
    onConfirmDiscard: () => setSelectedDivisions([]),
  });

  // Filter out the current division
  const availableDivisions = divisions?.filter(
    (d) => d.id !== currentDivisionId
  ) ?? [];

  const toggleDivision = (divisionId: string) => {
    setSelectedDivisions((prev) =>
      prev.includes(divisionId)
        ? prev.filter((id) => id !== divisionId)
        : [...prev, divisionId]
    );
  };

  const handleDuplicate = async () => {
    if (selectedDivisions.length === 0) {
      toast.error('Please select at least one division');
      return;
    }

    try {
      const count = await duplicateCategory.mutateAsync({
        categoryId,
        targetDivisionIds: selectedDivisions,
        contestId,
      });
      toast.success(`Category duplicated to ${count} division${count === 1 ? '' : 's'}`);
      setSelectedDivisions([]);
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to duplicate category'
      );
    }
  };

  // Don't show button if there are no other divisions
  if (availableDivisions.length === 0) {
    return null;
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      guardClose(() => {
        setSelectedDivisions([]);
        setOpen(false);
      });
    } else {
      setOpen(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Copy className="h-4 w-4 mr-1" />
          Duplicate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate "{categoryName}"</DialogTitle>
          <DialogDescription>
            Select the divisions to duplicate this category to. A new copy will
            be created in each selected division with "Draft" status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {availableDivisions.map((division) => (
            <div key={division.id} className="flex items-center space-x-3">
              <Checkbox
                id={`division-${division.id}`}
                checked={selectedDivisions.includes(division.id)}
                onCheckedChange={() => toggleDivision(division.id)}
              />
              <Label
                htmlFor={`division-${division.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {division.name}
              </Label>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDuplicate}
            disabled={
              selectedDivisions.length === 0 || duplicateCategory.isPending
            }
          >
            {duplicateCategory.isPending
              ? 'Duplicating...'
              : `Duplicate to ${selectedDivisions.length} division${selectedDivisions.length === 1 ? '' : 's'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
      {confirmDialog}
    </Dialog>
  );
}
