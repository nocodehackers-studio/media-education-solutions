import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contestsApi } from '../api/contestsApi';

/**
 * Mutation hook for uploading a contest cover image.
 * Invalidates contest queries on success so UI reflects the new image.
 */
export function useUploadCoverImage(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => contestsApi.uploadCoverImage(contestId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      queryClient.invalidateQueries({ queryKey: ['contest', contestId] });
    },
  });
}

/**
 * Mutation hook for deleting a contest cover image.
 * Invalidates contest queries on success so UI reflects the removal.
 */
export function useDeleteCoverImage(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => contestsApi.deleteCoverImage(contestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      queryClient.invalidateQueries({ queryKey: ['contest', contestId] });
    },
  });
}
