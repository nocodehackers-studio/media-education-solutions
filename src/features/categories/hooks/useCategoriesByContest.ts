// Re-export useCategories as useCategoriesByContest for semantic clarity.
// Both call categoriesApi.listByContest(). Using the same query key ['categories', contestId]
// to avoid cache divergence.
export { useCategories as useCategoriesByContest } from './useCategories';
