// Categories API - Story 2.5, Story 3-1, Story 3-2
// Supabase CRUD operations for categories

import { supabase } from '@/lib/supabase';
import { ERROR_CODES, getErrorMessage } from '@/lib/errorCodes';
import { transformCategory } from '../types/category.types';
import type { CreateCategoryInput, UpdateCategoryInput } from '../types/category.schemas';
import type {
  CategoryRow,
  CategoryRowWithJudge,
  CategoryStatus,
  CategoryWithContext,
} from '../types/category.types';

export const categoriesApi = {
  /**
   * List all categories for a contest (via divisions)
   * Story 2-9: Categories now go through divisions
   * Story 3-1: Now includes assigned judge info via join
   * @param contestId Contest ID to filter by
   * @returns Array of categories ordered by division display_order then creation date
   */
  async listByContest(contestId: string) {
    // Join through divisions to get categories for this contest
    // Story 3-1: Also join profiles to get assigned judge info
    const { data, error } = await supabase
      .from('categories')
      .select(
        `
        *,
        divisions!inner(contest_id, display_order),
        profiles:assigned_judge_id (
          id,
          email,
          first_name,
          last_name
        )
      `
      )
      .eq('divisions.contest_id', contestId)
      .order('divisions(display_order)', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(getErrorMessage(ERROR_CODES.CATEGORY_LOAD_FAILED));
    }

    // Cast via unknown since Supabase types may not reflect recent migrations
    return (data as unknown as CategoryRowWithJudge[]).map(transformCategory);
  },

  /**
   * List all categories for a specific division
   * Story 3-1: Now includes assigned judge info via join
   * @param divisionId Division ID to filter by
   * @returns Array of categories ordered by creation date
   */
  async listByDivision(divisionId: string) {
    const { data, error } = await supabase
      .from('categories')
      .select(
        `
        *,
        profiles:assigned_judge_id (
          id,
          email,
          first_name,
          last_name
        )
      `
      )
      .eq('division_id', divisionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(getErrorMessage(ERROR_CODES.CATEGORY_LOAD_FAILED));
    }

    // Cast via unknown since Supabase types may not reflect recent migrations
    return (data as unknown as CategoryRowWithJudge[]).map(transformCategory);
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
      throw new Error(getErrorMessage(ERROR_CODES.CATEGORY_NOT_FOUND));
    }

    return transformCategory(data as CategoryRow);
  },

  /**
   * Create a new category for a division
   * Story 2-9: Categories now belong to divisions, not contests directly
   * @param divisionId Division ID to create category in
   * @param input Category creation data
   * @returns Created category with draft status
   */
  async create(divisionId: string, input: CreateCategoryInput) {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        division_id: divisionId,
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
      throw new Error(getErrorMessage(ERROR_CODES.CATEGORY_CREATE_FAILED));
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
      throw new Error(getErrorMessage(ERROR_CODES.CATEGORY_UPDATE_FAILED));
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
      throw new Error(getErrorMessage(ERROR_CODES.CATEGORY_STATUS_UPDATE_FAILED));
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
      throw new Error(getErrorMessage(ERROR_CODES.CATEGORY_DELETE_FAILED));
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
      throw new Error(getErrorMessage(ERROR_CODES.CATEGORY_LOAD_FAILED));
    }

    return count ?? 0;
  },

  // ==========================================================================
  // Story 3-1: Judge Assignment Methods
  // ==========================================================================

  /**
   * Get judge profile by email (for checking existing judges)
   * @param email Email address to search for
   * @returns Judge profile if found, null otherwise
   */
  async getJudgeByEmail(
    email: string
  ): Promise<{ id: string; email: string } | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .eq('role', 'judge')
      .single();

    // PGRST116 = no rows found - this is expected when judge doesn't exist
    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  },

  /**
   * Assign a judge to a category
   * If email doesn't exist, creates new judge profile via Edge Function
   * @param categoryId Category ID to assign judge to
   * @param email Judge's email address
   * @returns Whether the judge was newly created
   */
  async assignJudge(
    categoryId: string,
    email: string
  ): Promise<{ isNewJudge: boolean }> {
    // 1. Check if profile exists
    const existingJudge = await this.getJudgeByEmail(email);

    let judgeId: string;
    let isNewJudge = false;

    if (existingJudge) {
      judgeId = existingJudge.id;
    } else {
      // 2. Create new judge via Edge Function
      const { data, error } = await supabase.functions.invoke('create-judge', {
        body: { email: email.toLowerCase() },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      judgeId = data.judgeId;
      isNewJudge = !data.isExisting;
    }

    // 3. Update category with judge assignment
    // Clear invited_at since this is a new assignment (invite will be sent later by Story 3.2)
    // Cast needed as Supabase generated types may not include new columns from recent migrations
    const { error: updateError } = await supabase
      .from('categories')
      .update({
        assigned_judge_id: judgeId,
        invited_at: null, // Clear any previous invitation timestamp
      } as Partial<CategoryRow>)
      .eq('id', categoryId);

    if (updateError) throw updateError;

    return { isNewJudge };
  },

  /**
   * Remove judge from category
   * Note: Reviews by the judge remain in the database (not deleted)
   * @param categoryId Category ID to remove judge from
   */
  async removeJudge(categoryId: string): Promise<void> {
    // Cast needed as Supabase generated types may not include new columns from recent migrations
    const { error } = await supabase
      .from('categories')
      .update({
        assigned_judge_id: null,
        invited_at: null, // Also clear invited_at since judge is removed
      } as Partial<CategoryRow>)
      .eq('id', categoryId);

    if (error) throw error;
  },

  // ==========================================================================
  // Story 3-2: Judge Invitation Methods
  // ==========================================================================

  /**
   * Send judge invitation email when category is closed
   * Calls Edge Function to send email via Brevo and update invited_at
   * @param categoryId Category ID to send invitation for
   * @returns Result with success status and optional error code
   */
  async sendJudgeInvitation(
    categoryId: string
  ): Promise<{ success: boolean; error?: string }> {
    // First, get category with judge and contest info (through division)
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select(
        `
        id,
        name,
        invited_at,
        assigned_judge_id,
        profiles:assigned_judge_id (
          id,
          email,
          first_name,
          last_name
        ),
        divisions!inner (
          contests!inner (
            id,
            name
          )
        )
      `
      )
      .eq('id', categoryId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    // Type assertion for nested join structure
    const categoryData = category as unknown as {
      id: string;
      name: string;
      invited_at: string | null;
      assigned_judge_id: string | null;
      profiles: {
        id: string;
        email: string;
        first_name: string | null;
        last_name: string | null;
      } | null;
      divisions: {
        contests: {
          id: string;
          name: string;
        };
      };
    };

    // Check if judge assigned (AC3: no email if no judge)
    if (!categoryData.assigned_judge_id || !categoryData.profiles) {
      return { success: false, error: 'NO_JUDGE_ASSIGNED' };
    }

    // Check if already invited (AC4: prevent duplicate emails)
    if (categoryData.invited_at) {
      return { success: false, error: 'ALREADY_INVITED' };
    }

    // Get submission count for the email content
    const { count: submissionCount } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    // Build judge name from profile
    const judgeName = categoryData.profiles.first_name
      ? `${categoryData.profiles.first_name} ${categoryData.profiles.last_name || ''}`.trim()
      : undefined;

    // Call Edge Function to send email
    const { data, error } = await supabase.functions.invoke(
      'send-judge-invitation',
      {
        body: {
          categoryId,
          judgeEmail: categoryData.profiles.email,
          judgeName,
          categoryName: categoryData.name,
          contestName: categoryData.divisions.contests.name,
          submissionCount: submissionCount ?? 0,
        },
      }
    );

    if (error) {
      return { success: false, error: error.message };
    }

    // Check for error in response body
    if (data && !data.success) {
      return { success: false, error: data.error || 'Unknown error' };
    }

    return { success: true };
  },

  // ==========================================================================
  // Story 5-6: Mark Category Complete
  // ==========================================================================

  /**
   * Mark a category as complete (judge finished all reviews and rankings)
   * Calls RPC to validate and mark complete, then fires admin notification
   * @param categoryId Category ID to mark complete
   * @returns Result with success status and completion timestamp
   */
  async markCategoryComplete(
    categoryId: string
  ): Promise<{ success: boolean; completedAt?: string; error?: string }> {
    // Step 1: Call RPC to validate and mark complete
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('mark_category_complete', {
      p_category_id: categoryId,
    });

    if (error) throw error;

    // RPC returns JSON with success/error
    const result = data as { success: boolean; error?: string; completed_at?: string };
    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Step 2: Trigger admin notification (fire-and-forget, failure doesn't undo completion)
    try {
      await supabase.functions.invoke('notify-admin-category-complete', {
        body: { categoryId },
      });
    } catch (emailError) {
      console.warn('Admin notification failed (non-blocking):', emailError);
    }

    return { success: true, completedAt: result.completed_at };
  },

  // ==========================================================================
  // Story 3-4: Judge Dashboard Methods
  // ==========================================================================

  /**
   * List all categories assigned to a specific judge
   * Includes contest/division context and submission count
   *
   * Security: RLS policies on categories table ensure judges can only see
   * categories where they are the assigned_judge_id. The judgeId parameter
   * should match the authenticated user's ID (passed from useAuth).
   *
   * @param judgeId Judge's user ID
   * @returns Array of categories with context, ordered by creation date
   */
  async listByJudge(judgeId: string): Promise<CategoryWithContext[]> {
    // Query categories where assigned_judge_id matches
    // Join divisions → contests to get contest and division names
    const { data: categories, error } = await supabase
      .from('categories')
      .select(
        `
        *,
        divisions!inner (
          id,
          name,
          contests!inner (
            id,
            name,
            status
          )
        )
      `
      )
      .eq('assigned_judge_id', judgeId)
      .in('status', ['published', 'closed'])
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(getErrorMessage(ERROR_CODES.CATEGORY_LOAD_FAILED));
    }

    if (!categories || categories.length === 0) {
      return [];
    }

    // Get submission counts for each category using efficient count queries
    // Uses count: 'exact' to avoid fetching all rows into memory
    const countMap = new Map<string, number>();
    const countPromises = categories.map(async (category) => {
      const { count, error: countError } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id);

      if (countError) {
        // Log warning but don't fail - show 0 count rather than break dashboard
        console.warn(
          `Failed to fetch submission count for category ${category.id}:`,
          countError.message
        );
        return;
      }

      countMap.set(category.id, count ?? 0);
    });

    await Promise.all(countPromises);

    // Type for joined query result
    type CategoryWithJoin = CategoryRow & {
      divisions: {
        id: string;
        name: string;
        contests: {
          id: string;
          name: string;
          status: string;
        };
      };
    };

    // Transform to CategoryWithContext
    return (categories as unknown as CategoryWithJoin[]).map((category) => ({
      ...transformCategory(category),
      contestName: category.divisions.contests.name,
      contestId: category.divisions.contests.id,
      divisionName: category.divisions.name,
      submissionCount: countMap.get(category.id) || 0,
    }));
  },
};
