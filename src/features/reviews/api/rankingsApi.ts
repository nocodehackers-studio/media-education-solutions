// Rankings API - Story 5.5
// Supabase operations for judge top 3 ranking

import { supabase } from '@/lib/supabase';
import { transformRanking } from '../types/review.types';
import type { Ranking, RankingRow } from '../types/review.types';

export const rankingsApi = {
  async getRankings(categoryId: string, judgeId: string): Promise<Ranking[]> {
    // rankings table created by migration, not yet in generated Supabase types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from as any)('rankings')
      .select('*')
      .match({ category_id: categoryId, judge_id: judgeId })
      .order('rank', { ascending: true });

    if (error) throw error;

    return ((data ?? []) as RankingRow[]).map(transformRanking);
  },

  async saveRankings(
    categoryId: string,
    judgeId: string,
    rankings: { rank: number; submissionId: string }[]
  ): Promise<void> {
    const payload = rankings.map((r) => ({
      rank: r.rank,
      submission_id: r.submissionId,
    }));

    // Atomic delete+insert via Postgres RPC (single transaction)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('save_rankings', {
      p_category_id: categoryId,
      p_judge_id: judgeId,
      p_rankings: payload,
    });

    if (error) throw error;
  },
};
