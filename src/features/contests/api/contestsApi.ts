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
    logoUrl: row.logo_url,
    status: row.status,
    winnersPagePassword: row.winners_page_password,
    winnersPageEnabled: row.winners_page_enabled ?? false,
    winnersPageGeneratedAt: row.winners_page_generated_at ?? null,
    notifyTlc: row.notify_tlc ?? true,
    deletedAt: row.deleted_at ?? null,
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
      const { data, error: contestError } = await supabase
        .from('contests')
        .insert({
          name: input.name,
          description: input.description || null,
          contest_code: contestCode,
          slug,
          rules: input.rules || null,
          cover_image_url: null,
          logo_url: null,
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
      .neq('status', 'deleted')
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

    // Build update payload, only including defined fields
    const updatePayload = {
      name: input.name,
      description: emptyToNull(input.description),
      rules: emptyToNull(input.rules),
      ...(input.notifyTlc !== undefined && { notify_tlc: input.notifyTlc }),
    };

    const { data, error } = await supabase
      .from('contests')
      .update(updatePayload)
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
   * Soft-delete a contest (sets status to 'deleted' with timestamp)
   * Contest will be permanently deleted after 90 days by scheduled cleanup
   * @param id Contest ID
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('contests')
      .update({ status: 'deleted', deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete contest: ${error.message}`);
    }
  },

  /**
   * Restore a soft-deleted contest back to draft status
   * @param id Contest ID
   */
  async restore(id: string): Promise<Contest> {
    const { data, error } = await supabase
      .from('contests')
      .update({ status: 'draft', deleted_at: null })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to restore contest: ${error.message}`);
    }

    return transformContestRow(data as ContestRow);
  },

  /**
   * List soft-deleted contests ordered by deletion date
   * @returns Array of deleted contests
   */
  async listDeleted(): Promise<Contest[]> {
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .eq('status', 'deleted')
      .order('deleted_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch deleted contests: ${error.message}`);
    }

    return (data as ContestRow[]).map(transformContestRow);
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
    // Select columns needed for display (codes represent institutions, not individuals)
    let query = supabase
      .from('participants')
      .select('id, contest_id, code, status, organization_name, created_at')
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
    return (data || []).map((row) => ({
      id: row.id,
      contestId: row.contest_id,
      code: row.code,
      status: row.status as 'unused' | 'used',
      organizationName: row.organization_name,
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

    let currentCodes = new Set((existing || []).map((p) => p.code));
    let codeToInsert = generateParticipantCodes(1, currentCodes)[0];

    // Insert new code with organization name
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const { data, error } = await supabase
        .from('participants')
        .insert({
          contest_id: contestId,
          code: codeToInsert,
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
        // Refresh existing codes and regenerate
        const { data: refreshed, error: refreshError } = await supabase
          .from('participants')
          .select('code')
          .eq('contest_id', contestId);

        if (refreshError) {
          // If refresh fails, continue to next attempt with current codes
          lastError = new Error(refreshError.message);
          continue;
        }

        currentCodes = new Set((refreshed || []).map((p) => p.code));
        codeToInsert = generateParticipantCodes(1, currentCodes)[0];
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
   * Update a participant code's organization name
   */
  async updateParticipantCode(
    participantId: string,
    organizationName: string
  ): Promise<void> {
    const { error } = await supabase
      .from('participants')
      .update({ organization_name: organizationName })
      .eq('id', participantId);

    if (error) {
      throw new Error(`Failed to update participant code: ${error.message}`);
    }
  },

  /**
   * Delete a participant code
   */
  async deleteParticipantCode(participantId: string): Promise<void> {
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', participantId);

    if (error) {
      throw new Error(`Failed to delete participant code: ${error.message}`);
    }
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
    // Run all 4 COUNT queries in parallel — Supabase never rejects, errors are in response
    const [contestsResult, activeResult, participantsResult, submissionsResult] = await Promise.all([
      supabase.from('contests').select('*', { count: 'exact', head: true }).neq('status', 'deleted'),
      supabase.from('contests').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('participants').select('*', { count: 'exact', head: true }),
      supabase.from('submissions').select('*', { count: 'exact', head: true }),
    ]);

    // Check each result for errors individually
    if (contestsResult.error) {
      throw new Error(`Failed to fetch contests count: ${contestsResult.error.message}`);
    }
    if (activeResult.error) {
      throw new Error(`Failed to fetch active contests count: ${activeResult.error.message}`);
    }
    if (participantsResult.error) {
      throw new Error(`Failed to fetch participants count: ${participantsResult.error.message}`);
    }

    // Submissions: gracefully handle missing table (42P01)
    let submissions = 0;
    if (submissionsResult.error) {
      const isTableMissing =
        submissionsResult.error.code === '42P01' ||
        submissionsResult.error.message?.includes('relation') ||
        submissionsResult.error.message?.includes('does not exist');

      if (!isTableMissing) {
        throw new Error(`Failed to fetch submissions count: ${submissionsResult.error.message}`);
      }
    } else {
      submissions = submissionsResult.count ?? 0;
    }

    return {
      totalContests: contestsResult.count ?? 0,
      activeContests: activeResult.count ?? 0,
      totalParticipants: participantsResult.count ?? 0,
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
      .neq('status', 'deleted')
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

  /**
   * Upload a cover image for a contest via the manage-contest-cover edge function.
   * @param contestId Contest ID
   * @param file Image file to upload
   * @returns CDN URL of the uploaded cover image
   */
  async uploadCoverImage(contestId: string, file: File): Promise<string> {
    console.log('[uploadCoverImage] Start', { contestId, fileName: file.name, fileSize: file.size, fileType: file.type });

    // Refresh session for fresh JWT
    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession();
    console.log('[uploadCoverImage] Session refresh', {
      ok: !refreshError && !!refreshData.session,
      error: refreshError?.message ?? null,
      hasSession: !!refreshData.session,
      tokenPrefix: refreshData.session?.access_token?.slice(0, 20),
    });
    if (refreshError || !refreshData.session) {
      throw new Error('UNAUTHORIZED');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('contestId', contestId);

    // Use raw fetch matching the working upload-photo pattern (usePhotoUpload.ts)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const url = `${supabaseUrl}/functions/v1/manage-contest-cover`;
    const token = refreshData.session.access_token;

    console.log('[uploadCoverImage] Calling edge function', {
      url,
      hasAnonKey: !!anonKey,
      tokenPrefix: token.slice(0, 20),
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: anonKey,
        },
        body: formData,
      });

      console.log('[uploadCoverImage] Response', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      const text = await response.text();
      console.log('[uploadCoverImage] Response body', text.slice(0, 500));

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(`Non-JSON response (${response.status}): ${text.slice(0, 200)}`);
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Upload failed (${response.status})`);
      }

      console.log('[uploadCoverImage] Success', { coverImageUrl: result.coverImageUrl });
      return result.coverImageUrl;
    } catch (err) {
      console.error('[uploadCoverImage] Fetch error', err);
      throw err;
    }
  },

  /**
   * Upload a logo for a contest via the manage-contest-cover edge function.
   * @param contestId Contest ID
   * @param file Image file to upload
   * @returns CDN URL of the uploaded logo
   */
  async uploadLogo(contestId: string, file: File): Promise<string> {
    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session) {
      throw new Error('UNAUTHORIZED');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('contestId', contestId);
    formData.append('type', 'logo');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const url = `${supabaseUrl}/functions/v1/manage-contest-cover`;
    const token = refreshData.session.access_token;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
      },
      body: formData,
    });

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error(`Non-JSON response (${response.status}): ${text.slice(0, 200)}`);
    }

    if (!response.ok || !result.success) {
      throw new Error(result.error || `Upload failed (${response.status})`);
    }

    return result.logoUrl;
  },

  /**
   * Delete the logo for a contest via the manage-contest-cover edge function.
   * @param contestId Contest ID
   */
  async deleteLogo(contestId: string): Promise<void> {
    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession();
    if (refreshError || !refreshData.session) {
      throw new Error('UNAUTHORIZED');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const url = `${supabaseUrl}/functions/v1/manage-contest-cover`;
    const token = refreshData.session.access_token;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contestId, action: 'delete', type: 'logo' }),
    });

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error(`Non-JSON response (${response.status}): ${text.slice(0, 200)}`);
    }

    if (!response.ok || !result.success) {
      throw new Error(result.error || `Delete failed (${response.status})`);
    }
  },

  /**
   * Delete the cover image for a contest via the manage-contest-cover edge function.
   * @param contestId Contest ID
   */
  async deleteCoverImage(contestId: string): Promise<void> {
    console.log('[deleteCoverImage] Start', { contestId });

    // Refresh session for fresh JWT
    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession();
    console.log('[deleteCoverImage] Session refresh', {
      ok: !refreshError && !!refreshData.session,
      error: refreshError?.message ?? null,
    });
    if (refreshError || !refreshData.session) {
      throw new Error('UNAUTHORIZED');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const url = `${supabaseUrl}/functions/v1/manage-contest-cover`;
    const token = refreshData.session.access_token;

    console.log('[deleteCoverImage] Calling edge function', { url });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contestId, action: 'delete' }),
      });

      console.log('[deleteCoverImage] Response', {
        status: response.status,
        statusText: response.statusText,
      });

      const text = await response.text();
      console.log('[deleteCoverImage] Response body', text.slice(0, 500));

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(`Non-JSON response (${response.status}): ${text.slice(0, 200)}`);
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Delete failed (${response.status})`);
      }

      console.log('[deleteCoverImage] Success');
    } catch (err) {
      console.error('[deleteCoverImage] Fetch error', err);
      throw err;
    }
  },
};
