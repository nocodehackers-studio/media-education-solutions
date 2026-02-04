// Story 4-4: Tests for useVideoUpload hook
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useVideoUpload } from './useVideoUpload'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

// Mock tus-js-client
vi.mock('tus-js-client', () => ({
  Upload: vi.fn().mockImplementation((file, options) => ({
    start: vi.fn(),
    abort: vi.fn(),
    findPreviousUploads: vi.fn().mockResolvedValue([]),
    resumeFromPreviousUpload: vi.fn(),
    _options: options,
    _file: file,
  })),
}))

import { supabase } from '@/lib/supabase'
import * as tus from 'tus-js-client'

describe('useVideoUpload', () => {
  const defaultParams = {
    contestId: 'contest-123',
    categoryId: 'category-456',
    participantId: 'participant-789',
    participantCode: 'ABC123',
    onComplete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial state', () => {
    it('returns idle state initially', () => {
      const { result } = renderHook(() => useVideoUpload(defaultParams))

      expect(result.current.uploadState).toEqual({
        status: 'idle',
        progress: 0,
        speed: 0,
        fileName: null,
        error: null,
      })
    })

    it('provides startUpload, retryUpload, and cancelUpload functions', () => {
      const { result } = renderHook(() => useVideoUpload(defaultParams))

      expect(typeof result.current.startUpload).toBe('function')
      expect(typeof result.current.retryUpload).toBe('function')
      expect(typeof result.current.cancelUpload).toBe('function')
    })
  })

  describe('startUpload', () => {
    it('sets uploading state when starting', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          submissionId: 'sub-123',
          bunnyVideoId: 'bunny-456',
          libraryId: 'lib-789',
          authorizationSignature: 'sig-abc',
          expirationTime: Date.now() + 3600000,
        },
        error: null,
      })

      const { result } = renderHook(() => useVideoUpload(defaultParams))
      const file = new File(['video'], 'test.mp4', { type: 'video/mp4' })

      act(() => {
        result.current.startUpload(file, { studentName: 'Test', tlcName: 'Teacher', tlcEmail: 'test@test.com' })
      })

      expect(result.current.uploadState.status).toBe('uploading')
      expect(result.current.uploadState.fileName).toBe('test.mp4')
    })

    it('calls create-video-upload edge function with correct params', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          submissionId: 'sub-123',
          bunnyVideoId: 'bunny-456',
          libraryId: 'lib-789',
          authorizationSignature: 'sig-abc',
          expirationTime: Date.now() + 3600000,
        },
        error: null,
      })

      const { result } = renderHook(() => useVideoUpload(defaultParams))
      const file = new File(['video'], 'test.mp4', { type: 'video/mp4' })

      await act(async () => {
        await result.current.startUpload(file, { studentName: 'Test', tlcName: 'Teacher', tlcEmail: 'test@test.com' })
      })

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'create-video-upload',
        {
          body: {
            contestId: 'contest-123',
            categoryId: 'category-456',
            participantId: 'participant-789',
            participantCode: 'ABC123',
            fileName: 'test.mp4',
            fileSize: file.size,
            studentName: 'Test',
            tlcName: 'Teacher',
            tlcEmail: 'test@test.com',
            groupMemberNames: undefined,
          },
        }
      )
    })

    it('sets error state when edge function fails', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: false, error: 'CATEGORY_CLOSED' },
        error: null,
      })

      const { result } = renderHook(() => useVideoUpload(defaultParams))
      const file = new File(['video'], 'test.mp4', { type: 'video/mp4' })

      await act(async () => {
        await result.current.startUpload(file, { studentName: 'Test', tlcName: 'Teacher', tlcEmail: 'test@test.com' })
      })

      await waitFor(() => {
        expect(result.current.uploadState.status).toBe('error')
        expect(result.current.uploadState.error).toBe(
          'This category is no longer accepting submissions.'
        )
      })
    })

    it('creates TUS upload with correct headers', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          submissionId: 'sub-123',
          bunnyVideoId: 'bunny-456',
          libraryId: 'lib-789',
          authorizationSignature: 'sig-abc',
          expirationTime: 1234567890,
        },
        error: null,
      })

      const { result } = renderHook(() => useVideoUpload(defaultParams))
      const file = new File(['video'], 'test.mp4', { type: 'video/mp4' })

      await act(async () => {
        await result.current.startUpload(file, { studentName: 'Test', tlcName: 'Teacher', tlcEmail: 'test@test.com' })
      })

      expect(tus.Upload).toHaveBeenCalledWith(
        file,
        expect.objectContaining({
          endpoint: 'https://video.bunnycdn.com/tusupload',
          headers: {
            AuthorizationSignature: 'sig-abc',
            AuthorizationExpire: '1234567890',
            VideoId: 'bunny-456',
            LibraryId: 'lib-789',
          },
        })
      )
    })
  })

  describe('cancelUpload', () => {
    it('resets state to idle', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          submissionId: 'sub-123',
          bunnyVideoId: 'bunny-456',
          libraryId: 'lib-789',
          authorizationSignature: 'sig-abc',
          expirationTime: Date.now() + 3600000,
        },
        error: null,
      })

      const { result } = renderHook(() => useVideoUpload(defaultParams))
      const file = new File(['video'], 'test.mp4', { type: 'video/mp4' })

      await act(async () => {
        await result.current.startUpload(file, { studentName: 'Test', tlcName: 'Teacher', tlcEmail: 'test@test.com' })
      })

      act(() => {
        result.current.cancelUpload()
      })

      expect(result.current.uploadState).toEqual({
        status: 'idle',
        progress: 0,
        speed: 0,
        fileName: null,
        error: null,
      })
    })
  })

  describe('retryUpload', () => {
    it('restarts upload with previously selected file', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: { success: false, error: 'UPLOAD_INIT_FAILED' },
        error: null,
      })

      const { result } = renderHook(() => useVideoUpload(defaultParams))
      const file = new File(['video'], 'test.mp4', { type: 'video/mp4' })

      await act(async () => {
        await result.current.startUpload(file, { studentName: 'Test', tlcName: 'Teacher', tlcEmail: 'test@test.com' })
      })

      // Should be in error state
      await waitFor(() => {
        expect(result.current.uploadState.status).toBe('error')
      })

      // Mock successful response for retry
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: {
          success: true,
          submissionId: 'sub-123',
          bunnyVideoId: 'bunny-456',
          libraryId: 'lib-789',
          authorizationSignature: 'sig-abc',
          expirationTime: Date.now() + 3600000,
        },
        error: null,
      })

      act(() => {
        result.current.retryUpload()
      })

      expect(result.current.uploadState.status).toBe('uploading')
    })
  })

  describe('Error message mapping', () => {
    const errorCases = [
      ['FILE_TOO_LARGE', 'File too large. Maximum size is 500MB'],
      ['INVALID_PARTICIPANT', 'Invalid participant session. Please re-enter your codes.'],
      ['CATEGORY_NOT_FOUND', 'Category not found.'],
      ['CATEGORY_TYPE_MISMATCH', 'This category does not accept video submissions.'],
      ['CATEGORY_CLOSED', 'This category is no longer accepting submissions.'],
      ['DEADLINE_PASSED', 'The deadline for this category has passed.'],
      ['BUNNY_CONFIG_MISSING', 'Upload service configuration error. Please contact support.'],
      ['UPLOAD_INIT_FAILED', 'Failed to initialize upload. Please try again.'],
      ['UNKNOWN_CODE', 'An unexpected error occurred. Please try again.'],
    ]

    it.each(errorCases)('maps %s to user-friendly message', async (code, message) => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: false, error: code },
        error: null,
      })

      const { result } = renderHook(() => useVideoUpload(defaultParams))
      const file = new File(['video'], 'test.mp4', { type: 'video/mp4' })

      await act(async () => {
        await result.current.startUpload(file, { studentName: 'Test', tlcName: 'Teacher', tlcEmail: 'test@test.com' })
      })

      await waitFor(() => {
        expect(result.current.uploadState.error).toBe(message)
      })
    })
  })
})
