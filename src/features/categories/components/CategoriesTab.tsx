// CategoriesTab - Story 2.5
// Main tab content for category management in ContestDetailPage

import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
} from '@/components/ui';
import { useCategories } from '../hooks/useCategories';
import { CategoryCard } from './CategoryCard';
import { CreateCategoryForm } from './CreateCategoryForm';
import type { Contest } from '@/features/contests';

interface CategoriesTabProps {
  contest: Contest;
}

/**
 * Tab content for managing categories within a contest
 * Shows category list with CRUD actions based on contest/category status
 */
export function CategoriesTab({ contest }: CategoriesTabProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: categories, isLoading, error } = useCategories(contest.id);

  // AC1: Add Category only allowed for Draft or Published contests
  const canAddCategory =
    contest.status === 'draft' || contest.status === 'published';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            Failed to load categories. Please try again.
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
            Manage submission categories for this contest
          </CardDescription>
        </div>
        {canAddCategory ? (
          <Sheet open={createOpen} onOpenChange={setCreateOpen}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Create Category</SheetTitle>
              </SheetHeader>
              <CreateCategoryForm
                contestId={contest.id}
                onSuccess={() => setCreateOpen(false)}
              />
            </SheetContent>
          </Sheet>
        ) : (
          <p className="text-sm text-muted-foreground">
            Cannot add categories to a closed contest
          </p>
        )}
      </CardHeader>
      <CardContent>
        {categories?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No categories yet. Add one to get started.
            </p>
            {canAddCategory && (
              <Button variant="outline" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Category
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {categories?.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                contestId={contest.id}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
