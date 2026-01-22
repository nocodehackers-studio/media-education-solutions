import { supabase } from '@/lib/supabase';
import { generateContestCode, generateParticipantCodes } from '../utils';
import type { CreateContestInput, UpdateContestInput } from '../types/contest.schemas';
import type {
  Contest,
  ContestRow,
  ContestStatus,
  DashboardStats,
  Participant,
  ParticipantRow,
} from '../types/contest.types';
import { transformParticipant } from '../types/contest.types';

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

    // Story 2-9: Auto-create default "General" division for new contests
    const { error: divisionError } = await supabase
      .from('divisions')
      .insert({
        contest_id: contest.id,
        name: 'General',
        display_order: 0,
      });

    if (divisionError) {
      // Rollback contest creation if division fails
      await supabase.from('contests').delete().eq('id', contest.id);
      throw new Error('Failed to create default division');
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
    // Convert empty strings to null to preserve DB semantics
    const emptyToNull = (val: string | undefined) =>
      val === '' ? null : val;

    const { data, error } = await supabase
      .from('contests')
      .update({
        name: input.name,
        description: emptyToNull(input.description),
        rules: emptyToNull(input.rules),
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

  /**
   * List participant codes for a contest with optional status filter
   * Only selects columns needed for UI display (avoids fetching unnecessary PII)
   * @param contestId Contest ID
   * @param filter Filter by status: 'all', 'used', or 'unused'
   * @returns Array of participants
   */
  async listParticipantCodes(
    contestId: string,
    filter?: 'all' | 'used' | 'unused'
  ): Promise<Participant[]> {
    // Select columns needed for display (id, code, organization_name, status, name for used codes)
    // Avoids fetching tlc_name, tlc_email unnecessarily
    let query = supabase
      .from('participants')
      .select('id, contest_id, code, status, name, organization_name, created_at')
      .eq('contest_id', contestId)
      .order('created_at', { ascending: false });

    if (filter === 'used') {
      query = query.eq('status', 'used');
    } else if (filter === 'unused') {
      query = query.eq('status', 'unused');
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch participant codes: ${error.message}`);
    }
    // Map partial rows to full Participant objects (missing fields will be null)
    return (data || []).map((row) => ({
      id: row.id,
      contestId: row.contest_id,
      code: row.code,
      status: row.status as 'unused' | 'used',
      name: row.name,
      organizationName: row.organization_name,
      tlcName: null,
      tlcEmail: null,
      createdAt: row.created_at,
    }));
  },

  /**
   * Generate a single participant code for an organization
   * Per change proposal 1.3: Single code generation with organization name
   * @param contestId Contest ID
   * @param organizationName Name of the organization/school
   * @returns Newly created participant with code
   */
  async generateSingleCode(
    contestId: string,
    organizationName: string
  ): Promise<Participant> {
    // Get existing codes to avoid duplicates
    const { data: existing, error: fetchError } = await supabase
      .from('participants')
      .select('code')
      .eq('contest_id', contestId);

    if (fetchError) {
      throw new Error(
        `Failed to fetch existing codes: ${fetchError.message}`
      );
    }

    const existingCodes = new Set((existing || []).map((p) => p.code));
    const [newCode] = generateParticipantCodes(1, existingCodes);

    // Insert new code with organization name
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const { data, error } = await supabase
        .from('participants')
        .insert({
          contest_id: contestId,
          code: newCode,
          status: 'unused' as const,
          organization_name: organizationName,
        })
        .select()
        .single();

      if (!error) {
        return transformParticipant(data as ParticipantRow);
      }

      // Check for unique constraint violation (concurrent insert conflict)
      if (error.code === '23505' && attempt < MAX_RETRIES) {
        // Regenerate code and retry
        const { data: refreshed } = await supabase
          .from('participants')
          .select('code')
          .eq('contest_id', contestId);

        const refreshedCodes = new Set((refreshed || []).map((p) => p.code));
        const [regeneratedCode] = generateParticipantCodes(1, refreshedCodes);
        Object.assign(newCode, regeneratedCode);
        lastError = new Error(error.message);
        continue;
      }

      throw new Error(`Failed to generate participant code: ${error.message}`);
    }

    throw new Error(
      `Failed to generate code after ${MAX_RETRIES} attempts: ${lastError?.message}`
    );
  },

  /**
   * Generate new participant codes for a contest (batch)
   * Includes error handling for existing codes fetch and retry logic for conflicts
   * @param contestId Contest ID
   * @param count Number of codes to generate (default 50)
   * @returns Array of newly created participants
   * @deprecated Use generateSingleCode instead per change proposal 1.3
   */
  async generateParticipantCodes(
    contestId: string,
    count: number = 50
  ): Promise<Participant[]> {
    // Get existing codes to avoid duplicates (with error handling)
    const { data: existing, error: fetchError } = await supabase
      .from('participants')
      .select('code')
      .eq('contest_id', contestId);

    if (fetchError) {
      throw new Error(
        `Failed to fetch existing codes: ${fetchError.message}`
      );
    }

    const existingCodes = new Set((existing || []).map((p) => p.code));
    const newCodes = generateParticipantCodes(count, existingCodes);

    // Insert new codes with retry logic for conflict handling
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const { data, error } = await supabase
        .from('participants')
        .insert(
          newCodes.map((code) => ({
            contest_id: contestId,
            code,
            status: 'unused' as const,
          }))
        )
        .select();

      if (!error) {
        return (data as ParticipantRow[]).map(transformParticipant);
      }

      // Check for unique constraint violation (concurrent insert conflict)
      if (error.code === '23505' && attempt < MAX_RETRIES) {
        // Refetch existing codes and regenerate
        const { data: refreshed, error: refreshError } = await supabase
          .from('participants')
          .select('code')
          .eq('contest_id', contestId);

        if (refreshError) {
          // If refresh fails, continue to next attempt with original codes
          lastError = new Error(refreshError.message);
          continue;
        }

        const refreshedCodes = new Set((refreshed || []).map((p) => p.code));
        // Regenerate codes that don't conflict
        const regeneratedCodes = generateParticipantCodes(count, refreshedCodes);
        newCodes.length = 0;
        newCodes.push(...regeneratedCodes);
        lastError = new Error(error.message);
        continue;
      }

      throw new Error(`Failed to generate participant codes: ${error.message}`);
    }

    throw new Error(
      `Failed to generate codes after ${MAX_RETRIES} attempts: ${lastError?.message}`
    );
  },

  /**
   * Get dashboard statistics
   * @returns Dashboard stats: total contests, active contests, total participants, total submissions
   */
  async getStats(): Promise<DashboardStats> {
    // Total contests
    const { count: totalContests, error: contestsError } = await supabase
      .from('contests')
      .select('*', { count: 'exact', head: true });

    if (contestsError) {
      throw new Error(`Failed to fetch contests count: ${contestsError.message}`);
    }

    // Active contests (published)
    const { count: activeContests, error: activeError } = await supabase
      .from('contests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    if (activeError) {
      throw new Error(`Failed to fetch active contests count: ${activeError.message}`);
    }

    // Total participants (codes generated)
    const { count: totalParticipants, error: participantsError } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true });

    if (participantsError) {
      throw new Error(`Failed to fetch participants count: ${participantsError.message}`);
    }

    // Total submissions (0 until Epic 4)
    // submissions table may not exist yet - handle gracefully
    const { count: totalSubmissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true });

    // Only ignore "relation does not exist" error (table not created yet)
    // Re-throw real errors (RLS, config, network issues)
    let submissions = 0;
    if (submissionsError) {
      // PostgreSQL error code 42P01 = undefined_table
      // Also check message for "relation" errors in case code isn't available
      const isTableMissing =
        submissionsError.code === '42P01' ||
        submissionsError.message?.includes('relation') ||
        submissionsError.message?.includes('does not exist');

      if (!isTableMissing) {
        throw new Error(`Failed to fetch submissions count: ${submissionsError.message}`);
      }
      // Table doesn't exist yet - this is expected until Epic 4
    } else {
      submissions = totalSubmissions ?? 0;
    }

    return {
      totalContests: totalContests ?? 0,
      activeContests: activeContests ?? 0,
      totalParticipants: totalParticipants ?? 0,
      totalSubmissions: submissions,
    };
  },

  /**
   * List recent contests ordered by creation date
   * @param limit Maximum number of contests to return (default 5)
   * @returns Array of recent contests
   */
  async listRecentContests(limit: number = 5): Promise<Contest[]> {
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent contests: ${error.message}`);
    }

    return (data as ContestRow[]).map(transformContestRow);
  },

  /**
   * List active contests (published status)
   * @returns Array of active contests
   */
  async listActiveContests(): Promise<Contest[]> {
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch active contests: ${error.message}`);
    }

    return (data as ContestRow[]).map(transformContestRow);
  },
};
