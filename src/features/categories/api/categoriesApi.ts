// Categories API - Story 2.5
// Supabase CRUD operations for categories

import { supabase } from '@/lib/supabase';
import { transformCategory } from '../types/category.types';
import type { CreateCategoryInput, UpdateCategoryInput } from '../types/category.schemas';
import type { CategoryRow, CategoryStatus } from '../types/category.types';

export const categoriesApi = {
  /**
   * List all categories for a contest
   * @param contestId Contest ID to filter by
   * @returns Array of categories ordered by creation date
   */
  async listByContest(contestId: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('contest_id', contestId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return (data as CategoryRow[]).map(transformCategory);
  },

  /**
   * Get a single category by ID
   * @param categoryId Category ID
   * @returns Category or throws if not found
   */
  async getById(categoryId: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch category: ${error.message}`);
    }

    return transformCategory(data as CategoryRow);
  },

  /**
   * Create a new category for a contest
   * @param contestId Contest ID to create category in
   * @param input Category creation data
   * @returns Created category with draft status
   */
  async create(contestId: string, input: CreateCategoryInput) {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        contest_id: contestId,
        name: input.name,
        type: input.type,
        description: input.description || null,
        rules: input.rules || null,
        deadline: input.deadline,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create category: ${error.message}`);
    }

    return transformCategory(data as CategoryRow);
  },

  /**
   * Update a category's editable fields
   * Only allowed for draft categories
   * @param categoryId Category ID
   * @param input Fields to update
   * @returns Updated category
   */
  async update(categoryId: string, input: UpdateCategoryInput) {
    // Convert empty strings to null for optional fields
    const emptyToNull = (val: string | undefined) =>
      val === '' ? null : val;

    const { data, error } = await supabase
      .from('categories')
      .update({
        name: input.name,
        type: input.type,
        description: emptyToNull(input.description),
        rules: emptyToNull(input.rules),
        deadline: input.deadline,
      })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }

    return transformCategory(data as CategoryRow);
  },

  /**
   * Update a category's status
   * Follows rules:
   * - Draft → Published/Closed: always allowed
   * - Published → Draft: only if 0 submissions
   * - Published → Closed: always allowed
   * - Closed → Draft: only if 0 submissions
   * - Closed → Published: always allowed
   * @param categoryId Category ID
   * @param status New status value
   * @returns Updated category
   */
  async updateStatus(categoryId: string, status: CategoryStatus) {
    const { data, error } = await supabase
      .from('categories')
      .update({ status })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update category status: ${error.message}`);
    }

    return transformCategory(data as CategoryRow);
  },

  /**
   * Delete a category
   * Only allowed for draft categories with 0 submissions
   * @param categoryId Category ID
   */
  async delete(categoryId: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  },

  /**
   * Get submission count for a category
   * Used to enforce status change rules
   * @param categoryId Category ID
   * @returns Number of submissions
   */
  async getSubmissionCount(categoryId: string): Promise<number> {
    // Note: submissions table will be created in Epic 4
    // For now, return 0 since no submissions exist yet
    const { count, error } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    // If table doesn't exist yet, return 0
    if (error) {
      // PGRST116 = not found, 42P01 = table doesn't exist
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return 0;
      }
      throw new Error(`Failed to get submission count: ${error.message}`);
    }

    return count ?? 0;
  },
};
