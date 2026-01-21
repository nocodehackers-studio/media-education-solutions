// features/categories/index.ts
// Categories feature - Category management per contest
// Story: 2-5-category-management

// === Components ===
export {
  CategoriesTab,
  CategoryCard,
  CreateCategoryForm,
  DeleteCategoryButton,
  EditCategoryForm,
} from './components';

// === Hooks ===
export {
  useCategories,
  useCategoriesByDivision,
  useCategory,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
  useUpdateCategoryStatus,
} from './hooks';

// === API ===
export { categoriesApi } from './api/categoriesApi';

// === Types ===
export type {
  Category,
  CategoryRow,
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
