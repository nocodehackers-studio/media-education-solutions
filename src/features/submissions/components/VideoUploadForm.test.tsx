// Story 4-4: Tests for VideoUploadForm component
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { VideoUploadForm } from './VideoUploadForm'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

// Mock react-router-dom useBlocker
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useBlocker: vi.fn(() => ({ state: 'unblocked', reset: vi.fn(), proceed: vi.fn() })),
  }
})

vi.mock('../hooks/useVideoUpload', () => ({
  useVideoUpload: vi.fn(() => ({
    uploadState: {
      status: 'idle',
      progress: 0,
      speed: 0,
      fileName: null,
      error: null,
    },
    startUpload: vi.fn(),
    retryUpload: vi.fn(),
    cancelUpload: vi.fn(),
  })),
}))

import { useVideoUpload } from '../hooks/useVideoUpload'

describe('VideoUploadForm', () => {
  const defaultProps = {
    contestId: 'contest-123',
    categoryId: 'category-456',
    participantId: 'participant-789',
    participantCode: 'ABC123',
    onUploadComplete: vi.fn(),
  }

  const mockStartUpload = vi.fn()
  const mockRetryUpload = vi.fn()
  const mockCancelUpload = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useVideoUpload).mockReturnValue({
      uploadState: {
        status: 'idle',
        progress: 0,
        speed: 0,
        fileName: null,
        error: null,
      },
      startUpload: mockStartUpload,
      retryUpload: mockRetryUpload,
      cancelUpload: mockCancelUpload,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Idle state', () => {
    it('renders file picker with instructions', () => {
      render(<VideoUploadForm {...defaultProps} />)

      expect(
        screen.getByText('Drop your video here or click to browse')
      ).toBeInTheDocument()
      expect(
        screen.getByText('Supported formats: MP4, MKV, M4V, MOV, AVI, WMV, FLV, TS, MPEG')
      ).toBeInTheDocument()
      expect(screen.getByText('Maximum file size: 500MB')).toBeInTheDocument()
    })
  })

  describe('File validation', () => {
    it('starts upload for valid video file', async () => {
      render(<VideoUploadForm {...defaultProps} />)

      const file = new File(['video content'], 'test.mp4', {
        type: 'video/mp4',
      })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockStartUpload).toHaveBeenCalledWith(file)
      })
    })

    it('shows error toast for file too large', async () => {
      render(<VideoUploadForm {...defaultProps} />)

      // Create a mock file object with a large size
      const largeFile = new File([''], 'large.mp4', { type: 'video/mp4' })
      Object.defineProperty(largeFile, 'size', {
        value: 600 * 1024 * 1024,
      }) // 600MB

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(input, { target: { files: [largeFile] } })

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'File too large. Maximum size is 500MB'
        )
      })
      expect(mockStartUpload).not.toHaveBeenCalled()
    })

    it('shows error toast for invalid file type', async () => {
      render(<VideoUploadForm {...defaultProps} />)

      const file = new File(['content'], 'document.pdf', {
        type: 'application/pdf',
      })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Invalid file type. Supported formats: MP4, MKV, M4V, MOV, AVI, WMV, FLV, TS, MPEG'
        )
      })
      expect(mockStartUpload).not.toHaveBeenCalled()
    })

    it('accepts file by extension even without MIME type', async () => {
      render(<VideoUploadForm {...defaultProps} />)

      // Some browsers don't set MIME type correctly
      const file = new File(['video'], 'video.mkv', { type: '' })
      Object.defineProperty(file, 'size', { value: 100 * 1024 * 1024 }) // 100MB

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockStartUpload).toHaveBeenCalledWith(file)
      })
    })
  })

  describe('Drag and drop', () => {
    it('highlights drop zone on drag over', () => {
      render(<VideoUploadForm {...defaultProps} />)

      const dropZone = screen.getByText('Drop your video here or click to browse')
        .closest('[class*="border-dashed"]')!

      fireEvent.dragOver(dropZone)

      expect(dropZone).toHaveClass('border-primary')
    })

    it('removes highlight on drag leave', () => {
      render(<VideoUploadForm {...defaultProps} />)

      const dropZone = screen.getByText('Drop your video here or click to browse')
        .closest('[class*="border-dashed"]')!

      fireEvent.dragOver(dropZone)
      fireEvent.dragLeave(dropZone)

      expect(dropZone).not.toHaveClass('border-primary')
    })

    it('accepts file on drop', async () => {
      render(<VideoUploadForm {...defaultProps} />)

      const file = new File(['video content'], 'test.mp4', {
        type: 'video/mp4',
      })
      const dropZone = screen.getByText('Drop your video here or click to browse')
        .closest('[class*="border-dashed"]')!

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      })

      await waitFor(() => {
        expect(mockStartUpload).toHaveBeenCalledWith(file)
      })
    })
  })

  describe('Uploading state', () => {
    it('shows cancel button during upload', () => {
      vi.mocked(useVideoUpload).mockReturnValue({
        uploadState: {
          status: 'uploading',
          progress: 50,
          speed: 1024 * 1024,
          fileName: 'video.mp4',
          error: null,
        },
        startUpload: mockStartUpload,
        retryUpload: mockRetryUpload,
        cancelUpload: mockCancelUpload,
      })

      render(<VideoUploadForm {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Cancel Upload' })).toBeInTheDocument()
    })

    it('calls cancelUpload when cancel clicked', async () => {
      vi.mocked(useVideoUpload).mockReturnValue({
        uploadState: {
          status: 'uploading',
          progress: 50,
          speed: 1024 * 1024,
          fileName: 'video.mp4',
          error: null,
        },
        startUpload: mockStartUpload,
        retryUpload: mockRetryUpload,
        cancelUpload: mockCancelUpload,
      })

      render(<VideoUploadForm {...defaultProps} />)

      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: 'Cancel Upload' }))

      expect(mockCancelUpload).toHaveBeenCalled()
    })

    it('hides file picker during upload', () => {
      vi.mocked(useVideoUpload).mockReturnValue({
        uploadState: {
          status: 'uploading',
          progress: 50,
          speed: 1024 * 1024,
          fileName: 'video.mp4',
          error: null,
        },
        startUpload: mockStartUpload,
        retryUpload: mockRetryUpload,
        cancelUpload: mockCancelUpload,
      })

      render(<VideoUploadForm {...defaultProps} />)

      expect(
        screen.queryByText('Drop your video here or click to browse')
      ).not.toBeInTheDocument()
    })
  })

  describe('Error state', () => {
    it('shows retry button when upload fails', () => {
      vi.mocked(useVideoUpload).mockReturnValue({
        uploadState: {
          status: 'error',
          progress: 0,
          speed: 0,
          fileName: 'video.mp4',
          error: 'Upload failed',
        },
        startUpload: mockStartUpload,
        retryUpload: mockRetryUpload,
        cancelUpload: mockCancelUpload,
      })

      render(<VideoUploadForm {...defaultProps} />)

      expect(screen.getByText('Retry upload')).toBeInTheDocument()
    })
  })
})
