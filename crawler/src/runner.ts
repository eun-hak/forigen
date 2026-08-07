export interface SettledRun<T> { values: T[]; errors: Array<{ index: number; message: string }> }

export async function withRetry<T>(task: () => Promise<T>, options: { attempts?: number; baseDelayMs?: number; sleep?: (ms: number) => Promise<void> } = {}): Promise<T> {
  const attempts = options.attempts ?? 3; const baseDelayMs = options.baseDelayMs ?? 500; const sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try { return await task(); } catch (error) { lastError = error; if (attempt < attempts) await sleep(baseDelayMs * (2 ** (attempt - 1))); }
  }
  throw lastError;
}

export async function mapConcurrent<T, R>(
  values: readonly T[],
  concurrency: number,
  task: (value: T, index: number) => Promise<R>,
): Promise<SettledRun<R>> {
  const output: Array<R | undefined> = new Array(values.length);
  const errors: Array<{ index: number; message: string }> = [];
  let cursor = 0;
  async function worker(): Promise<void> {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= values.length) return;
      try {
        output[index] = await task(values[index] as T, index);
      } catch (error) {
        errors.push({ index, message: error instanceof Error ? error.message : String(error) });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()));
  return { values: output.filter((value): value is R => value !== undefined), errors };
}
