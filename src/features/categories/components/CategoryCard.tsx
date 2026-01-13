// CategoryCard - Story 2.5
// Display a category with status badge, type badge, and actions

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Video, Camera } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  toast,
} from '@/components/ui';
import { useUpdateCategoryStatus } from '../hooks/useUpdateCategoryStatus';
import { categoriesApi } from '../api/categoriesApi';
import { EditCategoryForm } from './EditCategoryForm';
import { DeleteCategoryButton } from './DeleteCategoryButton';
import type { Category, CategoryStatus } from '../types/category.types';

interface CategoryCardProps {
  category: Category;
  contestId: string;
}

// Status badge colors
const statusColors: Record<CategoryStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  closed: 'bg-blue-100 text-blue-800',
};

// Type badge config
const typeConfig = {
  video: {
    icon: Video,
    className: 'bg-purple-100 text-purple-800',
  },
  photo: {
    icon: Camera,
    className: 'bg-orange-100 text-orange-800',
  },
};

/**
 * Card component displaying a single category
 * Includes status dropdown, edit/delete actions (draft only)
 */
export function CategoryCard({ category, contestId }: CategoryCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<CategoryStatus>(category.status);
  const updateStatus = useUpdateCategoryStatus(contestId);

  // Sync optimistic status with prop changes (per story 2-4 pattern)
  useEffect(() => {
    setOptimisticStatus(category.status);
  }, [category.status]);

  const isDraft = optimisticStatus === 'draft';
  const isEditable = isDraft;
  const deadlinePassed = new Date(category.deadline) < new Date();

  // Auto-close category if deadline passed (AC5 - client-side check)
  useEffect(() => {
    if (deadlinePassed && optimisticStatus !== 'closed') {
      handleStatusChange('closed');
    }
  // Only run on mount and when deadline/status change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlinePassed]);

  const handleStatusChange = async (newStatus: CategoryStatus) => {
    // AC4: Check submission count before allowing Draft status
    if (newStatus === 'draft') {
      try {
        const count = await categoriesApi.getSubmissionCount(category.id);
        if (count > 0) {
          toast.error('Cannot set to Draft - category has submissions');
          return;
        }
      } catch {
        // If we can't check, don't block the change
      }
    }

    // Optimistic update
    const previousStatus = optimisticStatus;
    setOptimisticStatus(newStatus);

    try {
      await updateStatus.mutateAsync({
        categoryId: category.id,
        status: newStatus,
      });
      toast.success('Status updated');
    } catch (error) {
      // Rollback on error
      setOptimisticStatus(previousStatus);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update status'
      );
    }
  };

  const TypeIcon = typeConfig[category.type].icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{category.name}</CardTitle>
          <div className="flex gap-2">
            <Badge className={typeConfig[category.type].className}>
              <TypeIcon className="h-3 w-3 mr-1" />
              {category.type}
            </Badge>
            <Badge className={statusColors[optimisticStatus]}>
              {optimisticStatus}
            </Badge>
          </div>
        </div>
        <CardDescription>
          Deadline: {format(new Date(category.deadline), 'PPP')}
          {deadlinePassed && (
            <span className="text-red-500 ml-2">(Passed)</span>
          )}
        </CardDescription>
      </CardHeader>

      {category.description && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{category.description}</p>
        </CardContent>
      )}

      <CardFooter className="flex justify-between">
        <Select
          value={optimisticStatus}
          onValueChange={(value) => handleStatusChange(value as CategoryStatus)}
          disabled={updateStatus.isPending}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              value="draft"
              disabled={!isDraft}
              title={!isDraft ? 'Cannot set to Draft - category has submissions' : undefined}
            >
              Draft
            </SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          {isEditable && (
            <>
              <Sheet open={editOpen} onOpenChange={setEditOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Edit Category</SheetTitle>
                  </SheetHeader>
                  <EditCategoryForm
                    category={category}
                    contestId={contestId}
                    onSuccess={() => setEditOpen(false)}
                  />
                </SheetContent>
              </Sheet>
              <DeleteCategoryButton
                categoryId={category.id}
                contestId={contestId}
                categoryName={category.name}
              />
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
