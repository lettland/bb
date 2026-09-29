import { appendFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ClaudeBashOutputFollower,
  claudeCodeTempRoot,
} from "../bash-output-follower.js";

const SESSION_ID = "6c1f0b7e-session";

describe("ClaudeBashOutputFollower", () => {
  let tempRoot: string;
  let tasksDir: string;
  let published: Array<[string, string]>;
  let follower: ClaudeBashOutputFollower;

  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "bb-bash-follower-"));
    tasksDir = join(tempRoot, "-Users-me-project", SESSION_ID, "tasks");
    published = [];
    follower = new ClaudeBashOutputFollower({
      tempRoot,
      pollIntervalMs: 5,
      publish: (toolUseId, text) => published.push([toolUseId, text]),
    });
  });

  afterEach(async () => {
    follower.stopAll();
    await rm(tempRoot, { recursive: true, force: true });
  });

  function outputFor(toolUseId: string): string {
    return published
      .filter(([id]) => id === toolUseId)
      .map(([, text]) => text)
      .join("");
  }

  it("streams appended output once the task file appears under any project dir", async () => {
    follower.follow({
      toolUseId: "toolu_1",
      taskId: "b1",
      sessionId: SESSION_ID,
    });
    await mkdir(tasksDir, { recursive: true });
    await writeFile(join(tasksDir, "b1.output"), "tick 1\n");
    await vi.waitFor(() => expect(outputFor("toolu_1")).toBe("tick 1\n"));

    await appendFile(join(tasksDir, "b1.output"), "tick 2\n");
    await vi.waitFor(() =>
      expect(outputFor("toolu_1")).toBe("tick 1\ntick 2\n"),
    );
  });

  it("keeps multi-byte characters intact across reads", async () => {
    await mkdir(tasksDir, { recursive: true });
    const path = join(tasksDir, "b2.output");
    const bytes = Buffer.from("ā✓", "utf8");
    await writeFile(path, bytes.subarray(0, 3));
    follower.follow({
      toolUseId: "toolu_2",
      taskId: "b2",
      sessionId: SESSION_ID,
    });
    await vi.waitFor(() => expect(outputFor("toolu_2")).toBe("ā"));
    await appendFile(path, bytes.subarray(3));
    await vi.waitFor(() => expect(outputFor("toolu_2")).toBe("ā✓"));
  });

  it("publishes nothing after the task is stopped", async () => {
    await mkdir(tasksDir, { recursive: true });
    const path = join(tasksDir, "b3.output");
    await writeFile(path, "before\n");
    follower.follow({
      toolUseId: "toolu_3",
      taskId: "b3",
      sessionId: SESSION_ID,
    });
    await vi.waitFor(() => expect(outputFor("toolu_3")).toBe("before\n"));

    follower.stopTask("b3");
    await appendFile(path, "after\n");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(outputFor("toolu_3")).toBe("before\n");
  });

  it("derives the per-uid temp root from CLAUDE_CODE_TMPDIR", () => {
    const uid = process.getuid?.() ?? 0;
    expect(claudeCodeTempRoot({ CLAUDE_CODE_TMPDIR: "/var/cc" })).toBe(
      `/var/cc/claude-${uid}`,
    );
    expect(claudeCodeTempRoot({})).toBe(`/tmp/claude-${uid}`);
  });
});
