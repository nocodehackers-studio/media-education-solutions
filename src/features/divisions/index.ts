// features/divisions/index.ts
// Divisions feature - Division management per contest
// Story: 2-9-division-management

// === Components ===
export {
  DivisionList,
  DivisionListItem,
  CreateDivisionSheet,
  EditDivisionSheet,
  DuplicateCategoryDialog,
} from './components';

// === Hooks ===
export {
  useDivisions,
  useCreateDivision,
  useUpdateDivision,
  useDeleteDivision,
  useDuplicateCategory,
} from './hooks';

// === API ===
export { divisionsApi } from './api/divisionsApi';

// === Types ===
export type { Division, DivisionRow } from './types';
export { transformDivision } from './types';

// === Schemas ===
export { createDivisionSchema, updateDivisionSchema } from './types';
export type { CreateDivisionInput, UpdateDivisionInput } from './types';
