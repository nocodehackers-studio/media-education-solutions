import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, X, RefreshCw } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from '@/components/ui';
import { TIMEZONE_OPTIONS, getTimezoneOffsetLabel } from '@/lib/dateUtils';
import { updateContestSchema, type UpdateContestInput } from '../types/contest.schemas';
import { useUpdateContest } from '../hooks/useUpdateContest';
import { useUploadCoverImage, useDeleteCoverImage, useUploadLogo, useDeleteLogo } from '../hooks/useContestCoverImage';
import type { Contest } from '../types/contest.types';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
  const uploadCover = useUploadCoverImage(contest.id);
  const deleteCover = useDeleteCoverImage(contest.id);
  const uploadLogo = useUploadLogo(contest.id);
  const deleteLogo = useDeleteLogo(contest.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UpdateContestInput>({
    resolver: zodResolver(updateContestSchema),
    mode: 'onBlur',
    defaultValues: {
      name: contest.name,
      description: contest.description || '',
      rules: contest.rules || '',
      notifyTlc: contest.notifyTlc,
      timezone: contest.timezone,
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Client-side validation
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please use JPG, PNG, WebP, or GIF.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    try {
      await uploadCover.mutateAsync(file);
      toast.success('Cover image uploaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload cover image');
    }
  };

  const handleRemoveCover = async () => {
    try {
      await deleteCover.mutateAsync();
      toast.success('Cover image removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove cover image');
    }
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please use JPG, PNG, WebP, or GIF.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    try {
      await uploadLogo.mutateAsync(file);
      toast.success('Logo uploaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload logo');
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await deleteLogo.mutateAsync();
      toast.success('Logo removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove logo');
    }
  };

  const isCoverLoading = uploadCover.isPending || deleteCover.isPending;
  const isLogoLoading = uploadLogo.isPending || deleteLogo.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Cover Image Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Cover Image</label>
          {contest.coverImageUrl ? (
            <div className="relative rounded-lg overflow-hidden border">
              <img
                src={contest.coverImageUrl}
                alt=""
                className="w-full h-40 object-cover"
              />
              <div className="absolute bottom-2 right-2 flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={isCoverLoading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Replace
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={isCoverLoading}
                  onClick={handleRemoveCover}
                >
                  <X className="h-3 w-3 mr-1" />
                  Remove
                </Button>
              </div>
              {isCoverLoading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              disabled={isCoverLoading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCoverLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span className="text-sm">Click to upload cover image</span>
                  <span className="text-xs">JPG, PNG, WebP, GIF. Max 5MB.</span>
                </>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Logo Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Logo</label>
          {contest.logoUrl ? (
            <div className="flex items-center gap-3">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border shrink-0">
                <img
                  src={contest.logoUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {isLogoLoading && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={isLogoLoading}
                  onClick={() => logoInputRef.current?.click()}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Replace
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={isLogoLoading}
                  onClick={handleRemoveLogo}
                >
                  <X className="h-3 w-3 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={isLogoLoading}
              onClick={() => logoInputRef.current?.click()}
              className="w-20 h-20 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLogoLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
            </button>
          )}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleLogoSelect}
          />
        </div>

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

        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label} ({getTimezoneOffsetLabel(tz.value)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                All deadlines will be displayed in this timezone.
              </FormDescription>
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
