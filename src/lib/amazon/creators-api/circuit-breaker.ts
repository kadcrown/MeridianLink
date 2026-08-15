import { logger } from '../../logger';

export class CircuitBreaker {
  private failureCount = 0;
  private readonly threshold: number;
  private readonly cooldownMs: number;
  private openUntil: number = 0;
  private retryAfterUntil: number = 0;

  constructor(threshold = 5, cooldownMs = 30_000) {
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
  }

  public isOpen(): boolean {
    const now = Date.now();
    if (this.retryAfterUntil > now) {
      return true;
    }
    if (this.openUntil > now) {
      return true;
    }
    return false;
  }

  public recordSuccess(): void {
    this.failureCount = 0;
    this.openUntil = 0;
    this.retryAfterUntil = 0;
  }

  public recordFailure(retryAfterSeconds?: number): void {
    this.failureCount++;
    const now = Date.now();

    if (retryAfterSeconds && retryAfterSeconds > 0) {
      this.retryAfterUntil = now + retryAfterSeconds * 1000;
      logger.warn(`CircuitBreaker received Retry-After: pausing for ${retryAfterSeconds}s`);
      return;
    }

    if (this.failureCount >= this.threshold) {
      this.openUntil = now + this.cooldownMs;
      logger.error(`CircuitBreaker OPEN: tripped after ${this.failureCount} failures. Pausing requests for ${this.cooldownMs / 1000}s.`);
    }
  }

  public reset(): void {
    this.failureCount = 0;
    this.openUntil = 0;
    this.retryAfterUntil = 0;
  }

  public getStatus() {
    const now = Date.now();
    return {
      isOpen: this.isOpen(),
      failureCount: this.failureCount,
      retryAfterRemainingMs: Math.max(0, this.retryAfterUntil - now),
      cooldownRemainingMs: Math.max(0, this.openUntil - now),
    };
  }
}

export const creatorsApiCircuitBreaker = new CircuitBreaker(5, 30_000);
