// EditCategoryForm - Story 2.5
// Form for editing an existing category (only for draft status)

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
import { updateCategorySchema, type UpdateCategoryInput } from '../types/category.schemas';
import { useUpdateCategory } from '../hooks/useUpdateCategory';
import type { Category } from '../types/category.types';
import { formatDateInTimezone, extractTimeFromDate, combineDateAndTime, getTimezoneDisplayLabel } from '@/lib/dateUtils';

interface EditCategoryFormProps {
  category: Category;
  contestId: string;
  contestTimezone: string;
  onSuccess?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  /** When true, all fields are disabled (AC3: read-only for published/closed) */
  readOnly?: boolean;
}

/**
 * Form component for editing an existing category
 * Supports read-only mode for published/closed categories (AC3)
 */
export function EditCategoryForm({ category, contestId, contestTimezone, onSuccess, onDirtyChange, readOnly = false }: EditCategoryFormProps) {
  const updateCategory = useUpdateCategory(contestId);
  const [time, setTime] = useState(() => extractTimeFromDate(category.deadline, contestTimezone));

  const form = useForm<UpdateCategoryInput>({
    resolver: zodResolver(updateCategorySchema),
    mode: 'onBlur',
    defaultValues: {
      name: category.name,
      type: category.type,
      description: category.description ?? '',
      rules: category.rules ?? '',
      deadline: category.deadline,
    },
  });

  const { isDirty } = form.formState;
  useEffect(() => {
    if (!readOnly) {
      onDirtyChange?.(isDirty);
    }
  }, [isDirty, readOnly, onDirtyChange]);

  const onSubmit = async (data: UpdateCategoryInput) => {
    try {
      // Combine date and time into UTC ISO string if deadline was provided
      const input = { ...data };
      if (data.deadline) {
        input.deadline = combineDateAndTime(data.deadline, time, contestTimezone);
      }
      await updateCategory.mutateAsync({
        categoryId: category.id,
        input,
      });
      toast.success('Category updated');
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update category');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name {!readOnly && '*'}</FormLabel>
              <FormControl>
                <Input placeholder="Best Short Film" disabled={readOnly} {...field} />
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
              <FormLabel>Submission Type {!readOnly && '*'}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={readOnly}>
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
              <FormLabel>Submission Deadline {!readOnly && '*'}</FormLabel>
              <div className="flex flex-col gap-2">
                <Popover>
                  <PopoverTrigger asChild disabled={readOnly}>
                    <FormControl>
                      <Button
                        variant="outline"
                        disabled={readOnly}
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
                    disabled={readOnly || !field.value}
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
                  disabled={readOnly}
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
                  disabled={readOnly}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!readOnly && (
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || updateCategory.isPending}
            >
              {form.formState.isSubmitting || updateCategory.isPending
                ? 'Saving...'
                : 'Save Changes'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
