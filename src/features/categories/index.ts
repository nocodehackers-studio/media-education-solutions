// features/categories/index.ts
// Categories feature - Category management per contest
// Story: 2-5-category-management, Story: 3-1-assign-judge-to-category

// === Components ===
export {
  AssignJudgeSheet,
  CategoriesTab,
  CategoryCard,
  CreateCategoryForm,
  DeleteCategoryButton,
  EditCategoryForm,
} from './components';

// === Hooks ===
export {
  useAssignJudge,
  useCategories,
  useCategoriesByDivision,
  useCategory,
  useCreateCategory,
  useDeleteCategory,
  useRemoveJudge,
  useUpdateCategory,
  useUpdateCategoryStatus,
} from './hooks';

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
