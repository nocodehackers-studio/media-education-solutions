// Story 6-5: Winners page API methods

import { supabase } from '@/lib/supabase';
import type { CategoryApprovalStatus, CategoryWinners, EffectiveWinner } from '../types/winners.types';

export const winnersApi = {
  // Task 4: Category approval methods

  async approveCategory(categoryId: string): Promise<void> {
    // categories table may not be in generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)('categories')
      .update({
        approved_for_winners: true,
        approved_at: new Date().toISOString(), // client-side; Supabase JS can't use SQL now()
      })
      .eq('id', categoryId);

    if (error) throw new Error(`Failed to approve category: ${error.message}`);
  },

  async unapproveCategory(categoryId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)('categories')
      .update({
        approved_for_winners: false,
        approved_at: null,
      })
      .eq('id', categoryId);

    if (error) throw new Error(`Failed to unapprove category: ${error.message}`);
  },

  async getCategoryApprovalStatus(contestId: string): Promise<CategoryApprovalStatus[]> {
    // Categories are linked via divisions -> contests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: categories, error: catError } = await (supabase.from as any)('categories')
      .select(`
        id, name, type, judging_completed_at, approved_for_winners, approved_at,
        divisions!inner(id, name, contest_id)
      `)
      .eq('divisions.contest_id', contestId);

    if (catError) throw new Error(`Failed to fetch categories: ${catError.message}`);
    if (!categories || categories.length === 0) return [];

    const categoryIds = categories.map((c: Record<string, unknown>) => c.id);

    // Get submission counts per category
    const { data: submissions, error: subError } = await supabase
      .from('submissions')
      .select('id, category_id')
      .in('category_id', categoryIds);

    if (subError) throw new Error(`Failed to fetch submissions: ${subError.message}`);

    // Get review counts per category (via submissions) — scoped to contest submissions
    const submissionIds = (submissions || []).map((s: { id: string }) => s.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reviews, error: revError } = await (supabase.from as any)('reviews')
      .select('id, submission_id')
      .in('submission_id', submissionIds);

    if (revError) throw new Error(`Failed to fetch reviews: ${revError.message}`);

    // Get ranking counts per category
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rankings, error: rankError } = await (supabase.from as any)('rankings')
      .select('id, category_id')
      .in('category_id', categoryIds);

    if (rankError) throw new Error(`Failed to fetch rankings: ${rankError.message}`);

    // Build counts maps
    const submissionCounts = new Map<string, number>();
    const submissionCategoryMap = new Map<string, string>();
    for (const s of (submissions || [])) {
      submissionCounts.set(s.category_id, (submissionCounts.get(s.category_id) || 0) + 1);
      submissionCategoryMap.set(s.id, s.category_id);
    }

    // F5 fix: count reviews per category via submission -> category mapping
    const reviewCounts = new Map<string, number>();
    for (const r of (reviews || [])) {
      const catId = submissionCategoryMap.get(r.submission_id as string);
      if (catId) {
        reviewCounts.set(catId, (reviewCounts.get(catId) || 0) + 1);
      }
    }

    const rankingCounts = new Map<string, number>();
    for (const r of (rankings || [])) {
      rankingCounts.set(r.category_id, (rankingCounts.get(r.category_id) || 0) + 1);
    }

    return categories.map((cat: Record<string, unknown>) => {
      const division = cat.divisions as Record<string, unknown>;
      return {
        categoryId: cat.id as string,
        categoryName: cat.name as string,
        divisionName: division.name as string,
        type: cat.type as 'video' | 'photo',
        judgingCompleted: cat.judging_completed_at != null,
        approvedForWinners: (cat.approved_for_winners as boolean) ?? false,
        approvedAt: (cat.approved_at as string) ?? null,
        submissionCount: submissionCounts.get(cat.id as string) || 0,
        reviewCount: reviewCounts.get(cat.id as string) || 0,
        rankingCount: rankingCounts.get(cat.id as string) || 0,
      };
    });
  },

  // Task 5: Winners page management methods

  async generateWinnersPage(contestId: string, password: string): Promise<void> {
    // F1 fix: single atomic UPDATE to avoid partial state on failure
    // F3 note: client-side timestamp — Supabase JS client can't inject SQL now();
    // consistent with existing codebase pattern (adminSubmissionsApi.ts)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)('contests')
      .update({
        winners_page_password: password,
        winners_page_enabled: true,
        winners_page_generated_at: new Date().toISOString(),
        status: 'finished',
      })
      .eq('id', contestId);

    if (error) throw new Error(`Failed to generate winners page: ${error.message}`);

    // Story 7-4: True fire-and-forget T/L/C notification
    // Edge Function checks notify_tlc flag internally; do NOT await — caller should not block
    supabase.functions.invoke('send-tlc-notification', {
      body: { contestId },
    }).then(({ error }) => {
      if (error) console.warn('T/L/C notification failed (non-blocking):', error);
    });
  },

  async updateWinnersPassword(contestId: string, password: string): Promise<void> {
    const { error } = await supabase
      .from('contests')
      .update({ winners_page_password: password })
      .eq('id', contestId);

    if (error) throw new Error(`Failed to update winners password: ${error.message}`);
  },

  async revokeWinnersPage(contestId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)('contests')
      .update({ winners_page_enabled: false })
      .eq('id', contestId);

    if (error) throw new Error(`Failed to revoke winners page: ${error.message}`);
  },

  async reactivateWinnersPage(contestId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from as any)('contests')
      .update({
        winners_page_enabled: true,
        winners_page_generated_at: new Date().toISOString(),
      })
      .eq('id', contestId);

    if (error) throw new Error(`Failed to reactivate winners page: ${error.message}`);
  },

  // Task 6: Effective rankings query for preview

  async getEffectiveWinners(contestId: string): Promise<CategoryWinners[]> {
    // 1. Get approved categories for the contest (via divisions)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: categories, error: catError } = await (supabase.from as any)('categories')
      .select('id, name, type, divisions!inner(name, contest_id)')
      .eq('divisions.contest_id', contestId)
      .eq('approved_for_winners', true);

    if (catError) throw new Error(`Failed to fetch approved categories: ${catError.message}`);
    if (!categories || categories.length === 0) return [];

    const categoryIds = categories.map((c: Record<string, unknown>) => c.id as string);

    // 2. Get rankings for these categories
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rankings, error: rankError } = await (supabase.from as any)('rankings')
      .select('id, rank, category_id, submission_id, admin_ranking_override')
      .in('category_id', categoryIds)
      .lte('rank', 3)
      .order('rank');

    if (rankError) throw new Error(`Failed to fetch rankings: ${rankError.message}`);
    if (!rankings || rankings.length === 0) {
      return categories.map((cat: Record<string, unknown>) => ({
        categoryId: cat.id as string,
        categoryName: cat.name as string,
        divisionName: (cat.divisions as Record<string, unknown>).name as string,
        winners: [],
      }));
    }

    // 3. Collect all submission IDs we need (both regular and override)
    const submissionIds = new Set<string>();
    for (const r of rankings) {
      if (r.admin_ranking_override) submissionIds.add(r.admin_ranking_override);
      if (r.submission_id) submissionIds.add(r.submission_id);
    }

    // 4. Fetch submission details with participant info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: submissions, error: subError } = await (supabase.from as any)('submissions')
      .select('id, media_url, thumbnail_url, media_type, status, participant_id, participants!inner(name, organization_name)')
      .in('id', Array.from(submissionIds));

    if (subError) throw new Error(`Failed to fetch submissions: ${subError.message}`);

    // Build submissions map
    const submissionMap = new Map<string, Record<string, unknown>>();
    for (const s of (submissions || [])) {
      submissionMap.set(s.id, s as unknown as Record<string, unknown>);
    }

    // 5. Build CategoryWinners array
    const result: CategoryWinners[] = [];

    for (const cat of categories) {
      const catRankings = (rankings as Record<string, unknown>[])
        .filter((r) => r.category_id === cat.id)
        .sort((a, b) => (a.rank as number) - (b.rank as number));

      const winners: EffectiveWinner[] = [];

      for (const ranking of catRankings) {
        // Apply effective logic: admin override takes precedence
        const effectiveId = (ranking.admin_ranking_override || ranking.submission_id) as string;
        const sub = submissionMap.get(effectiveId);

        // F4 fix: return vacant marker instead of silently dropping disqualified winners
        if (!sub || (sub.status as string) === 'disqualified') {
          winners.push({
            rank: ranking.rank as number,
            submissionId: '',
            participantName: '',
            institution: '',
            categoryName: cat.name as string,
            mediaType: '',
            mediaUrl: '',
            thumbnailUrl: null,
            vacant: true,
          });
          continue;
        }

        const participant = sub.participants as Record<string, unknown>;

        winners.push({
          rank: ranking.rank as number,
          submissionId: effectiveId,
          participantName: (participant?.name as string) || 'Unknown',
          institution: (participant?.organization_name as string) || '',
          categoryName: cat.name as string,
          mediaType: sub.media_type as string,
          mediaUrl: sub.media_url as string,
          thumbnailUrl: (sub.thumbnail_url as string) || null,
          vacant: false,
        });
      }

      result.push({
        categoryId: cat.id as string,
        categoryName: cat.name as string,
        divisionName: (cat.divisions as Record<string, unknown>).name as string,
        winners,
      });
    }

    return result;
  },
};
