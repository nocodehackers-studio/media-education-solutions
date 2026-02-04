// CategoriesTab - Story 2.5, updated for Story 2.9
// Main tab content for category management in ContestDetailPage
// Story 2-9: Shows categories grouped by division with collapsible sections

import { useState, useCallback } from 'react';
import { Plus, ChevronDown, ChevronRight, FolderOpen, Pencil } from 'lucide-react';
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Skeleton,
} from '@/components/ui';
import {
  useDivisions,
  CreateDivisionSheet,
  EditDivisionSheet,
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

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <CollapsibleTrigger asChild>
          <button type="button" className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
            <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium truncate">{division.name}</span>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              ({categories?.length ?? 0} {categories?.length === 1 ? 'category' : 'categories'})
            </span>
          </button>
        </CollapsibleTrigger>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setEditDivisionOpen(true)}
            aria-label={`Edit ${division.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
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
        isOnlyDivision={isOnlyDivision}
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
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (divisionsError) {
    return (
      <p className="text-destructive">
        Failed to load divisions. Please try again.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage divisions and submission categories
        </p>
        <div className="flex items-center gap-2">
          {!canAddCategory && (
            <p className="text-sm text-muted-foreground">
              Cannot add categories to a closed contest
            </p>
          )}
          <Button size="sm" variant="outline" onClick={() => setCreateDivisionOpen(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Add Division
          </Button>
        </div>
      </div>
      {divisions?.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No divisions found. Create a division to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {divisions?.map((division) => (
            <DivisionSection
              key={division.id}
              division={division}
              contestId={contest.id}
              canAddCategory={canAddCategory}
              defaultOpen={false}
              isOnlyDivision={isOnlyDivision}
            />
          ))}
        </div>
      )}
      <CreateDivisionSheet
        contestId={contest.id}
        open={createDivisionOpen}
        onOpenChange={setCreateDivisionOpen}
      />
    </div>
  );
}
