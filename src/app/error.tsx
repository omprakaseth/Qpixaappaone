'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
      <h2 className="text-2xl font-bold mb-4">Arey! Kuch toh gadbad ho gayi.</h2>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-bold"
      >
        Try Again
      </button>
    </div>
  );
}
