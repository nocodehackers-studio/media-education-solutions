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
    // 1. Generate contest code if not provided
    const contestCode = input.contestCode && input.contestCode.length === 6
      ? input.contestCode
      : generateContestCode();

    // 2. Generate slug from name
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    // 3. Insert contest
    const { data: contest, error: contestError } = await supabase
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

    if (contestError) {
      // Handle duplicate contest code
      if (contestError.code === '23505') {
        throw new Error('Contest code already exists');
      }
      throw new Error(`Failed to create contest: ${contestError.message}`);
    }

    if (!contest) {
      throw new Error('Contest creation returned no data');
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
      // Log error but don't fail the contest creation
      // Admin can manually generate codes later if needed
      console.error('Failed to generate participant codes:', codesError);
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
