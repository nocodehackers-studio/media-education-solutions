// Story 6-6: Public winners API client — calls edge functions

import { supabase } from '@/lib/supabase';
import type { ContestPublicMetadata, WinnersValidationResponse } from '../types/publicWinners.types';

export const publicWinnersApi = {
  async getContestMetadata(contestCode: string): Promise<ContestPublicMetadata> {
    const { data, error } = await supabase.functions.invoke('get-contest-public-metadata', {
      body: { contestCode },
    });

    if (error) throw new Error('Failed to load contest');
    if (!data.success) throw new Error(data.error || 'CONTEST_NOT_FOUND');

    return {
      name: data.name,
      coverImageUrl: data.coverImageUrl ?? null,
      winnersPageEnabled: data.winnersPageEnabled,
    };
  },

  async validatePassword(contestCode: string, password: string): Promise<WinnersValidationResponse> {
    const { data, error } = await supabase.functions.invoke('validate-winners-password', {
      body: { contestCode, password },
    });

    if (error) throw new Error('Validation failed');
    return data as WinnersValidationResponse;
  },
};
