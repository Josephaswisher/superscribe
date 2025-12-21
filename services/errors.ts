/**
 * Custom error classes for AI service error handling
 */

export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class APIKeyMissingError extends AIServiceError {
  constructor() {
    super(
      'OpenRouter API key is not configured. Please set VITE_OPENROUTER_API_KEY in your .env.local file.',
      'API_KEY_MISSING',
      401,
      false
    );
    this.name = 'APIKeyMissingError';
  }
}

export class RateLimitError extends AIServiceError {
  constructor(retryAfter?: number) {
    super(
      `Rate limit exceeded. ${retryAfter ? `Retry after ${retryAfter} seconds.` : 'Please try again later.'}`,
      'RATE_LIMIT',
      429,
      true
    );
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends AIServiceError {
  constructor(originalError?: Error) {
    super(
      `Network error: ${originalError?.message || 'Unable to connect to AI service'}`,
      'NETWORK_ERROR',
      undefined,
      true
    );
    this.name = 'NetworkError';
  }
}

export class InvalidResponseError extends AIServiceError {
  constructor(details?: string) {
    super(
      `Invalid response from AI service${details ? `: ${details}` : ''}`,
      'INVALID_RESPONSE',
      500,
      true
    );
    this.name = 'InvalidResponseError';
  }
}

export class TimeoutError extends AIServiceError {
  constructor(timeoutMs: number) {
    super(
      `Request timed out after ${timeoutMs}ms`,
      'TIMEOUT',
      408,
      true
    );
    this.name = 'TimeoutError';
  }
}

/**
 * Type guard to check if an error is an AIServiceError
 */
export function isAIServiceError(error: unknown): error is AIServiceError {
  return error instanceof AIServiceError;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (isAIServiceError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isAIServiceError(error)) {
    return error.retryable;
  }
  
  // Network errors are generally retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  return false;
}
