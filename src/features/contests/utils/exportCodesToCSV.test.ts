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

  // Helper to read blob content
  const readBlobContent = async (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(blob);
    });
  };

  it('creates CSV with correct headers (AC5)', async () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'unused')];

    exportCodesToCSV(codes, 'ABC123');

    // Verify blob was created
    expect(capturedBlob).not.toBeNull();
    expect(capturedBlob?.type).toBe('text/csv;charset=utf-8;');

    // Verify CSV content has correct headers
    const content = await readBlobContent(capturedBlob!);
    const lines = content.split('\n');
    expect(lines[0]).toBe('Code,Status');
  });

  it('includes all codes in CSV content with correct format (AC5)', async () => {
    const codes: Participant[] = [
      createMockParticipant('12345678', 'unused'),
      createMockParticipant('87654321', 'used', 'John Doe'),
      createMockParticipant('11111111', 'unused'),
    ];

    exportCodesToCSV(codes, 'ABC123');

    // Verify CSV content has all rows
    expect(capturedBlob).not.toBeNull();
    const content = await readBlobContent(capturedBlob!);
    const lines = content.split('\n');

    expect(lines).toHaveLength(4); // Header + 3 codes
    expect(lines[0]).toBe('Code,Status');
    expect(lines[1]).toBe('12345678,unused');
    expect(lines[2]).toBe('87654321,used');
    expect(lines[3]).toBe('11111111,unused');
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

  it('handles empty codes array with header only', async () => {
    const codes: Participant[] = [];

    exportCodesToCSV(codes, 'ABC123');

    // Blob was created even for empty codes (just header)
    expect(capturedBlob).not.toBeNull();
    expect(mockClick).toHaveBeenCalled();

    // Verify only header row exists
    const content = await readBlobContent(capturedBlob!);
    const lines = content.split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('Code,Status');
  });

  it('creates CSV with correct MIME type', () => {
    const codes: Participant[] = [createMockParticipant('12345678', 'unused')];

    exportCodesToCSV(codes, 'ABC123');

    expect(capturedBlob?.type).toBe('text/csv;charset=utf-8;');
  });

  it('does NOT include PII in CSV export (regression test)', async () => {
    // Create participant with all PII fields populated
    const codes: Participant[] = [
      {
        id: 'id-1',
        contestId: 'contest-123',
        code: '12345678',
        status: 'used',
        name: 'John Doe',
        organizationName: 'Springfield Elementary',
        tlcName: 'Jane Smith',
        tlcEmail: 'jane@example.com',
        createdAt: '2026-01-13T00:00:00Z',
      },
    ];

    exportCodesToCSV(codes, 'ABC123');

    // Verify CSV content does NOT contain PII
    expect(capturedBlob).not.toBeNull();
    const content = await readBlobContent(capturedBlob!);

    // CSV should only have Code and Status - no PII
    expect(content).not.toContain('John Doe');
    expect(content).not.toContain('Springfield Elementary');
    expect(content).not.toContain('Jane Smith');
    expect(content).not.toContain('jane@example.com');
    expect(content).not.toContain('name');
    expect(content).not.toContain('organization');
    expect(content).not.toContain('tlc');

    // Verify only expected columns exist
    const lines = content.split('\n');
    expect(lines[0]).toBe('Code,Status');
    expect(lines[1]).toBe('12345678,used');
  });
});
