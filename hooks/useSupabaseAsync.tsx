import { useCallback, useState } from 'react';
import { parseSupabaseError } from '../services/retryUtils';

interface UseSupabaseAsyncOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useSupabaseAsync<T>(options: UseSupabaseAsyncOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (fn: () => Promise<T>) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fn();
        setData(result);
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const errorMessage = parseSupabaseError(err);
        setError(errorMessage);
        console.error('[useSupabaseAsync] Error:', {
          message: errorMessage,
          originalError: err,
          timestamp: new Date().toISOString(),
        });
        options.onError?.(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setError(null);
    setData(null);
    setLoading(false);
  }, []);

  return { execute, loading, error, data, reset };
}
