// CategoriesTab - Story 2.5, updated for Story 2.9
// Main tab content for category management in ContestDetailPage
// Story 2-9: Shows categories grouped by division with collapsible sections

import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';
import {
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
} from '@/components/ui';
import { useDivisions, type Division } from '@/features/divisions';
import { useCategoriesByDivision } from '../hooks/useCategoriesByDivision';
import { CategoryCard } from './CategoryCard';
import { CreateCategoryForm } from './CreateCategoryForm';
import type { Contest } from '@/features/contests';

interface CategoriesTabProps {
  contest: Contest;
}

interface DivisionSectionProps {
  division: Division;
  contestId: string;
  canAddCategory: boolean;
  defaultOpen?: boolean;
}

/**
 * Section component for a single division with its categories
 */
function DivisionSection({
  division,
  contestId,
  canAddCategory,
  defaultOpen = true,
}: DivisionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [createOpen, setCreateOpen] = useState(false);
  const { data: categories, isLoading } = useCategoriesByDivision(division.id);

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
        {canAddCategory && (
          <Sheet open={createOpen} onOpenChange={setCreateOpen}>
            <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Create Category in {division.name}</SheetTitle>
              </SheetHeader>
              <CreateCategoryForm
                divisionId={division.id}
                contestId={contestId}
                onSuccess={() => setCreateOpen(false)}
              />
            </SheetContent>
          </Sheet>
        )}
      </div>
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
          <div className="pl-6 grid gap-4 md:grid-cols-2">
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

  // AC1: Add Category only allowed for Draft or Published contests
  const canAddCategory =
    contest.status === 'draft' || contest.status === 'published';

  if (divisionsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
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
          <CardTitle>Categories</CardTitle>
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
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Manage submission categories organized by division
          </CardDescription>
        </div>
        {!canAddCategory && (
          <p className="text-sm text-muted-foreground">
            Cannot add categories to a closed contest
          </p>
        )}
      </CardHeader>
      <CardContent>
        {divisions?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No divisions found. Create a division first in the Divisions tab.
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
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
