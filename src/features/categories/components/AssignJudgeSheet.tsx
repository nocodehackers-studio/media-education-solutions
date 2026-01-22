// Story 3-1: AssignJudgeSheet component
// Sheet with email input form for assigning a judge to a category

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus } from 'lucide-react';
import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  toast,
} from '@/components/ui';
import { useAssignJudge } from '../hooks/useAssignJudge';

// Validation schema for judge email
const assignJudgeSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type AssignJudgeInput = z.infer<typeof assignJudgeSchema>;

interface AssignJudgeSheetProps {
  categoryId: string;
  categoryName: string;
}

/**
 * Sheet component for assigning a judge to a category
 * AC1: Opens sheet with email input when "Assign Judge" clicked
 * AC2: Creates new judge profile if email not in system
 * AC3: Assigns existing judge if email exists as judge
 */
export function AssignJudgeSheet({
  categoryId,
  categoryName,
}: AssignJudgeSheetProps) {
  const [open, setOpen] = useState(false);
  const assignJudge = useAssignJudge();

  const form = useForm<AssignJudgeInput>({
    resolver: zodResolver(assignJudgeSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
    },
  });

  // Reset form when sheet closes (handles Cancel and outside clicks)
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    setOpen(newOpen);
  };

  const onSubmit = async (data: AssignJudgeInput) => {
    try {
      const result = await assignJudge.mutateAsync({
        categoryId,
        email: data.email,
      });

      // AC2: New judge - show invite message
      // AC3: Existing judge - show simple success
      if (result.isNewJudge) {
        toast.success('Judge assigned - invite will be sent when category closes');
      } else {
        toast.success('Judge assigned');
      }

      handleOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to assign judge'
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Assign Judge
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Assign Judge</SheetTitle>
          <SheetDescription>
            Assign a judge to review submissions for "{categoryName}". Enter
            their email address below.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judge Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="judge@example.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    If this email is not in our system, a new judge account will
                    be created.
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
                disabled={form.formState.isSubmitting || assignJudge.isPending}
              >
                {form.formState.isSubmitting || assignJudge.isPending
                  ? 'Assigning...'
                  : 'Assign'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
