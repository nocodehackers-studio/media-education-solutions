import { supabase } from '@/lib/supabase';
import { generateContestCode } from '../utils';
import type { CreateContestInput, UpdateContestInput } from '../types/contest.schemas';
import type { Contest, ContestRow, ContestStatus } from '../types/contest.types';

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
   * Create a new contest (participant codes generated separately via button)
   * @param input Contest creation data
   * @returns Created contest
   * @throws Error if contest code already exists or creation fails
   */
  async create(input: CreateContestInput): Promise<Contest> {
    // 1. Generate base slug from name (may be empty if name has no alphanumeric chars)
    const baseSlug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // 2. Retry loop for contest creation with auto-generated codes
    // AC2 GUARANTEE: Retry for auto-generated codes until success
    // With 30^6 (729M) possible codes, collision probability is ~1.37e-9 per attempt
    // Max 10 retries as safety net (hitting 10 collisions = something is very wrong)
    const MAX_RETRIES = 10;
    let contest: ContestRow | null = null;
    let attempts = 0;

    // If user provided a custom code, use it without retries
    const useCustomCode = input.contestCode && input.contestCode.length === 6;

    while (!contest && attempts < MAX_RETRIES) {
      attempts++;
      // Contest code is always defined: either custom (validated to be 6 chars) or auto-generated
      const contestCode: string = useCustomCode
        ? input.contestCode!
        : generateContestCode();

      // 3. Generate unique slug by appending contest code
      // - If name produces valid slug: "summer-video-contest-abc123"
      // - If name has no alphanumeric chars: "contest-abc123"
      // This guarantees slug uniqueness (since contest_code is unique)
      const slug = baseSlug
        ? `${baseSlug}-${contestCode.toLowerCase()}`
        : `contest-${contestCode.toLowerCase()}`;

      // 4. Insert contest
      // MVP: Use placeholder URL when cover image is provided (Bunny Storage deferred)
      const coverImageUrl = input.coverImage
        ? 'https://placehold.co/1200x630/e2e8f0/64748b?text=Contest+Cover'
        : null;

      const { data, error: contestError } = await supabase
        .from('contests')
        .insert({
          name: input.name,
          description: input.description || null,
          contest_code: contestCode,
          slug,
          rules: input.rules || null,
          cover_image_url: coverImageUrl,
          status: 'draft',
        })
        .select()
        .single();

      if (!contestError) {
        contest = data as ContestRow;
        break;
      }

      // Handle unique constraint violations
      if (contestError.code === '23505') {
        // User provided custom code - AC4 requires specific error message
        if (useCustomCode) {
          throw new Error('Contest code already exists');
        }

        // Auto-generated code collision - retry with new code
        // Since slug includes the code, a new code also means a new unique slug
        continue;
      }

      // Other errors - fail immediately
      throw new Error(`Failed to create contest: ${contestError.message}`);
    }

    // Safety check: if we exhausted retries without success
    if (!contest) {
      throw new Error(
        'Failed to generate unique contest code after multiple attempts. Please try again.'
      );
    }

    return transformContestRow(contest);
  },

  /**
   * List all contests ordered by most recent first
   * @returns Array of contests
   */
  async list(): Promise<Contest[]> {
    const { data, error } = await supabase
      .from('contests')
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

  /**
   * Update a contest's editable fields (name, description, rules)
   * @param id Contest ID
   * @param input Fields to update
   * @returns Updated contest
   */
  async update(id: string, input: UpdateContestInput): Promise<Contest> {
    const { data, error } = await supabase
      .from('contests')
      .update({
        name: input.name,
        description: input.description,
        rules: input.rules,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update contest: ${error.message}`);
    }

    return transformContestRow(data as ContestRow);
  },

  /**
   * Update a contest's status
   * @param id Contest ID
   * @param status New status value
   * @returns Updated contest
   */
  async updateStatus(id: string, status: ContestStatus): Promise<Contest> {
    const { data, error } = await supabase
      .from('contests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update contest status: ${error.message}`);
    }

    return transformContestRow(data as ContestRow);
  },

  /**
   * Delete a contest (cascades to categories, submissions, codes)
   * @param id Contest ID
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('contests').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete contest: ${error.message}`);
    }
  },
};
