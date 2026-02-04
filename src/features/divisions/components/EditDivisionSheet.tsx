// EditDivisionSheet - Story 2.9
// Sheet form for editing a division

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  toast,
} from '@/components/ui';
import { useConfirmClose } from '@/hooks/useConfirmClose';
import { updateDivisionSchema, type UpdateDivisionInput } from '../types/division.schemas';
import { useUpdateDivision } from '../hooks/useUpdateDivision';
import { useDeleteDivision } from '../hooks/useDeleteDivision';
import type { Division } from '../types/division.types';

interface EditDivisionSheetProps {
  division: Division;
  contestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOnlyDivision?: boolean;
}

/**
 * Sheet component with form for editing a division
 * Pre-fills form with existing data
 */
export function EditDivisionSheet({
  division,
  contestId,
  open,
  onOpenChange,
  isOnlyDivision = false,
}: EditDivisionSheetProps) {
  const updateDivision = useUpdateDivision();
  const deleteDivision = useDeleteDivision();

  const handleDeleteDivision = async () => {
    try {
      await deleteDivision.mutateAsync({ divisionId: division.id, contestId });
      toast.success('Division deleted');
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete division'
      );
    }
  };

  const form = useForm<UpdateDivisionInput>({
    resolver: zodResolver(updateDivisionSchema),
    mode: 'onBlur',
    defaultValues: {
      name: division.name,
      displayOrder: division.displayOrder,
    },
  });

  // Reset form when division changes
  useEffect(() => {
    form.reset({
      name: division.name,
      displayOrder: division.displayOrder,
    });
  }, [division, form]);

  const { guardClose, confirmDialog } = useConfirmClose({
    isDirty: form.formState.isDirty,
    onConfirmDiscard: () => form.reset({
      name: division.name,
      displayOrder: division.displayOrder,
    }),
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      guardClose(() => onOpenChange(false));
    } else {
      onOpenChange(true);
    }
  };

  const onSubmit = async (data: UpdateDivisionInput) => {
    try {
      await updateDivision.mutateAsync({
        divisionId: division.id,
        contestId,
        input: data,
      });
      toast.success('Division updated');
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update division'
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Division</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Division Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Lower numbers appear first in the list
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || updateDivision.isPending}
              >
                {form.formState.isSubmitting || updateDivision.isPending
                  ? 'Saving...'
                  : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
        <Separator className="my-6" />
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isOnlyDivision}
              >
                Delete Division
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete &ldquo;{division.name}&rdquo;?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this division and all its categories. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteDivision}
                  disabled={deleteDivision.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteDivision.isPending ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {isOnlyDivision && (
            <p className="text-xs text-muted-foreground">
              Cannot delete the only division in the contest.
            </p>
          )}
        </div>
      </SheetContent>
      {confirmDialog}
    </Sheet>
  );
}
