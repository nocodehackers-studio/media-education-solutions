import type { ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { Button } from '@/components/ui';

function FallbackComponent({
  error,
  resetErrorBoundary
}: {
  error: unknown;
  resetErrorBoundary: () => void;
}) {
  // Safely extract error message
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-destructive mb-4">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mb-6">
          We've been notified and are working on a fix. Please try again.
        </p>
        {import.meta.env.DEV && (
          <pre className="text-left text-xs bg-muted p-4 rounded mb-4 overflow-auto">
            {errorMessage}
          </pre>
        )}
        <Button onClick={resetErrorBoundary}>Try Again</Button>
      </div>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <FallbackComponent error={error} resetErrorBoundary={resetError} />
      )}
      onError={(error) => {
        console.error('ErrorBoundary caught:', error);
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
