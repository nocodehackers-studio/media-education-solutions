// Story 6-6: Password entry form for winners page

import { useState, useCallback, useEffect, type FormEvent } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Button,
} from '@/components/ui';
import type { CategoryWinners } from '@/features/contests';
import { publicWinnersApi } from '../api/publicWinnersApi';

interface PasswordEntryFormProps {
  contestCode: string;
  contestName: string;
  onSuccess: (contestName: string, winners: CategoryWinners[]) => void;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60000;

export function PasswordEntryForm({ contestCode, contestName, onSuccess }: PasswordEntryFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);

  const [, forceUpdate] = useState(0);
  const isLocked = Date.now() < lockedUntil;

  // Re-render when lockout expires to re-enable the form and reset attempts
  useEffect(() => {
    if (lockedUntil <= 0) return;
    const remaining = lockedUntil - Date.now();
    if (remaining <= 0) return;
    const timer = setTimeout(() => {
      setAttempts(0);
      forceUpdate((n) => n + 1);
    }, remaining);
    return () => clearTimeout(timer);
  }, [lockedUntil]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (isLoading || isLocked || !password.trim()) return;

      setError(null);
      setIsLoading(true);

      try {
        const result = await publicWinnersApi.validatePassword(contestCode, password);

        if (result.success && result.contestName && result.winners) {
          onSuccess(result.contestName, result.winners);
          return;
        }

        // Handle specific errors
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (result.error === 'WINNERS_NOT_AVAILABLE') {
          setError('Results are not currently available.');
        } else if (result.error === 'INCORRECT_PASSWORD') {
          if (newAttempts >= MAX_ATTEMPTS) {
            setLockedUntil(Date.now() + LOCKOUT_MS);
            setError('Too many attempts. Please wait.');
          } else {
            setError('Incorrect password');
          }
        } else {
          setError('Something went wrong. Please try again.');
        }
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [contestCode, password, onSuccess, isLoading, isLocked, attempts]
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-semibold">{contestName}</CardTitle>
        <CardDescription>Enter the password to view the winners</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Enter password"
              aria-label="Winners page password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              disabled={isLoading || isLocked}
              autoFocus
            />
          </div>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isLocked || !password.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              'View Results'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
