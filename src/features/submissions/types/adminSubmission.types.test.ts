// Story 6-2: Transform function and helper tests

import { describe, it, expect } from 'vitest'
import { transformAdminSubmission, formatRankingPosition } from './adminSubmission.types'
import type { AdminSubmissionRow } from './adminSubmission.types'

function makeBaseRow(overrides: Partial<AdminSubmissionRow> = {}): AdminSubmissionRow {
  return {
    id: 'sub-1',
    media_type: 'photo',
    media_url: 'https://example.com/photo.jpg',
    bunny_video_id: null,
    thumbnail_url: null,
    status: 'submitted',
    submitted_at: '2026-01-30T10:00:00Z',
    created_at: '2026-01-30T10:00:00Z',
    participants: {
      id: 'p-1',
      code: 'ABC12345',
      name: 'Alice',
      organization_name: 'School',
      tlc_name: 'Teacher',
      tlc_email: 'teacher@test.com',
    },
    categories: {
      id: 'cat-1',
      name: 'Photography',
      type: 'photo',
      assigned_judge_id: 'judge-1',
      divisions: { contest_id: 'contest-1' },
      assigned_judge: { first_name: 'Jane', last_name: 'Doe' },
    },
    reviews: [],
    rankings: [],
    ...overrides,
  }
}

describe('transformAdminSubmission', () => {
  it('transforms base fields correctly', () => {
    const result = transformAdminSubmission(makeBaseRow())

    expect(result.id).toBe('sub-1')
    expect(result.mediaType).toBe('photo')
    expect(result.participantCode).toBe('ABC12345')
    expect(result.categoryName).toBe('Photography')
  })

  it('maps review data when present', () => {
    const row = makeBaseRow({
      reviews: [{
        id: 'rev-1',
        judge_id: 'judge-1',
        rating: 7,
        feedback: 'Great work',
        updated_at: '2026-01-31T10:00:00Z',
        judge: { first_name: 'Jane', last_name: 'Doe' },
      }],
    })

    const result = transformAdminSubmission(row)

    expect(result.review).not.toBeNull()
    expect(result.review!.reviewId).toBe('rev-1')
    expect(result.review!.rating).toBe(7)
    expect(result.review!.judgeName).toBe('Jane Doe')
    expect(result.review!.ratingTier).toBe('Advanced Producer')
    expect(result.review!.feedback).toBe('Great work')
  })

  it('returns null review when reviews array is empty', () => {
    const result = transformAdminSubmission(makeBaseRow({ reviews: [] }))
    expect(result.review).toBeNull()
  })

  it('returns null review when reviews is null', () => {
    const result = transformAdminSubmission(makeBaseRow({ reviews: null }))
    expect(result.review).toBeNull()
  })

  it('handles null rating in review', () => {
    const row = makeBaseRow({
      reviews: [{
        id: 'rev-1',
        judge_id: 'judge-1',
        rating: null,
        feedback: 'Partial review',
        updated_at: '2026-01-31T10:00:00Z',
        judge: { first_name: 'Jane', last_name: 'Doe' },
      }],
    })

    const result = transformAdminSubmission(row)

    expect(result.review).not.toBeNull()
    expect(result.review!.rating).toBeNull()
    expect(result.review!.ratingTier).toBeNull()
  })

  it('maps ranking position when present', () => {
    const row = makeBaseRow({ rankings: [{ rank: 2 }] })
    const result = transformAdminSubmission(row)
    expect(result.rankingPosition).toBe(2)
  })

  it('returns null ranking when rankings is empty', () => {
    const result = transformAdminSubmission(makeBaseRow({ rankings: [] }))
    expect(result.rankingPosition).toBeNull()
  })

  it('returns null ranking when rankings is null', () => {
    const result = transformAdminSubmission(makeBaseRow({ rankings: null }))
    expect(result.rankingPosition).toBeNull()
  })

  it('builds assigned judge name from profile', () => {
    const result = transformAdminSubmission(makeBaseRow())
    expect(result.assignedJudgeName).toBe('Jane Doe')
  })

  it('returns null assignedJudgeName when no assigned judge profile', () => {
    const row = makeBaseRow({
      categories: {
        id: 'cat-1',
        name: 'Photography',
        type: 'photo',
        assigned_judge_id: null,
        divisions: { contest_id: 'contest-1' },
        assigned_judge: null,
      },
    })

    const result = transformAdminSubmission(row)
    expect(result.assignedJudgeName).toBeNull()
  })

  it('returns "Unknown Judge" when judge profile has null names', () => {
    const row = makeBaseRow({
      reviews: [{
        id: 'rev-1',
        judge_id: 'judge-1',
        rating: 5,
        feedback: null,
        updated_at: '2026-01-31T10:00:00Z',
        judge: { first_name: null, last_name: null },
      }],
    })

    const result = transformAdminSubmission(row)
    expect(result.review!.judgeName).toBe('Unknown Judge')
  })

  it('returns "Unknown Judge" when review judge profile is null', () => {
    const row = makeBaseRow({
      reviews: [{
        id: 'rev-1',
        judge_id: 'judge-1',
        rating: 5,
        feedback: null,
        updated_at: '2026-01-31T10:00:00Z',
        judge: null,
      }],
    })

    const result = transformAdminSubmission(row)
    expect(result.review!.judgeName).toBe('Unknown Judge')
  })

  it('uses only first review when multiple exist', () => {
    const row = makeBaseRow({
      reviews: [
        {
          id: 'rev-1',
          judge_id: 'judge-1',
          rating: 8,
          feedback: 'First',
          updated_at: '2026-01-31T10:00:00Z',
          judge: { first_name: 'Jane', last_name: 'Doe' },
        },
        {
          id: 'rev-2',
          judge_id: 'judge-2',
          rating: 5,
          feedback: 'Second',
          updated_at: '2026-01-31T11:00:00Z',
          judge: { first_name: 'Bob', last_name: 'Smith' },
        },
      ],
    })

    const result = transformAdminSubmission(row)
    expect(result.review!.reviewId).toBe('rev-1')
    expect(result.review!.rating).toBe(8)
  })
})

describe('formatRankingPosition', () => {
  it('formats 1st, 2nd, 3rd', () => {
    expect(formatRankingPosition(1)).toBe('1st')
    expect(formatRankingPosition(2)).toBe('2nd')
    expect(formatRankingPosition(3)).toBe('3rd')
  })

  it('falls back to th suffix for other numbers', () => {
    expect(formatRankingPosition(4)).toBe('4th')
  })
})
