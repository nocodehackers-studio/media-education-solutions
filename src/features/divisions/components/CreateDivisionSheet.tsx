// CreateDivisionSheet - Story 2.9
// Sheet form for creating a new division

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  toast,
} from '@/components/ui';
import { createDivisionSchema, type CreateDivisionInput } from '../types/division.schemas';
import { useCreateDivision } from '../hooks/useCreateDivision';

interface CreateDivisionSheetProps {
  contestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Sheet component with form for creating a new division
 * Validates with Zod schema and submits via TanStack Query mutation
 */
export function CreateDivisionSheet({
  contestId,
  open,
  onOpenChange,
}: CreateDivisionSheetProps) {
  const createDivision = useCreateDivision();

  const form = useForm<CreateDivisionInput>({
    resolver: zodResolver(createDivisionSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (data: CreateDivisionInput) => {
    try {
      await createDivision.mutateAsync({
        contestId,
        input: data,
      });
      toast.success('Division created');
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create division'
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create Division</SheetTitle>
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
                    <Input placeholder="e.g., High School, Teachers" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || createDivision.isPending}
              >
                {form.formState.isSubmitting || createDivision.isPending
                  ? 'Creating...'
                  : 'Create Division'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
