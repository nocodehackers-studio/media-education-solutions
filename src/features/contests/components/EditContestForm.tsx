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
  Textarea,
  toast,
} from '@/components/ui';
import { updateContestSchema, type UpdateContestInput } from '../types/contest.schemas';
import { useUpdateContest } from '../hooks/useUpdateContest';
import type { Contest } from '../types/contest.types';

interface EditContestFormProps {
  contest: Contest;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Form component for editing an existing contest
 * Validates with Zod schema and submits via TanStack Query mutation
 */
export function EditContestForm({ contest, onSuccess, onCancel }: EditContestFormProps) {
  const updateContest = useUpdateContest(contest.id);

  const form = useForm<UpdateContestInput>({
    resolver: zodResolver(updateContestSchema),
    mode: 'onBlur',
    defaultValues: {
      name: contest.name,
      description: contest.description || '',
      rules: contest.rules || '',
      notifyTlc: contest.notifyTlc,
    },
  });

  const onSubmit = async (data: UpdateContestInput) => {
    try {
      await updateContest.mutateAsync(data);
      toast.success('Contest updated');
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update contest');
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

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || updateContest.isPending}
          >
            {form.formState.isSubmitting || updateContest.isPending
              ? 'Saving...'
              : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
