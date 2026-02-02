interface CategoryCompletion {
  judging_completed_at: string | null;
}

/**
 * Determines if all categories in a contest have completed judging.
 * Used by notify-admin-category-complete Edge Function to trigger summary email.
 */
export function isAllJudgingComplete(
  categories: CategoryCompletion[] | null | undefined
): boolean {
  return (
    !!categories &&
    categories.length > 0 &&
    categories.every((c) => c.judging_completed_at !== null)
  );
}
