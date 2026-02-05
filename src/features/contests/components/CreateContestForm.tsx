import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
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
  Textarea,
  toast,
} from '@/components/ui';
import { TimezoneCombobox } from '@/components/ui/timezone-combobox';
import { createContestSchema, type CreateContestInput } from '../types/contest.schemas';
import { useCreateContest } from '../hooks/useCreateContest';

interface CreateContestFormProps {
  onSuccess?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

/**
 * Form component for creating a new contest
 * Validates with Zod schema and submits via TanStack Query mutation
 */
export function CreateContestForm({ onSuccess, onDirtyChange }: CreateContestFormProps) {
  const createContest = useCreateContest();
  const navigate = useNavigate();

  const form = useForm<CreateContestInput>({
    resolver: zodResolver(createContestSchema),
    mode: 'onBlur', // Validate on blur per UX rule
    defaultValues: {
      name: '',
      description: '',
      contestCode: '',
      rules: '',
      timezone: 'America/New_York',
    },
  });

  const { isDirty } = form.formState;
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const onSubmit = async (data: CreateContestInput) => {
    try {
      const contest = await createContest.mutateAsync(data);
      toast.success('Contest created');
      form.reset();
      onSuccess?.();
      navigate(`/admin/contests/${contest.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create contest');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contest Name *</FormLabel>
              <FormControl>
                <Input placeholder="Annual Video Contest 2026" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell participants about this contest..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contestCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contest Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="Leave blank to auto-generate"
                  maxLength={6}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                6 characters. Leave blank to auto-generate a unique code.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rules"
          render={({ field }) => (
            <FormItem>
              <FormLabel>General Rules</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Contest rules and guidelines..."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <FormControl>
                <TimezoneCombobox
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                All deadlines will be displayed in this timezone.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || createContest.isPending}
          >
            {form.formState.isSubmitting || createContest.isPending
              ? 'Creating...'
              : 'Create Contest'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
