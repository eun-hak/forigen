import { describe, expect, it, vi } from "vitest";
import { withRetry } from "./runner.js";

describe("withRetry", () => {
  it("retries transient failures", async () => { const task = vi.fn().mockRejectedValueOnce(new Error("temporary")).mockResolvedValue("ok"); const sleep = vi.fn().mockResolvedValue(undefined); await expect(withRetry(task, { sleep })).resolves.toBe("ok"); expect(task).toHaveBeenCalledTimes(2); });
  it("returns the final error after the limit", async () => { const task = vi.fn().mockRejectedValue(new Error("down")); await expect(withRetry(task, { attempts: 2, sleep: async () => undefined })).rejects.toThrow("down"); expect(task).toHaveBeenCalledTimes(2); });
});
