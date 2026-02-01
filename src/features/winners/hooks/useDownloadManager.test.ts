// Story 6-6: Tests for useDownloadManager hook

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDownloadManager, buildDownloadFilename } from './useDownloadManager';

// Mock fetch for download tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

describe('useDownloadManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useDownloadManager());
    expect(result.current.isDownloading).toBe(false);
    expect(result.current.cooldownActive).toBe(false);
    expect(result.current.isBlocked).toBe(false);
  });

  it('should complete a download and apply cooldown', async () => {
    const { result } = renderHook(() => useDownloadManager());

    await act(async () => {
      await result.current.downloadFile('https://example.com/photo.jpg', 'test.jpg');
    });

    // After download, cooldown should be active
    expect(result.current.isDownloading).toBe(false);
    expect(result.current.cooldownActive).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('https://example.com/photo.jpg');
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('should queue downloads during cooldown instead of dropping them', async () => {
    const { result } = renderHook(() => useDownloadManager());

    // First download
    await act(async () => {
      await result.current.downloadFile('https://example.com/1.jpg', 'test1.jpg');
    });

    // Second download during cooldown — should be queued, not dropped
    await act(async () => {
      await result.current.downloadFile('https://example.com/2.jpg', 'test2.jpg');
    });

    // Only first download fetched so far (second is queued)
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('https://example.com/1.jpg');
  });

  it('should process queued download after cooldown expires', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useDownloadManager());

    // First download
    await act(async () => {
      await result.current.downloadFile('https://example.com/1.jpg', 'test1.jpg');
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Queue second download during cooldown
    await act(async () => {
      result.current.downloadFile('https://example.com/2.jpg', 'test2.jpg');
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance past cooldown to process queue (async to flush microtasks from fetch)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3100);
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenLastCalledWith('https://example.com/2.jpg');
  });

  it('should block downloads after abuse threshold is reached', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useDownloadManager());

    // Execute 10 downloads with cooldown advances between them
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        await result.current.downloadFile(`https://example.com/${i}.jpg`, `test${i}.jpg`);
      });
      if (i < 9) {
        await act(async () => {
          vi.advanceTimersByTime(3100);
        });
      }
    }

    expect(mockFetch).toHaveBeenCalledTimes(10);
    expect(result.current.isBlocked).toBe(true);
  });

  it('should unblock after abuse window expires', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useDownloadManager());

    // Trigger abuse block via 10 downloads
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        await result.current.downloadFile(`https://example.com/${i}.jpg`, `test${i}.jpg`);
      });
      if (i < 9) {
        await act(async () => {
          vi.advanceTimersByTime(3100);
        });
      }
    }

    expect(result.current.isBlocked).toBe(true);

    // Advance past the 5-minute abuse window
    await act(async () => {
      vi.advanceTimersByTime(300000);
    });

    expect(result.current.isBlocked).toBe(false);
  });
});

describe('buildDownloadFilename', () => {
  it('should format filename for 1st place photo', () => {
    const result = buildDownloadFilename('ABC123', 'Best Short Film', 1, 'John Doe', 'photo');
    expect(result).toBe('ABC123_best-short-film_1st_john-doe.jpg');
  });

  it('should format filename for 2nd place video', () => {
    const result = buildDownloadFilename('XYZ789', 'Documentary', 2, 'Jane Smith', 'video');
    expect(result).toBe('XYZ789_documentary_2nd_jane-smith.mp4');
  });

  it('should format filename for 3rd place', () => {
    const result = buildDownloadFilename('TEST01', 'Photography', 3, 'Alex', 'photo');
    expect(result).toBe('TEST01_photography_3rd_alex.jpg');
  });

  it('should sanitize special characters from names', () => {
    const result = buildDownloadFilename('ABC', 'Best Film!', 1, "O'Brien & Co.", 'photo');
    expect(result).toBe("ABC_best-film_1st_obrien-co.jpg");
  });

  it('should handle multiple spaces', () => {
    const result = buildDownloadFilename('ABC', 'Best  Short  Film', 1, 'John  Doe', 'photo');
    expect(result).toBe('ABC_best-short-film_1st_john-doe.jpg');
  });
});
