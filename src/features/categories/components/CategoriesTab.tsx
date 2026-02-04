// CategoriesTab - Story 2.5, updated for Story 2.9
// Main tab content for category management in ContestDetailPage
// Story 2-9: Shows categories grouped by division with collapsible sections

import { useState, useCallback } from 'react';
import { Plus, ChevronDown, ChevronRight, FolderOpen, Pencil, Trash2 } from 'lucide-react';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Skeleton,
  toast,
} from '@/components/ui';
import {
  useDivisions,
  CreateDivisionSheet,
  EditDivisionSheet,
  useDeleteDivision,
  type Division,
} from '@/features/divisions';
import { useCategoriesByDivision } from '../hooks/useCategoriesByDivision';
import { CategoryCard } from './CategoryCard';
import { CreateCategoryForm } from './CreateCategoryForm';
import type { Contest } from '@/features/contests';
import { useConfirmClose } from '@/hooks/useConfirmClose';

interface CategoriesTabProps {
  contest: Contest;
}

interface DivisionSectionProps {
  division: Division;
  contestId: string;
  canAddCategory: boolean;
  defaultOpen?: boolean;
  isOnlyDivision: boolean;
}

/**
 * Section component for a single division with its categories
 */
function DivisionSection({
  division,
  contestId,
  canAddCategory,
  defaultOpen = true,
  isOnlyDivision,
}: DivisionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [createOpen, setCreateOpen] = useState(false);
  const [editDivisionOpen, setEditDivisionOpen] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const { data: categories, isLoading } = useCategoriesByDivision(division.id);
  const deleteDivision = useDeleteDivision();

  const { guardClose, confirmDialog } = useConfirmClose({
    isDirty: isFormDirty,
    onConfirmDiscard: () => {
      setFormKey((k) => k + 1);
      setIsFormDirty(false);
    },
  });

  const handleCreateOpenChange = useCallback((open: boolean) => {
    if (!open) {
      guardClose(() => {
        setIsFormDirty(false);
        setCreateOpen(false);
      });
    } else {
      setCreateOpen(true);
    }
  }, [guardClose]);

  const handleDeleteDivision = async () => {
    try {
      await deleteDivision.mutateAsync({ divisionId: division.id, contestId });
      toast.success('Division deleted');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete division'
      );
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto hover:bg-transparent">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{division.name}</span>
            <span className="text-sm text-muted-foreground">
              ({categories?.length ?? 0} {categories?.length === 1 ? 'category' : 'categories'})
            </span>
          </Button>
        </CollapsibleTrigger>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setEditDivisionOpen(true)}
            aria-label={`Edit ${division.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                disabled={isOnlyDivision}
                aria-label={`Delete ${division.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "{division.name}"?</AlertDialogTitle>
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
          {canAddCategory && (
            <Sheet open={createOpen} onOpenChange={handleCreateOpenChange}>
              <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Create Category in {division.name}</SheetTitle>
                </SheetHeader>
                <CreateCategoryForm
                  key={formKey}
                  divisionId={division.id}
                  contestId={contestId}
                  onSuccess={() => {
                    setIsFormDirty(false);
                    setCreateOpen(false);
                  }}
                  onDirtyChange={setIsFormDirty}
                />
              </SheetContent>
              {confirmDialog}
            </Sheet>
          )}
        </div>
      </div>
      <EditDivisionSheet
        division={division}
        contestId={contestId}
        open={editDivisionOpen}
        onOpenChange={setEditDivisionOpen}
      />
      <CollapsibleContent className="space-y-2">
        {isLoading ? (
          <div className="pl-6 space-y-2">
            <Skeleton className="h-32 w-full" />
          </div>
        ) : categories?.length === 0 ? (
          <div className="pl-6 py-4 text-center">
            <p className="text-sm text-muted-foreground">
              No categories in this division.
            </p>
          </div>
        ) : (
          <div className="pl-6 space-y-2">
            {categories?.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                contestId={contestId}
              />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Tab content for managing categories within a contest
 * Story 2-9: Shows category list grouped by division with CRUD actions
 */
export function CategoriesTab({ contest }: CategoriesTabProps) {
  const { data: divisions, isLoading: divisionsLoading, error: divisionsError } = useDivisions(contest.id);
  const [createDivisionOpen, setCreateDivisionOpen] = useState(false);

  // AC1: Add Category only allowed for Draft or Published contests
  const canAddCategory =
    contest.status === 'draft' || contest.status === 'published';

  const isOnlyDivision = (divisions?.length ?? 0) <= 1;

  if (divisionsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Divisions & Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (divisionsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Divisions & Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            Failed to load divisions. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Divisions & Categories</CardTitle>
          <CardDescription>
            Manage divisions and submission categories
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {!canAddCategory && (
            <p className="text-sm text-muted-foreground">
              Cannot add categories to a closed contest
            </p>
          )}
          <Button size="sm" onClick={() => setCreateDivisionOpen(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Add Division
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {divisions?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No divisions found. Create a division to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {divisions?.map((division, index) => (
              <DivisionSection
                key={division.id}
                division={division}
                contestId={contest.id}
                canAddCategory={canAddCategory}
                defaultOpen={index === 0}
                isOnlyDivision={isOnlyDivision}
              />
            ))}
          </div>
        )}
      </CardContent>
      <CreateDivisionSheet
        contestId={contest.id}
        open={createDivisionOpen}
        onOpenChange={setCreateDivisionOpen}
      />
    </Card>
  );
}
