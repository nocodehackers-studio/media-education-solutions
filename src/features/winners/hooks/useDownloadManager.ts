// Story 6-6: Download manager hook — queued downloads, cooldown, abuse detection

import { useState, useCallback, useRef, useEffect } from 'react';

const COOLDOWN_MS = 3000;
const ABUSE_WINDOW_MS = 300000; // 5 minutes
const ABUSE_THRESHOLD = 10;

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function buildDownloadFilename(
  contestCode: string,
  categoryName: string,
  rank: number,
  participantName: string,
  mediaType: string
): string {
  const place = rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd';
  const ext = mediaType === 'video' ? 'mp4' : 'jpg';
  return `${contestCode}_${sanitizeFilename(categoryName)}_${place}_${sanitizeFilename(participantName)}.${ext}`;
}

export function useDownloadManager() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [, forceUpdate] = useState(0);
  const downloadsRef = useRef<number[]>([]);
  const isDownloadingRef = useRef(false);
  const queueRef = useRef<Array<{ url: string; filename: string }>>([]);
  const blockedUntilRef = useRef(0);

  const cooldownActive = Date.now() < cooldownUntil;
  const isBlocked = Date.now() < blockedUntilRef.current;

  // Re-render when cooldown expires so UI updates
  useEffect(() => {
    if (cooldownUntil <= 0) return;
    const remaining = cooldownUntil - Date.now();
    if (remaining <= 0) return;
    const timer = setTimeout(() => forceUpdate((n) => n + 1), remaining);
    return () => clearTimeout(timer);
  }, [cooldownUntil]);

  // Re-render when abuse block expires so UI updates
  useEffect(() => {
    if (blockedUntil <= 0) return;
    const remaining = blockedUntil - Date.now();
    if (remaining <= 0) return;
    const timer = setTimeout(() => forceUpdate((n) => n + 1), remaining);
    return () => clearTimeout(timer);
  }, [blockedUntil]);

  const getRecentCount = useCallback(() => {
    const now = Date.now();
    downloadsRef.current = downloadsRef.current.filter((t) => now - t < ABUSE_WINDOW_MS);
    return downloadsRef.current.length;
  }, []);

  // Ref-stable function to process the next queued download
  const processNextRef = useRef<() => void>(() => {});

  const executeDownload = useCallback(
    async (url: string, filename: string) => {
      isDownloadingRef.current = true;
      setIsDownloading(true);
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Download failed');

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);

        downloadsRef.current.push(Date.now());
        setCooldownUntil(Date.now() + COOLDOWN_MS);

        // Check abuse after download
        if (getRecentCount() >= ABUSE_THRESHOLD) {
          const oldest = Math.min(...downloadsRef.current);
          blockedUntilRef.current = oldest + ABUSE_WINDOW_MS;
          setBlockedUntil(blockedUntilRef.current);
          queueRef.current = [];
          return;
        }

        // Schedule next queued download after cooldown
        if (queueRef.current.length > 0) {
          setTimeout(() => processNextRef.current(), COOLDOWN_MS);
        }
      } finally {
        isDownloadingRef.current = false;
        setIsDownloading(false);
      }
    },
    [getRecentCount]
  );

  // Keep processNextRef in sync with latest executeDownload
  processNextRef.current = () => {
    if (queueRef.current.length === 0) return;
    if (isDownloadingRef.current) return;
    if (Date.now() < blockedUntilRef.current) return;
    const next = queueRef.current.shift()!;
    executeDownload(next.url, next.filename);
  };

  const downloadFile = useCallback(
    async (url: string, filename: string) => {
      // Blocked — reject entirely
      if (Date.now() < blockedUntilRef.current) return;

      // Check abuse before starting
      if (getRecentCount() >= ABUSE_THRESHOLD) {
        const oldest = Math.min(...downloadsRef.current);
        blockedUntilRef.current = oldest + ABUSE_WINDOW_MS;
        setBlockedUntil(blockedUntilRef.current);
        return;
      }

      // Busy or in cooldown — queue instead of drop
      if (isDownloadingRef.current || Date.now() < cooldownUntil) {
        queueRef.current.push({ url, filename });
        // If in cooldown (not actively downloading), schedule queue processing
        if (!isDownloadingRef.current) {
          const remaining = Math.max(0, cooldownUntil - Date.now());
          setTimeout(() => processNextRef.current(), remaining);
        }
        return;
      }

      await executeDownload(url, filename);
    },
    [cooldownUntil, getRecentCount, executeDownload]
  );

  return { downloadFile, isDownloading, cooldownActive, isBlocked };
}
