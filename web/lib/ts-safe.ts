// Simple ts-safe implementation for async operations
export class SafePromise<T> {
  private promise: Promise<T>;

  constructor(promise: Promise<T>) {
    this.promise = promise;
  }

  watch(callback: () => void) {
    this.promise.finally(callback);
    return this;
  }

  async orElse(defaultValue: T): Promise<T> {
    try {
      return await this.promise;
    } catch {
      return defaultValue;
    }
  }

  async unwrap(): Promise<T> {
    return await this.promise;
  }
}

export function safe<T>(fn: () => Promise<T>): SafePromise<T> {
  return new SafePromise(fn());
}