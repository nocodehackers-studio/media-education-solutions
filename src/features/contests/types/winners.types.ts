// Story 6-5: Winners page types

export interface CategoryApprovalStatus {
  categoryId: string;
  categoryName: string;
  divisionName: string;
  type: 'video' | 'photo';
  judgingCompleted: boolean;
  approvedForWinners: boolean;
  approvedAt: string | null;
  submissionCount: number;
  reviewCount: number;
  rankingCount: number;
}

export interface EffectiveWinner {
  rank: number;
  submissionId: string;
  participantName: string;
  institution: string;
  categoryName: string;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl: string | null;
  vacant: boolean;
}

export interface CategoryWinners {
  categoryId: string;
  categoryName: string;
  divisionName: string;
  winners: EffectiveWinner[];
}
