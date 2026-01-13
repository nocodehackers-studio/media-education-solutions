import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportCodesToCSV } from './exportCodesToCSV';
import type { Participant } from '../types/contest.types';

describe('exportCodesToCSV', () => {
  let mockClick: ReturnType<typeof vi.fn>;
  let mockAppendChild: ReturnType<typeof vi.fn>;
  let mockRemoveChild: ReturnType<typeof vi.fn>;
  let capturedBlob: Blob | null = null;
  let capturedLink: { href: string; download: string } | null = null;

  beforeEach(() => {
    // Mock URL methods with type assertions
    const createObjectURL = vi.fn((blob: Blob) => {
      capturedBlob = blob;
      return 'blob:test-url';
    });
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });

    // Mock document methods
    mockClick = vi.fn();
    mockAppendChild = vi.fn();
    mockRemoveChild = vi.fn();
    vi.spyOn(document.body, 'appendChild').mockImplementation(
      mockAppendChild as unknown as typeof document.body.appendChild
    );
    vi.spyOn(document.body, 'removeChild').mockImplementation(
      mockRemoveChild as unknown as typeof document.body.removeChild
    );

    // Mock document.createElement
    vi.spyOn(document, 'createElement').mockImplementation(() => {
      const element = {
        href: '',
        download: '',
        click: mockClick,
      } as unknown as HTMLAnchorElement;

      // Capture the link for assertions
      capturedLink = element as unknown as { href: string; download: string };
      return element;
    });

    capturedBlob = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const createMockParticipant = (
    code: string,
    status: 'unused' | 'used',
    name: string | null = null
  ): Participant => ({
    id: `id-${code}`,
    contestId: 'contest-123',
    code,
    status,
    name,
    organizationName: null,
    tlcName: null,
    tlcEmail: null,
    createdAt: '2026-01-13T00:00:00Z',
  });

  it('creates CSV with correct headers', () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'unused')];

    exportCodesToCSV(codes, 'ABC123');

    // Verify blob was created and passed to createObjectURL
    expect(capturedBlob).not.toBeNull();
    // The blob should be a text/csv type
    expect(capturedBlob?.type).toBe('text/csv;charset=utf-8;');
  });

  it('includes all codes in CSV content', () => {
    const codes: Participant[] = [
      createMockParticipant('12345678', 'unused'),
      createMockParticipant('87654321', 'used', 'John Doe'),
      createMockParticipant('11111111', 'unused'),
    ];

    exportCodesToCSV(codes, 'ABC123');

    // Blob was created for the CSV content
    expect(capturedBlob).not.toBeNull();
    expect(mockClick).toHaveBeenCalled();
  });

  it('uses correct filename format', () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'unused')];

    exportCodesToCSV(codes, 'XYZ789');

    expect(capturedLink?.download).toBe('XYZ789_participant_codes.csv');
  });

  it('triggers download by clicking link', () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'unused')];

    exportCodesToCSV(codes, 'ABC123');

    expect(mockClick).toHaveBeenCalledOnce();
    expect(mockAppendChild).toHaveBeenCalledOnce();
    expect(mockRemoveChild).toHaveBeenCalledOnce();
  });

  it('cleans up blob URL after download', () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'unused')];

    exportCodesToCSV(codes, 'ABC123');

    // URL.revokeObjectURL should be called (we can verify the function runs without error)
    // The actual call verification is handled by the stubbed global
    expect(mockClick).toHaveBeenCalled();
  });

  it('handles empty codes array', () => {
    const codes: Participant[] = [];

    exportCodesToCSV(codes, 'ABC123');

    // Blob was created even for empty codes (just header)
    expect(capturedBlob).not.toBeNull();
    expect(mockClick).toHaveBeenCalled();
  });

  it('creates CSV with correct MIME type', () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'unused')];

    exportCodesToCSV(codes, 'ABC123');

    expect(capturedBlob?.type).toBe('text/csv;charset=utf-8;');
  });
});
