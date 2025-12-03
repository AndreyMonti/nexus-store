
interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  shouldRetry: (error: any) => {
    // Retry on 5xx errors (server errors) and network timeouts
    const status = error?.status;
    return (status && status >= 500 && status < 600) || error?.message?.includes('timeout');
  },
};

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute an async function with exponential backoff retry logic
 * @param fn - Async function to execute
 * @param options - Retry configuration
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  let delayMs = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      console.log(`[Retry] Attempt ${attempt}/${opts.maxAttempts}`);
      const result = await fn();
      if (attempt > 1) {
        console.log(`[Retry] Success after ${attempt} attempts`);
      }
      return result;
    } catch (error) {
      lastError = error;
      const shouldRetry = opts.shouldRetry(error);
      const isLastAttempt = attempt === opts.maxAttempts;

      console.error(`[Retry] Attempt ${attempt} failed:`, {
        status: (error as any)?.status,
        message: (error as any)?.message,
        shouldRetry,
        isLastAttempt,
      });

      if (!shouldRetry || isLastAttempt) {
        throw error;
      }

      // Calculate delay with exponential backoff
      delayMs = Math.min(delayMs * opts.backoffMultiplier, opts.maxDelayMs);
      console.log(`[Retry] Waiting ${delayMs}ms before retry...`);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

/**
 * Wrap a Supabase query with retry logic
 * Usage: await retrySupabaseQuery(() => supabase.from('users').select('*'))
 */
export async function retrySupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  let delayMs = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      console.log(`[Retry] Supabase Attempt ${attempt}/${opts.maxAttempts}`);
      const result = await queryFn();

      // Check if Supabase returned an error
      if (result.error) {
        const shouldRetry = opts.shouldRetry(result.error);
        const isLastAttempt = attempt === opts.maxAttempts;

        console.error(`[Retry] Attempt ${attempt} failed with Supabase error:`, {
          status: result.error?.status,
          message: result.error?.message,
          code: result.error?.code,
          shouldRetry,
          isLastAttempt,
        });

        if (!shouldRetry || isLastAttempt) {
          return result; // Return error as-is
        }

        // Retry with backoff
        delayMs = Math.min(delayMs * opts.backoffMultiplier, opts.maxDelayMs);
        console.log(`[Retry] Waiting ${delayMs}ms before retry...`);
        await sleep(delayMs);
        continue;
      }

      // Success
      if (attempt > 1) {
        console.log(`[Retry] Success after ${attempt} attempts`);
      }
      return result;
    } catch (error) {
      // Network error or other exception
      lastError = error;
      const shouldRetry = opts.shouldRetry(error);
      const isLastAttempt = attempt === opts.maxAttempts;

      console.error(`[Retry] Attempt ${attempt} failed with exception:`, {
        message: (error as any)?.message,
        shouldRetry,
        isLastAttempt,
      });

      if (!shouldRetry || isLastAttempt) {
        return {
          data: null,
          error: {
            message: (error as any)?.message || 'Unknown error',
            status: (error as any)?.status,
            details: error,
          },
        };
      }

      // Retry with backoff
      delayMs = Math.min(delayMs * opts.backoffMultiplier, opts.maxDelayMs);
      console.log(`[Retry] Waiting ${delayMs}ms before retry...`);
      await sleep(delayMs);
    }
  }

  return {
    data: null,
    error: lastError,
  };
}

/**
 * Parse Supabase error and return user-friendly message
 */
export function parseSupabaseError(error: any): string {
  if (!error) return 'Erro desconhecido';

  const status = error?.status;
  const message = error?.message;

  // 503 Service Unavailable
  if (status === 503) {
    return 'Supabase temporariamente indisponível. Tentando novamente...';
  }

  // 500 Internal Server Error
  if (status === 500) {
    return 'Erro no servidor. Por favor, tente novamente em alguns momentos.';
  }

  // 429 Too Many Requests
  if (status === 429) {
    return 'Muitas requisições. Aguarde alguns segundos e tente novamente.';
  }

  // Network errors
  if (message?.includes('NetworkError') || message?.includes('Failed to fetch')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  // Default error messages
  if (message?.includes('Email já cadastrado')) return 'Este email já está cadastrado';
  if (message?.includes('Email ou senha inválidos')) return 'Email ou senha inválidos';
  if (message?.includes('Password')) return 'Erro com a senha. Tente novamente.';

  return message || 'Erro ao processar requisição. Tente novamente.';
}
