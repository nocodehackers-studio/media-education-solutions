// Divisions API - Story 2.9
// Supabase CRUD operations for divisions

import { supabase } from '@/lib/supabase';
import { ERROR_CODES, getErrorMessage } from '@/lib/errorCodes';
import { transformDivision } from '../types/division.types';
import type { CreateDivisionInput, UpdateDivisionInput } from '../types/division.schemas';
import type { DivisionRow } from '../types/division.types';

export const divisionsApi = {
  /**
   * List all divisions for a contest with category counts
   * @param contestId Contest ID to filter by
   * @returns Array of divisions ordered by display_order
   */
  async listByContest(contestId: string) {
    const { data, error } = await supabase
      .from('divisions')
      .select(`
        *,
        category_count:categories(count)
      `)
      .eq('contest_id', contestId)
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(getErrorMessage(ERROR_CODES.DIVISION_LOAD_FAILED));
    }

    // Transform data - category_count comes as array with single object
    return (data ?? []).map((row) => {
      const categoryCount = Array.isArray(row.category_count)
        ? row.category_count[0]?.count ?? 0
        : 0;
      return transformDivision({ ...row, category_count: categoryCount } as DivisionRow & { category_count: number });
    });
  },

  /**
   * Get a single division by ID
   * @param divisionId Division ID
   * @returns Division or throws if not found
   */
  async getById(divisionId: string) {
    const { data, error } = await supabase
      .from('divisions')
      .select('*')
      .eq('id', divisionId)
      .single();

    if (error) {
      throw new Error(getErrorMessage(ERROR_CODES.DIVISION_NOT_FOUND));
    }

    return transformDivision(data as DivisionRow);
  },

  /**
   * Create a new division for a contest
   * @param contestId Contest ID to create division in
   * @param input Division creation data
   * @returns Created division
   */
  async create(contestId: string, input: CreateDivisionInput) {
    // Get the current max display_order for this contest
    const { data: existingDivisions } = await supabase
      .from('divisions')
      .select('display_order')
      .eq('contest_id', contestId)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = existingDivisions && existingDivisions.length > 0
      ? existingDivisions[0].display_order + 1
      : 0;

    const { data, error } = await supabase
      .from('divisions')
      .insert({
        contest_id: contestId,
        name: input.name,
        display_order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      throw new Error(getErrorMessage(ERROR_CODES.DIVISION_CREATE_FAILED));
    }

    return transformDivision(data as DivisionRow);
  },

  /**
   * Update a division's name or display order
   * @param divisionId Division ID
   * @param input Fields to update
   * @returns Updated division
   */
  async update(divisionId: string, input: UpdateDivisionInput) {
    const updateData: Record<string, unknown> = {
      name: input.name,
    };

    if (input.displayOrder !== undefined) {
      updateData.display_order = input.displayOrder;
    }

    const { data, error } = await supabase
      .from('divisions')
      .update(updateData)
      .eq('id', divisionId)
      .select()
      .single();

    if (error) {
      throw new Error(getErrorMessage(ERROR_CODES.DIVISION_UPDATE_FAILED));
    }

    return transformDivision(data as DivisionRow);
  },

  /**
   * Delete a division
   * Will fail if this is the only division for the contest
   * @param divisionId Division ID
   */
  async delete(divisionId: string) {
    const { error } = await supabase
      .from('divisions')
      .delete()
      .eq('id', divisionId);

    if (error) {
      throw new Error(getErrorMessage(ERROR_CODES.DIVISION_DELETE_FAILED));
    }
  },

  /**
   * Get the count of divisions for a contest
   * Used to prevent deleting the last division
   * @param contestId Contest ID
   * @returns Number of divisions
   */
  async getCount(contestId: string): Promise<number> {
    const { count, error } = await supabase
      .from('divisions')
      .select('*', { count: 'exact', head: true })
      .eq('contest_id', contestId);

    if (error) {
      throw new Error(getErrorMessage(ERROR_CODES.DIVISION_LOAD_FAILED));
    }

    return count ?? 0;
  },

  /**
   * Duplicate a category to one or more divisions
   * @param categoryId Source category ID
   * @param targetDivisionIds Array of target division IDs
   * @returns Number of categories created
   */
  async duplicateCategoryToDivisions(
    categoryId: string,
    targetDivisionIds: string[]
  ): Promise<number> {
    // First, get the source category
    const { data: sourceCategory, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (fetchError || !sourceCategory) {
      throw new Error(getErrorMessage(ERROR_CODES.CATEGORY_NOT_FOUND));
    }

    // Create copies in each target division
    const categoriesToInsert = targetDivisionIds.map((divisionId) => ({
      division_id: divisionId,
      name: sourceCategory.name,
      type: sourceCategory.type,
      description: sourceCategory.description,
      rules: sourceCategory.rules,
      deadline: sourceCategory.deadline,
      status: 'draft' as const, // Always start as draft
    }));

    const { data, error: insertError } = await supabase
      .from('categories')
      .insert(categoriesToInsert)
      .select();

    if (insertError) {
      throw new Error(getErrorMessage(ERROR_CODES.CATEGORY_DUPLICATE_FAILED));
    }

    return data?.length ?? 0;
  },
};
