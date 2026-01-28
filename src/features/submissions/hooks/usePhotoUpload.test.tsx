// Story 4-5: Tests for usePhotoUpload hook
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePhotoUpload } from './usePhotoUpload'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

// Mock XMLHttpRequest as a proper constructor
class MockXMLHttpRequest {
  static instances: MockXMLHttpRequest[] = []

  open = vi.fn()
  send = vi.fn()
  setRequestHeader = vi.fn()
  abort = vi.fn()
  upload = {
    addEventListener: vi.fn(),
  }
  addEventListener = vi.fn()
  status = 200

  constructor() {
    MockXMLHttpRequest.instances.push(this)
  }

  static reset() {
    MockXMLHttpRequest.instances = []
  }

  static getLastInstance() {
    return MockXMLHttpRequest.instances[MockXMLHttpRequest.instances.length - 1]
  }
}

vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest)

import { supabase } from '@/lib/supabase'

describe('usePhotoUpload', () => {
  const defaultParams = {
    contestId: 'contest-123',
    categoryId: 'category-456',
    participantId: 'participant-789',
    participantCode: 'ABC123',
    onComplete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    MockXMLHttpRequest.reset()
  })

  describe('Initial state', () => {
    it('returns idle state initially', () => {
      const { result } = renderHook(() => usePhotoUpload(defaultParams))

      expect(result.current.uploadState).toEqual({
        status: 'idle',
        progress: 0,
        speed: 0,
        fileName: null,
        error: null,
      })
    })

    it('provides startUpload, retryUpload, cancelUpload, and isUploading', () => {
      const { result } = renderHook(() => usePhotoUpload(defaultParams))

      expect(typeof result.current.startUpload).toBe('function')
      expect(typeof result.current.retryUpload).toBe('function')
      expect(typeof result.current.cancelUpload).toBe('function')
      expect(result.current.isUploading).toBe(false)
    })
  })

  describe('startUpload', () => {
    it('sets uploading state when starting', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          submissionId: 'sub-123',
          uploadUrl: 'https://storage.bunnycdn.com/zone/path',
          accessKey: 'key-123',
          contentType: 'image/jpeg',
        },
        error: null,
      })

      const { result } = renderHook(() => usePhotoUpload(defaultParams))
      const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })

      act(() => {
        result.current.startUpload(file)
      })

      expect(result.current.uploadState.status).toBe('uploading')
      expect(result.current.uploadState.fileName).toBe('test.jpg')
      expect(result.current.isUploading).toBe(true)
    })

    it('calls create-photo-upload edge function with correct params', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          submissionId: 'sub-123',
          uploadUrl: 'https://storage.bunnycdn.com/zone/path',
          accessKey: 'key-123',
          contentType: 'image/jpeg',
        },
        error: null,
      })

      const { result } = renderHook(() => usePhotoUpload(defaultParams))
      const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })

      await act(async () => {
        await result.current.startUpload(file)
      })

      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'create-photo-upload',
        {
          body: {
            contestId: 'contest-123',
            categoryId: 'category-456',
            participantId: 'participant-789',
            participantCode: 'ABC123',
            fileName: 'test.jpg',
            fileSize: file.size,
            contentType: 'image/jpeg',
          },
        }
      )
    })

    it('sets error state when edge function fails', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: false, error: 'CATEGORY_CLOSED' },
        error: null,
      })

      const { result } = renderHook(() => usePhotoUpload(defaultParams))
      const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })

      await act(async () => {
        await result.current.startUpload(file)
      })

      await waitFor(() => {
        expect(result.current.uploadState.status).toBe('error')
        expect(result.current.uploadState.error).toBe(
          'This category is no longer accepting submissions.'
        )
      })
    })

    it('configures XMLHttpRequest with correct headers', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          submissionId: 'sub-123',
          uploadUrl: 'https://storage.bunnycdn.com/zone/path',
          accessKey: 'key-123',
          contentType: 'image/png',
        },
        error: null,
      })

      const { result } = renderHook(() => usePhotoUpload(defaultParams))
      const file = new File(['photo'], 'test.png', { type: 'image/png' })

      await act(async () => {
        await result.current.startUpload(file)
      })

      const xhr = MockXMLHttpRequest.getLastInstance()
      expect(xhr).toBeDefined()
      expect(xhr.open).toHaveBeenCalledWith(
        'PUT',
        'https://storage.bunnycdn.com/zone/path'
      )
      expect(xhr.setRequestHeader).toHaveBeenCalledWith('AccessKey', 'key-123')
      expect(xhr.setRequestHeader).toHaveBeenCalledWith(
        'Content-Type',
        'image/png'
      )
      expect(xhr.send).toHaveBeenCalledWith(file)
    })
  })

  describe('cancelUpload', () => {
    it('resets state to idle and aborts XHR', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          submissionId: 'sub-123',
          uploadUrl: 'https://storage.bunnycdn.com/zone/path',
          accessKey: 'key-123',
          contentType: 'image/jpeg',
        },
        error: null,
      })

      const { result } = renderHook(() => usePhotoUpload(defaultParams))
      const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })

      await act(async () => {
        await result.current.startUpload(file)
      })

      const xhr = MockXMLHttpRequest.getLastInstance()

      act(() => {
        result.current.cancelUpload()
      })

      expect(xhr.abort).toHaveBeenCalled()
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

      const { result } = renderHook(() => usePhotoUpload(defaultParams))
      const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })

      await act(async () => {
        await result.current.startUpload(file)
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
          uploadUrl: 'https://storage.bunnycdn.com/zone/path',
          accessKey: 'key-123',
          contentType: 'image/jpeg',
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
      ['FILE_TOO_LARGE', 'File too large. Maximum size is 10MB'],
      [
        'INVALID_FILE_TYPE',
        'Invalid file type. Supported formats: JPG, PNG, WebP, GIF',
      ],
      [
        'INVALID_PARTICIPANT',
        'Invalid participant session. Please re-enter your code.',
      ],
      ['CATEGORY_NOT_FOUND', 'Category not found.'],
      [
        'CATEGORY_TYPE_MISMATCH',
        'This category does not accept photo submissions.',
      ],
      ['CATEGORY_CLOSED', 'This category is no longer accepting submissions.'],
      ['DEADLINE_PASSED', 'The deadline for this category has passed.'],
      [
        'BUNNY_CONFIG_MISSING',
        'Upload service configuration error. Please contact support.',
      ],
      ['UPLOAD_INIT_FAILED', 'Failed to initialize upload. Please try again.'],
      ['UNKNOWN_CODE', 'An unexpected error occurred. Please try again.'],
    ]

    it.each(errorCases)(
      'maps %s to user-friendly message',
      async (code, message) => {
        vi.mocked(supabase.functions.invoke).mockResolvedValue({
          data: { success: false, error: code },
          error: null,
        })

        const { result } = renderHook(() => usePhotoUpload(defaultParams))
        const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })

        await act(async () => {
          await result.current.startUpload(file)
        })

        await waitFor(() => {
          expect(result.current.uploadState.error).toBe(message)
        })
      }
    )
  })
})
