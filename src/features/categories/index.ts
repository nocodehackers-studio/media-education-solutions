// features/categories/index.ts
// Categories feature - Category management per contest
// Story: 2-5-category-management, Story: 3-1-assign-judge-to-category, Story: 3-5-admin-view-judge-progress

// === Components ===
export {
  AssignJudgeSheet,
  CategoriesTab,
  CategoryCard,
  CreateCategoryForm,
  DeleteCategoryButton,
  EditCategoryForm,
  // Story 3-5: Judge progress components
  JudgeDetailSheet,
  JudgeProgressCell,
  JudgesTab,
  JudgesTable,
} from './components';

// === Hooks ===
export {
  useAssignJudge,
  useCategories,
  useCategoriesByDivision,
  useCategory,
  useCreateCategory,
  useDeleteCategory,
  // Story 3-5: Judge progress hook
  useJudgeProgress,
  useRemoveJudge,
  useUpdateCategory,
  useUpdateCategoryStatus,
} from './hooks';
export type { JudgeProgress } from './hooks';

// === API ===
export { categoriesApi } from './api/categoriesApi';

// === Types ===
export type {
  AssignedJudge,
  Category,
  CategoryRow,
  CategoryRowWithJudge,
  CategoryStatus,
  CategoryType,
} from './types';
export { transformCategory } from './types';

// === Schemas ===
export {
  categoryStatusSchema,
  categoryTypeSchema,
  createCategorySchema,
  updateCategorySchema,
} from './types';
export type { CreateCategoryInput, UpdateCategoryInput } from './types';
