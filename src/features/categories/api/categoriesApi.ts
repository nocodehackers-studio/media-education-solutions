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

// ---------------------------------------------------------------------------
// Admin-only debug logging — only active for elias@nocodehackers.es
// ---------------------------------------------------------------------------
const DEBUG_EMAIL = 'elias@nocodehackers.es';
type DebugLog = (step: string, data?: unknown) => void;

function createDebugLog(method: string, userEmail?: string | null): DebugLog {
  const active = userEmail === DEBUG_EMAIL;
  return (step: string, data?: unknown) => {
    if (active) {
      console.log(
        `%c[DEBUG][${method}] ${step}`,
        'color: #ff6b35; font-weight: bold',
        data !== undefined ? data : ''
      );
    }
  };
}

/** Get current user email for debug flag (cheap — reads from memory) */
async function _getCurrentEmail(): Promise<string | undefined> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.email ?? undefined;
}

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
    const userEmail = await _getCurrentEmail();
    const dbg = createDebugLog('updateStatus', userEmail);
    dbg('Start', { categoryId, status });

    const { data, error } = await supabase
      .from('categories')
      .update({ status })
      .eq('id', categoryId)
      .select()
      .single();

    dbg('Update result', {
      ok: !!data,
      error: error?.message ?? null,
      errorCode: error?.code ?? null,
    });

    if (error) {
      throw new Error(getErrorMessage(ERROR_CODES.CATEGORY_STATUS_UPDATE_FAILED));
    }

    dbg('Done', { newStatus: status });
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

  /**
   * Bulk update category statuses for all categories in a contest matching a given status.
   * Two-step approach: SELECT matching IDs via join, then UPDATE with .in('id', ids).
   * Supabase JS .update() cannot filter through joins, hence this pattern.
   * Note: This is NOT atomic — a failure in Step 2 after Step 1 could leave state inconsistent.
   * Acceptable for admin-only cascade; categories can be manually corrected if needed.
   * @param contestId Contest ID to scope categories
   * @param fromStatus Only update categories currently in this status
   * @param toStatus New status to set
   * @returns Array of updated category IDs
   */
  async bulkUpdateStatusByContest(
    contestId: string,
    fromStatus: CategoryStatus,
    toStatus: CategoryStatus
  ): Promise<{ updatedIds: string[] }> {
    // Step 1: SELECT matching IDs via join
    const { data: matches, error: selectError } = await supabase
      .from('categories')
      .select('id, divisions!inner(contest_id)')
      .eq('divisions.contest_id', contestId)
      .eq('status', fromStatus);

    if (selectError) {
      throw new Error(getErrorMessage(ERROR_CODES.CATEGORY_STATUS_UPDATE_FAILED));
    }

    const ids = matches?.map((m) => m.id) ?? [];
    if (ids.length === 0) return { updatedIds: [] };

    // Step 2: UPDATE by IDs
    const { error: updateError } = await supabase
      .from('categories')
      .update({ status: toStatus })
      .in('id', ids);

    if (updateError) {
      throw new Error(getErrorMessage(ERROR_CODES.CATEGORY_STATUS_UPDATE_FAILED));
    }

    return { updatedIds: ids };
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
    email: string,
    _dbg?: DebugLog
  ): Promise<{ id: string; email: string } | null> {
    _dbg?.('Query profiles', { email: email.toLowerCase(), role: 'judge' });
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .eq('role', 'judge')
      .limit(1);

    _dbg?.('Query result', { data, error: error?.message ?? null });

    if (error) {
      throw error;
    }

    const result = data?.[0] ?? null;
    _dbg?.('Returning', result ? { id: result.id } : 'null (not found)');
    return result;
  },

  /**
   * Assign a judge to a category.
   * If email doesn't exist, creates new judge profile via Edge Function.
   *
   * Uses FunctionsHttpError context extraction (same pattern as useWithdrawSubmission.ts:30-43,
   * applied here in the API layer because the SDK call lives here — see F4 in tech-spec).
   *
   * Error codes thrown (from create-judge edge function):
   *   UNAUTHORIZED — missing/invalid auth token
   *   FORBIDDEN — authenticated but not admin
   *   EMAIL_REQUIRED, EMAIL_INVALID — input validation
   *   ROLE_CONFLICT — email belongs to a non-judge user
   *   CREATE_FAILED — auth user creation failed
   *   JUDGE_ASSIGN_FAILED — category update failed (F2) or unknown edge function error
   *
   * @param categoryId Category ID to assign judge to
   * @param email Judge's email address
   * @returns Whether the judge was newly created
   */
  async assignJudge(
    categoryId: string,
    email: string
  ): Promise<{ isNewJudge: boolean }> {
    const userEmail = await _getCurrentEmail();
    const dbg = createDebugLog('assignJudge', userEmail);
    dbg('Start', { categoryId, email });

    // Refresh session FIRST — a stale JWT affects both the profiles RLS query
    // (admin sees 0 rows under anon role, masking existing judges) and the
    // edge function gateway (401 "Invalid JWT"). Validate the returned session
    // object, not just the error — refreshSession() can return
    // { session: null, error: null } when there is nothing to refresh.
    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession();
    dbg('Session refresh', {
      ok: !refreshError && !!refreshData.session,
      error: refreshError?.message ?? null,
      hasSession: !!refreshData.session,
      tokenPrefix: refreshData.session?.access_token?.slice(0, 20),
    });
    if (refreshError || !refreshData.session) {
      dbg('ABORT — no valid session');
      throw new Error('UNAUTHORIZED');
    }

    // 1. Check if profile exists (fresh JWT ensures correct RLS evaluation)
    dbg('Checking existing judge by email');
    const existingJudge = await this.getJudgeByEmail(email, dbg);

    let judgeId: string;
    let isNewJudge = false;

    if (existingJudge) {
      dbg('Existing judge found', { judgeId: existingJudge.id });
      judgeId = existingJudge.id;
    } else {
      // 2. Create new judge via Edge Function — pass the freshly-refreshed
      // access token explicitly. functions.invoke() relies on client-internal
      // token propagation which can race or use a stale cached value.
      // Explicit header is deterministic.
      dbg('No existing judge — calling create-judge edge function', {
        email: email.toLowerCase(),
      });
      const { data, error } = await supabase.functions.invoke('create-judge', {
        body: { email: email.toLowerCase() },
        headers: {
          Authorization: `Bearer ${refreshData.session.access_token}`,
        },
      });
      dbg('Edge function response', {
        data,
        hasError: !!error,
        errorName: (error as Error | null)?.name,
        errorMessage: (error as Error | null)?.message,
      });

      // Extract error code from FunctionsHttpError response context
      if (error) {
        let code = '';
        try {
          const ctx = (error as unknown as { context?: Response }).context;
          if (ctx instanceof Response) {
            const body = await ctx.json();
            dbg('Edge function error body', body);
            // Our edge function returns { error: 'CODE' }
            // Supabase gateway returns { code: 401, message: 'Invalid JWT' }
            code = body?.error ?? '';
            if (!code && body?.message === 'Invalid JWT') {
              code = 'UNAUTHORIZED';
            }
          }
        } catch {
          dbg('Failed to parse edge function error response');
        }
        dbg('Throwing', { code: code || 'JUDGE_ASSIGN_FAILED' });
        throw new Error(code || 'JUDGE_ASSIGN_FAILED');
      }

      if (!data?.judgeId) {
        dbg('No judgeId in response — throwing JUDGE_ASSIGN_FAILED');
        throw new Error('JUDGE_ASSIGN_FAILED');
      }
      judgeId = data.judgeId;
      isNewJudge = !data.isExisting;
      dbg('Judge created/found via edge fn', { judgeId, isNewJudge });
    }

    // 3. Update category with judge assignment
    // F2: Wrap in try/catch so raw PostgrestError never reaches the UI
    dbg('Updating category', { categoryId, judgeId });
    try {
      const { error: updateError } = await supabase
        .from('categories')
        .update({
          assigned_judge_id: judgeId,
          invited_at: null,
        } as Partial<CategoryRow>)
        .eq('id', categoryId);

      if (updateError) {
        dbg('Category update failed', {
          code: updateError.code,
          message: updateError.message,
        });
        throw updateError;
      }
    } catch {
      throw new Error('JUDGE_ASSIGN_FAILED');
    }

    dbg('Done', { isNewJudge });
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
   * Shared helper for sending judge invitation emails
   * Story 7-2: Extracted to avoid duplication between send and resend
   * @param categoryId Category ID
   * @param options.skipAlreadyInvitedCheck Skip the duplicate check (for manual resend)
   * @param options.requireClosedStatus Require category to be in 'closed' status (for manual resend)
   */
  async _invokeJudgeInvitation(
    categoryId: string,
    options: { skipAlreadyInvitedCheck?: boolean; requireClosedStatus?: boolean } = {}
  ): Promise<{ success: boolean; error?: string }> {
    const userEmail = await _getCurrentEmail();
    const dbg = createDebugLog('_invokeJudgeInvitation', userEmail);
    dbg('Start', { categoryId, options });

    // Refresh session for fresh JWT — affects RLS queries and edge function gateway
    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession();
    dbg('Session refresh', {
      ok: !refreshError && !!refreshData.session,
      error: refreshError?.message ?? null,
    });
    if (refreshError || !refreshData.session) {
      dbg('ABORT — no valid session');
      return { success: false, error: 'Session expired. Please sign in again.' };
    }

    // Build query — always include invited_at for the duplicate check option
    dbg('Fetching category data');
    let query = supabase
      .from('categories')
      .select(
        `
        id,
        name,
        deadline,
        status,
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
      .eq('id', categoryId);

    // F11: Server-side status check for resend
    if (options.requireClosedStatus) {
      query = query.eq('status', 'closed');
    }

    const { data: category, error: fetchError } = await query.single();
    dbg('Category fetch result', {
      found: !!category,
      error: fetchError?.message ?? null,
      errorCode: fetchError?.code ?? null,
    });

    if (fetchError) {
      if (options.requireClosedStatus && fetchError.code === 'PGRST116') {
        dbg('Category not in closed status');
        return { success: false, error: 'Category is not in closed status' };
      }
      return { success: false, error: fetchError.message };
    }

    // Type assertion for nested join structure
    const categoryData = category as unknown as {
      id: string;
      name: string;
      deadline: string;
      status: string;
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

    dbg('Category data', {
      status: categoryData.status,
      assigned_judge_id: categoryData.assigned_judge_id,
      invited_at: categoryData.invited_at,
      hasProfiles: !!categoryData.profiles,
      judgeEmail: categoryData.profiles?.email,
      contestName: categoryData.divisions?.contests?.name,
    });

    // Check if judge assigned
    if (!categoryData.assigned_judge_id || !categoryData.profiles) {
      dbg('No judge assigned — aborting');
      return { success: false, error: 'NO_JUDGE_ASSIGNED' };
    }

    // Check if already invited (unless explicitly skipped for resend)
    if (!options.skipAlreadyInvitedCheck && categoryData.invited_at) {
      dbg('Already invited — aborting', { invited_at: categoryData.invited_at });
      return { success: false, error: 'ALREADY_INVITED' };
    }

    // Get submission count for the email content
    const { count: submissionCount } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);
    dbg('Submission count', { submissionCount });

    // Build judge name from profile
    const judgeName = categoryData.profiles.first_name
      ? `${categoryData.profiles.first_name} ${categoryData.profiles.last_name || ''}`.trim()
      : undefined;

    const invokeBody = {
      categoryId,
      contestId: categoryData.divisions.contests.id,
      judgeEmail: categoryData.profiles.email,
      judgeName,
      categoryName: categoryData.name,
      contestName: categoryData.divisions.contests.name,
      submissionCount: submissionCount ?? 0,
      categoryDeadline: categoryData.deadline,
    };
    dbg('Calling send-judge-invitation edge function', invokeBody);

    // Call Edge Function to send email — pass fresh token explicitly
    const { data, error } = await supabase.functions.invoke(
      'send-judge-invitation',
      {
        body: invokeBody,
        headers: {
          Authorization: `Bearer ${refreshData.session.access_token}`,
        },
      }
    );

    dbg('Edge function response', {
      data,
      hasError: !!error,
      errorName: (error as Error | null)?.name,
      errorMessage: (error as Error | null)?.message,
    });

    if (error) {
      // Try to extract detailed error from FunctionsHttpError context
      let detail = error.message;
      try {
        const ctx = (error as unknown as { context?: Response }).context;
        if (ctx instanceof Response) {
          const body = await ctx.json();
          dbg('Edge function error body', body);
          detail = body?.error || body?.message || detail;
        }
      } catch {
        /* parsing failed */
      }
      dbg('Returning failure', { detail });
      return { success: false, error: detail };
    }

    if (data && !data.success) {
      dbg('Edge function returned failure', { error: data.error });
      return { success: false, error: data.error || 'Unknown error' };
    }

    dbg('Done — invitation sent successfully');
    return { success: true };
  },

  /**
   * Send judge invitation email when category is closed
   * Calls Edge Function to send email via Brevo and update invited_at
   * @param categoryId Category ID to send invitation for
   * @returns Result with success status and optional error code
   */
  async sendJudgeInvitation(
    categoryId: string
  ): Promise<{ success: boolean; error?: string }> {
    return this._invokeJudgeInvitation(categoryId);
  },

  /**
   * Story 7-2: Resend judge invitation email (manual admin action)
   * Skips ALREADY_INVITED check, requires category to be in 'closed' status
   * @param categoryId Category ID to resend invitation for
   * @returns Result with success status and optional error
   */
  async resendJudgeInvitation(
    categoryId: string
  ): Promise<{ success: boolean; error?: string }> {
    return this._invokeJudgeInvitation(categoryId, {
      skipAlreadyInvitedCheck: true,
      requireClosedStatus: true,
    });
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
            status,
            timezone
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
          timezone: string;
        };
      };
    };

    // Transform to CategoryWithContext
    return (categories as unknown as CategoryWithJoin[]).map((category) => ({
      ...transformCategory(category),
      contestName: category.divisions.contests.name,
      contestId: category.divisions.contests.id,
      contestTimezone: category.divisions.contests.timezone,
      divisionName: category.divisions.name,
      submissionCount: countMap.get(category.id) || 0,
    }));
  },
};
