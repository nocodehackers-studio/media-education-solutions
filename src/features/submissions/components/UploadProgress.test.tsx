// Story 4-4: Tests for UploadProgress component
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UploadProgress } from './UploadProgress'
import type { UploadState } from '../types/submission.types'

describe('UploadProgress', () => {
  const baseState: UploadState = {
    status: 'idle',
    progress: 0,
    speed: 0,
    fileName: null,
    error: null,
  }

  describe('Idle state', () => {
    it('shows ready message and upload icon', () => {
      render(<UploadProgress state={baseState} />)

      expect(screen.getByText('Ready to upload')).toBeInTheDocument()
    })
  })

  describe('Uploading state', () => {
    it('shows progress bar, percentage, and speed', () => {
      const state: UploadState = {
        status: 'uploading',
        progress: 45,
        speed: 1024 * 1024, // 1 MB/s
        fileName: 'test-video.mp4',
        error: null,
      }

      render(<UploadProgress state={state} />)

      expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
      expect(screen.getByText('Uploading... 45%')).toBeInTheDocument()
      expect(screen.getByText('45%')).toBeInTheDocument()
      expect(screen.getByText('1.0 MB/s')).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('formats speed correctly in KB/s', () => {
      const state: UploadState = {
        status: 'uploading',
        progress: 50,
        speed: 512 * 1024, // 512 KB/s
        fileName: 'video.mp4',
        error: null,
      }

      render(<UploadProgress state={state} />)

      expect(screen.getByText('512.0 KB/s')).toBeInTheDocument()
    })

    it('formats speed correctly in B/s', () => {
      const state: UploadState = {
        status: 'uploading',
        progress: 10,
        speed: 500, // 500 B/s
        fileName: 'video.mp4',
        error: null,
      }

      render(<UploadProgress state={state} />)

      expect(screen.getByText('500 B/s')).toBeInTheDocument()
    })
  })

  describe('Processing state', () => {
    it('shows processing message and spinner', () => {
      const state: UploadState = {
        status: 'processing',
        progress: 100,
        speed: 0,
        fileName: 'test-video.mp4',
        error: null,
      }

      render(<UploadProgress state={state} />)

      expect(screen.getByText('Processing...')).toBeInTheDocument()
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
    })
  })

  describe('Complete state', () => {
    it('shows success message and checkmark', () => {
      const state: UploadState = {
        status: 'complete',
        progress: 100,
        speed: 0,
        fileName: 'test-video.mp4',
        error: null,
      }

      render(<UploadProgress state={state} />)

      expect(screen.getByText('Upload complete!')).toBeInTheDocument()
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument()
    })
  })

  describe('Error state', () => {
    it('shows error message and retry button', async () => {
      const onRetry = vi.fn()
      const state: UploadState = {
        status: 'error',
        progress: 0,
        speed: 0,
        fileName: 'test-video.mp4',
        error: 'Network error occurred',
      }

      render(<UploadProgress state={state} onRetry={onRetry} />)

      expect(screen.getByText('Network error occurred')).toBeInTheDocument()
      // F7: Now using Button component
      expect(screen.getByRole('button', { name: 'Retry upload' })).toBeInTheDocument()

      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: 'Retry upload' }))

      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('shows default error message when no error provided', () => {
      const state: UploadState = {
        status: 'error',
        progress: 0,
        speed: 0,
        fileName: 'test-video.mp4',
        error: null,
      }

      render(<UploadProgress state={state} />)

      expect(screen.getByText('Upload failed')).toBeInTheDocument()
    })

    it('does not show retry button when onRetry not provided', () => {
      const state: UploadState = {
        status: 'error',
        progress: 0,
        speed: 0,
        fileName: 'test-video.mp4',
        error: 'Error',
      }

      render(<UploadProgress state={state} />)

      expect(screen.queryByText('Retry upload')).not.toBeInTheDocument()
    })
  })

  describe('Custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <UploadProgress state={baseState} className="custom-class" />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})
