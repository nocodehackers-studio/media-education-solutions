// Story 4-5: Tests for usePhotoUpload hook (secure server-side proxy version)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePhotoUpload } from './usePhotoUpload'

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
  responseText = ''

  constructor() {
    MockXMLHttpRequest.instances.push(this)
  }

  static reset() {
    MockXMLHttpRequest.instances = []
  }

  static getLastInstance() {
    return MockXMLHttpRequest.instances[MockXMLHttpRequest.instances.length - 1]
  }

  // Helper to simulate events
  simulateLoad(status: number, response: object) {
    this.status = status
    this.responseText = JSON.stringify(response)
    const loadHandler = this.addEventListener.mock.calls.find(
      (call) => call[0] === 'load'
    )?.[1]
    if (loadHandler) loadHandler()
  }

  simulateError() {
    const errorHandler = this.addEventListener.mock.calls.find(
      (call) => call[0] === 'error'
    )?.[1]
    if (errorHandler) errorHandler()
  }

  simulateAbort() {
    const abortHandler = this.addEventListener.mock.calls.find(
      (call) => call[0] === 'abort'
    )?.[1]
    if (abortHandler) abortHandler()
  }

  simulateProgress(loaded: number, total: number) {
    const progressHandler = this.upload.addEventListener.mock.calls.find(
      (call) => call[0] === 'progress'
    )?.[1]
    if (progressHandler) {
      progressHandler({ lengthComputable: true, loaded, total })
    }
  }
}

vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest)

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

  afterEach(() => {
    vi.useRealTimers()
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
      const { result } = renderHook(() => usePhotoUpload(defaultParams))
      const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })

      act(() => {
        result.current.startUpload(file, { studentName: 'Test', tlcName: 'Teacher', tlcEmail: 'test@test.com' })
      })

      expect(result.current.uploadState.status).toBe('uploading')
      expect(result.current.uploadState.fileName).toBe('test.jpg')
      expect(result.current.isUploading).toBe(true)
    })

    it('sends FormData to upload-photo edge function', async () => {
      const { result } = renderHook(() => usePhotoUpload(defaultParams))
      const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })

      act(() => {
        result.current.startUpload(file, { studentName: 'Test', tlcName: 'Teacher', tlcEmail: 'test@test.com' })
      })

      const xhr = MockXMLHttpRequest.getLastInstance()
      expect(xhr).toBeDefined()
      // Verify it calls the upload-photo endpoint with POST
      expect(xhr.open).toHaveBeenCalledWith(
        'POST',
        expect.stringContaining('/functions/v1/upload-photo')
      )
      // Verify auth headers are set (values come from env)
      expect(xhr.setRequestHeader).toHaveBeenCalledWith(
        'apikey',
        expect.any(String)
      )
      expect(xhr.setRequestHeader).toHaveBeenCalledWith(
        'Authorization',
        expect.stringContaining('Bearer ')
      )

      // Verify FormData was sent with correct metadata
      expect(xhr.send).toHaveBeenCalled()
      const sentFormData = xhr.send.mock.calls[0][0]
      expect(sentFormData).toBeInstanceOf(FormData)
      expect(sentFormData.get('file')).toBe(file)
      expect(sentFormData.get('contestId')).toBe('contest-123')
      expect(sentFormData.get('categoryId')).toBe('category-456')
      expect(sentFormData.get('participantId')).toBe('participant-789')
      expect(sentFormData.get('participantCode')).toBe('ABC123')
    })

    it('handles successful upload response', async () => {
      const onComplete = vi.fn()
      const { result } = renderHook(() =>
        usePhotoUpload({ ...defaultParams, onComplete })
      )
      const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })

      act(() => {
        result.current.startUpload(file, { studentName: 'Test', tlcName: 'Teacher', tlcEmail: 'test@test.com' })
      })

      const xhr = MockXMLHttpRequest.getLastInstance()

      act(() => {
        xhr.simulateLoad(200, {
          success: true,
          submissionId: 'sub-123',
          mediaUrl: 'https://cdn.example.com/photo.jpg',
        })
      })

      await waitFor(() => {
        expect(result.current.uploadState.status).toBe('complete')
        expect(result.current.uploadState.progress).toBe(100)
      })
      expect(onComplete).toHaveBeenCalledWith('sub-123')
    })

    it('handles error response from edge function', async () => {
      const { result } = renderHook(() => usePhotoUpload(defaultParams))
      const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })

      act(() => {
        result.current.startUpload(file, { studentName: 'Test', tlcName: 'Teacher', tlcEmail: 'test@test.com' })
      })

      const xhr = MockXMLHttpRequest.getLastInstance()

      act(() => {
        xhr.simulateLoad(200, {
          success: false,
          error: 'CATEGORY_CLOSED',
        })
      })

      await waitFor(() => {
        expect(result.current.uploadState.status).toBe('error')
        expect(result.current.uploadState.error).toBe(
          'This category is no longer accepting submissions.'
        )
      })
    })

    it('handles HTTP error status', async () => {
      const { result } = renderHook(() => usePhotoUpload(defaultParams))
      const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })

      act(() => {
        result.current.startUpload(file, { studentName: 'Test', tlcName: 'Teacher', tlcEmail: 'test@test.com' })
      })

      const xhr = MockXMLHttpRequest.getLastInstance()

      act(() => {
        xhr.simulateLoad(500, {
          success: false,
          error: 'STORAGE_UPLOAD_FAILED',
        })
      })

      await waitFor(() => {
        expect(result.current.uploadState.status).toBe('error')
        expect(result.current.uploadState.error).toBe(
          'Failed to store file. Please try again.'
        )
      })
    })

    it('handles network error', async () => {
      const { result } = renderHook(() => usePhotoUpload(defaultParams))
      const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })

      act(() => {
        result.current.startUpload(file, { studentName: 'Test', tlcName: 'Teacher', tlcEmail: 'test@test.com' })
      })

      const xhr = MockXMLHttpRequest.getLastInstance()

      act(() => {
        xhr.simulateError()
      })

      await waitFor(() => {
        expect(result.current.uploadState.status).toBe('error')
        expect(result.current.uploadState.error).toBe(
          'Network error. Please check your connection and try again.'
        )
      })
    })
  })

  describe('Upload progress', () => {
    it('tracks progress percentage', async () => {
      vi.useFakeTimers()
      const { result } = renderHook(() => usePhotoUpload(defaultParams))
      const file = new File(['photo content here'], 'test.jpg', {
        type: 'image/jpeg',
      })

      act(() => {
        result.current.startUpload(file, { studentName: 'Test', tlcName: 'Teacher', tlcEmail: 'test@test.com' })
      })

      const xhr = MockXMLHttpRequest.getLastInstance()

      act(() => {
        vi.advanceTimersByTime(100)
        xhr.simulateProgress(5000, 10000)
      })

      expect(result.current.uploadState.progress).toBe(50)
    })
  })

  describe('cancelUpload', () => {
    it('resets state to idle and aborts XHR', async () => {
      const { result } = renderHook(() => usePhotoUpload(defaultParams))
      const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })

      act(() => {
        result.current.startUpload(file, { studentName: 'Test', tlcName: 'Teacher', tlcEmail: 'test@test.com' })
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

    it('handles abort event from XHR', async () => {
      const { result } = renderHook(() => usePhotoUpload(defaultParams))
      const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })

      act(() => {
        result.current.startUpload(file, { studentName: 'Test', tlcName: 'Teacher', tlcEmail: 'test@test.com' })
      })

      const xhr = MockXMLHttpRequest.getLastInstance()

      act(() => {
        xhr.simulateAbort()
      })

      expect(result.current.uploadState.status).toBe('idle')
    })
  })

  describe('retryUpload', () => {
    it('restarts upload with previously selected file', async () => {
      const { result } = renderHook(() => usePhotoUpload(defaultParams))
      const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })

      act(() => {
        result.current.startUpload(file, { studentName: 'Test', tlcName: 'Teacher', tlcEmail: 'test@test.com' })
      })

      const xhr1 = MockXMLHttpRequest.getLastInstance()

      act(() => {
        xhr1.simulateLoad(200, { success: false, error: 'STORAGE_UPLOAD_FAILED' })
      })

      // Should be in error state
      await waitFor(() => {
        expect(result.current.uploadState.status).toBe('error')
      })

      // Retry
      act(() => {
        result.current.retryUpload()
      })

      expect(result.current.uploadState.status).toBe('uploading')
      expect(MockXMLHttpRequest.instances.length).toBe(2)
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
      ['STORAGE_UPLOAD_FAILED', 'Failed to store file. Please try again.'],
      [
        'SUBMISSION_CREATE_FAILED',
        'Failed to create submission. Please try again.',
      ],
      [
        'SUBMISSION_UPDATE_FAILED',
        'Failed to save submission. Please try again.',
      ],
      [
        'MISSING_REQUIRED_FIELDS',
        'Missing required information. Please try again.',
      ],
      ['UNKNOWN_CODE', 'An unexpected error occurred. Please try again.'],
    ]

    it.each(errorCases)(
      'maps %s to user-friendly message',
      async (code, message) => {
        const { result } = renderHook(() => usePhotoUpload(defaultParams))
        const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' })

        act(() => {
          result.current.startUpload(file, { studentName: 'Test', tlcName: 'Teacher', tlcEmail: 'test@test.com' })
        })

        const xhr = MockXMLHttpRequest.getLastInstance()

        act(() => {
          xhr.simulateLoad(200, { success: false, error: code })
        })

        await waitFor(() => {
          expect(result.current.uploadState.error).toBe(message)
        })
      }
    )
  })

  // Note: Supabase configuration validation is tested implicitly through
  // integration tests. Mocking import.meta.env is not reliable in Vitest.
})
