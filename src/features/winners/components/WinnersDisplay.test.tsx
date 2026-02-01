// Story 6-6: Tests for WinnersDisplay component

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WinnersDisplay } from './WinnersDisplay';
import type { CategoryWinners } from '@/features/contests';

// Mock dependencies with per-test overrides
const mockDownloadFile = vi.fn();
const mockUseDownloadManager = vi.fn(() => ({
  downloadFile: mockDownloadFile,
  isDownloading: false,
  cooldownActive: false,
  isBlocked: false,
}));

vi.mock('./PhotoLightboxWithDownload', () => ({
  PhotoLightboxWithDownload: () => null,
}));

vi.mock('../hooks/useDownloadManager', () => ({
  useDownloadManager: () => mockUseDownloadManager(),
  buildDownloadFilename: (code: string, cat: string, rank: number, name: string, type: string) =>
    `${code}_${cat}_${rank}_${name}.${type === 'video' ? 'mp4' : 'jpg'}`,
}));

const mockWinners: CategoryWinners[] = [
  {
    categoryId: 'cat-1',
    categoryName: 'Best Short Film',
    divisionName: 'Senior Division',
    winners: [
      {
        rank: 1,
        submissionId: 'sub-1',
        participantName: 'Alice',
        institution: 'School A',
        categoryName: 'Best Short Film',
        mediaType: 'photo',
        mediaUrl: 'https://example.com/photo.jpg',
        thumbnailUrl: null,
        vacant: false,
      },
      {
        rank: 2,
        submissionId: '',
        participantName: '',
        institution: '',
        categoryName: 'Best Short Film',
        mediaType: '',
        mediaUrl: '',
        thumbnailUrl: null,
        vacant: true,
      },
    ],
  },
];

describe('WinnersDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDownloadManager.mockReturnValue({
      downloadFile: mockDownloadFile,
      isDownloading: false,
      cooldownActive: false,
      isBlocked: false,
    });
  });

  it('should render contest name and congratulations message', () => {
    render(
      <WinnersDisplay
        contestName="Film Festival 2026"
        contestCode="FF2026"
        winners={mockWinners}
      />
    );

    expect(screen.getByText('Film Festival 2026')).toBeInTheDocument();
    expect(screen.getByText('Congratulations to all winners!')).toBeInTheDocument();
  });

  it('should render category sections', () => {
    render(
      <WinnersDisplay
        contestName="Film Festival 2026"
        contestCode="FF2026"
        winners={mockWinners}
      />
    );

    // Category name appears as section header and inside winner card
    expect(screen.getAllByText('Best Short Film').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Senior Division')).toBeInTheDocument();
  });

  it('should render winner cards including vacant', () => {
    render(
      <WinnersDisplay
        contestName="Film Festival 2026"
        contestCode="FF2026"
        winners={mockWinners}
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Position vacant')).toBeInTheDocument();
  });

  it('should show empty message when no winners', () => {
    render(
      <WinnersDisplay
        contestName="Empty Contest"
        contestCode="EMPTY"
        winners={[]}
      />
    );

    expect(screen.getByText('No winners have been announced yet.')).toBeInTheDocument();
  });

  it('should show no winners for category when all vacant', () => {
    const allVacant: CategoryWinners[] = [
      {
        categoryId: 'cat-2',
        categoryName: 'Documentary',
        divisionName: 'Junior',
        winners: [
          { rank: 1, submissionId: '', participantName: '', institution: '', categoryName: 'Documentary', mediaType: '', mediaUrl: '', thumbnailUrl: null, vacant: true },
        ],
      },
    ];

    render(
      <WinnersDisplay
        contestName="Test"
        contestCode="TEST"
        winners={allVacant}
      />
    );

    expect(screen.getByText('No winners for this category.')).toBeInTheDocument();
  });

  it('should show downloading status bar when download is in progress', () => {
    mockUseDownloadManager.mockReturnValue({
      downloadFile: mockDownloadFile,
      isDownloading: true,
      cooldownActive: false,
      isBlocked: false,
    });

    render(
      <WinnersDisplay
        contestName="Test"
        contestCode="TEST"
        winners={mockWinners}
      />
    );

    expect(screen.getByText('Download in progress...')).toBeInTheDocument();
  });

  it('should show cooldown status bar after download completes', () => {
    mockUseDownloadManager.mockReturnValue({
      downloadFile: mockDownloadFile,
      isDownloading: false,
      cooldownActive: true,
      isBlocked: false,
    });

    render(
      <WinnersDisplay
        contestName="Test"
        contestCode="TEST"
        winners={mockWinners}
      />
    );

    expect(screen.getByText('Please wait for current download to complete')).toBeInTheDocument();
  });

  it('should show blocked status bar when abuse detected', () => {
    mockUseDownloadManager.mockReturnValue({
      downloadFile: mockDownloadFile,
      isDownloading: false,
      cooldownActive: false,
      isBlocked: true,
    });

    render(
      <WinnersDisplay
        contestName="Test"
        contestCode="TEST"
        winners={mockWinners}
      />
    );

    expect(screen.getByText('Too many downloads. Please try again later.')).toBeInTheDocument();
  });
});
