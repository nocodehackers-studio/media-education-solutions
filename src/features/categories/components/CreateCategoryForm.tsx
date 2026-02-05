// CreateCategoryForm - Story 2.5
// Form for creating a new category within a contest

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Button,
  Calendar,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from '@/components/ui';
import { TimePicker } from '@/components/ui/time-picker';
import { createCategorySchema, type CreateCategoryInput } from '../types/category.schemas';
import { useCreateCategory } from '../hooks/useCreateCategory';
import { formatDateInTimezone, combineDateAndTime, getTimezoneDisplayLabel } from '@/lib/dateUtils';

interface CreateCategoryFormProps {
  divisionId: string;
  contestId: string;
  contestTimezone: string;
  onSuccess?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

/**
 * Form component for creating a new category
 * Story 2-9: Categories now belong to divisions
 * Validates with Zod schema and submits via TanStack Query mutation
 */
export function CreateCategoryForm({ divisionId, contestId, contestTimezone, onSuccess, onDirtyChange }: CreateCategoryFormProps) {
  const createCategory = useCreateCategory(divisionId, contestId);
  const [time, setTime] = useState('23:59');

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      type: 'video',
      description: '',
      rules: '',
      deadline: '',
    },
  });

  const { isDirty } = form.formState;
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const onSubmit = async (data: CreateCategoryInput) => {
    try {
      // Combine date and time into UTC ISO string
      const deadlineUtc = combineDateAndTime(data.deadline, time, contestTimezone);
      await createCategory.mutateAsync({ ...data, deadline: deadlineUtc });
      toast.success('Category created');
      form.reset();
      setTime('23:59');
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create category');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name *</FormLabel>
              <FormControl>
                <Input placeholder="Best Short Film" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Submission Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select submission type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="photo">Photo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Submission Deadline *</FormLabel>
              <div className="flex flex-col gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          formatDateInTimezone(field.value, contestTimezone)
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(date.toISOString());
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">at</span>
                  <TimePicker
                    value={time}
                    onChange={setTime}
                    disabled={!field.value}
                  />
                </div>
              </div>
              <FormDescription>
                Contest timezone: {getTimezoneDisplayLabel(contestTimezone)}
              </FormDescription>
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
                  placeholder="Describe what this category is about..."
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
              <FormLabel>Category Rules</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Specific rules for this category..."
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
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || createCategory.isPending}
          >
            {form.formState.isSubmitting || createCategory.isPending
              ? 'Creating...'
              : 'Create Category'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
