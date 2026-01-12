import { supabase } from '@/lib/supabase';
import { generateContestCode, generateParticipantCodes } from '../utils';
import type { CreateContestInput } from '../types/contest.schemas';
import type { Contest, ContestRow } from '../types/contest.types';

/**
 * Transform database row (snake_case) to application object (camelCase)
 */
function transformContestRow(row: ContestRow): Contest {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    slug: row.slug,
    contestCode: row.contest_code,
    rules: row.rules,
    coverImageUrl: row.cover_image_url,
    status: row.status,
    winnersPagePassword: row.winners_page_password,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * API interface for contests
 */
export const contestsApi = {
  /**
   * Create a new contest with auto-generated participant codes
   * @param input Contest creation data
   * @returns Created contest
   * @throws Error if contest code already exists or creation fails
   */
  async create(input: CreateContestInput): Promise<Contest> {
    // 1. Generate slug from name
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    // 2. Retry loop for contest creation with auto-generated codes
    // Higher retry limit to ensure AC2 uniqueness guarantee
    // With 30^6 possible codes, collision is rare but we retry to guarantee success
    const MAX_RETRIES = 20;
    let contest: ContestRow | null = null;
    let lastError: Error | null = null;

    // If user provided a custom code, use it without retries
    const useCustomCode = input.contestCode && input.contestCode.length === 6;

    for (let attempt = 0; attempt < (useCustomCode ? 1 : MAX_RETRIES); attempt++) {
      const contestCode = useCustomCode
        ? input.contestCode
        : generateContestCode();

      // 3. Insert contest
      const { data, error: contestError } = await supabase
        .from('contests')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Type will resolve once Supabase migration is applied
        .insert({
          name: input.name,
          description: input.description || null,
          contest_code: contestCode,
          slug,
          rules: input.rules || null,
          cover_image_url: null, // Placeholder for now (Story requirement)
          status: 'draft' as const,
        })
        .select()
        .single();

      if (!contestError) {
        contest = data as ContestRow;
        break;
      }

      // Handle duplicate contest code - retry with new code if auto-generated
      if (contestError.code === '23505') {
        // Extract constraint name from PostgreSQL error message
        // Format: 'duplicate key value violates unique constraint "constraint_name"'
        const constraintMatch = contestError.message.match(/constraint "([^"]+)"/);
        const constraintName = constraintMatch?.[1] || '';

        // Check constraint metadata: contests_contest_code_key vs contests_slug_key
        const isCodeCollision = constraintName === 'contests_contest_code_key';
        const isSlugCollision = constraintName === 'contests_slug_key';

        if (isCodeCollision && !useCustomCode) {
          // Retry with new auto-generated code
          lastError = new Error('Contest code collision - retrying with new code');
          continue;
        }

        // Either slug collision or custom code collision - don't retry
        if (isSlugCollision) {
          throw new Error('A contest with this name already exists');
        } else if (isCodeCollision) {
          throw new Error('Contest code already exists');
        } else {
          // Unknown constraint - provide generic message
          throw new Error('A contest with these details already exists');
        }
      }

      // Other errors - fail immediately
      throw new Error(`Failed to create contest: ${contestError.message}`);
    }

    if (!contest) {
      throw new Error(
        lastError?.message || 'Failed to create contest after multiple attempts'
      );
    }

    // 4. Generate 50 participant codes
    const codes = generateParticipantCodes(50);
    const participants = codes.map((code) => ({
      contest_id: (contest as ContestRow).id,
      code,
      status: 'unused' as const,
    }));

    const { error: codesError } = await supabase
      .from('participants')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type will resolve once Supabase migration is applied
      .insert(participants);

    if (codesError) {
      // Fail fast - participant codes are required per AC3
      // Delete the contest to maintain data consistency
      const { error: deleteError } = await supabase
        .from('contests')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .delete()
        .eq('id', (contest as ContestRow).id);

      if (deleteError) {
        // Rollback failed - orphaned contest exists
        throw new Error(
          `Failed to generate participant codes: ${codesError.message}. ` +
          `WARNING: Rollback failed, orphaned contest ${contest.id} exists: ${deleteError.message}`
        );
      }

      throw new Error(`Failed to generate participant codes: ${codesError.message}`);
    }

    return transformContestRow(contest as ContestRow);
  },

  /**
   * List all contests ordered by most recent first
   * @returns Array of contests
   */
  async list(): Promise<Contest[]> {
    const { data, error } = await supabase
      .from('contests')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type will resolve once Supabase migration is applied
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch contests: ${error.message}`);
    }

    return (data as ContestRow[]).map(transformContestRow);
  },

  /**
   * Get a single contest by ID
   * @param id Contest ID
   * @returns Contest or null if not found
   */
  async getById(id: string): Promise<Contest | null> {
    const { data, error } = await supabase
      .from('contests')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Type will resolve once Supabase migration is applied
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new Error(`Failed to fetch contest: ${error.message}`);
    }

    return data ? transformContestRow(data as ContestRow) : null;
  },
};
