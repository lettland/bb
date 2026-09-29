import { open, readdir } from "node:fs/promises";
import { join } from "node:path";
import { StringDecoder } from "node:string_decoder";

const POLL_INTERVAL_MS = 500;
const MAX_READ_BYTES_PER_POLL = 64 * 1024;

interface FollowedTask {
  taskId: string;
  sessionId: string;
  path: string | undefined;
  offset: number;
  decoder: StringDecoder;
  timer: ReturnType<typeof setTimeout> | undefined;
}

export interface ClaudeBashOutputFollowerOptions {
  tempRoot: string;
  publish: (toolUseId: string, text: string) => void;
  pollIntervalMs?: number;
}

export function claudeCodeTempRoot(env: NodeJS.ProcessEnv): string {
  return join(
    env.CLAUDE_CODE_TMPDIR || "/tmp",
    `claude-${process.getuid?.() ?? 0}`,
  );
}

export class ClaudeBashOutputFollower {
  private readonly followed = new Map<string, FollowedTask>();
  private readonly pollIntervalMs: number;

  constructor(private readonly options: ClaudeBashOutputFollowerOptions) {
    this.pollIntervalMs = options.pollIntervalMs ?? POLL_INTERVAL_MS;
  }

  follow(args: { toolUseId: string; taskId: string; sessionId: string }): void {
    if (this.followed.has(args.toolUseId)) {
      return;
    }
    const task: FollowedTask = {
      taskId: args.taskId,
      sessionId: args.sessionId,
      path: undefined,
      offset: 0,
      decoder: new StringDecoder("utf8"),
      timer: undefined,
    };
    this.followed.set(args.toolUseId, task);
    this.schedule(args.toolUseId, task);
  }

  stop(toolUseId: string): void {
    const task = this.followed.get(toolUseId);
    if (task === undefined) {
      return;
    }
    clearTimeout(task.timer);
    this.followed.delete(toolUseId);
  }

  stopTask(taskId: string): void {
    for (const [toolUseId, task] of this.followed) {
      if (task.taskId === taskId) {
        this.stop(toolUseId);
      }
    }
  }

  stopAll(): void {
    for (const toolUseId of [...this.followed.keys()]) {
      this.stop(toolUseId);
    }
  }

  private schedule(toolUseId: string, task: FollowedTask): void {
    task.timer = setTimeout(() => {
      void this.poll(toolUseId, task);
    }, this.pollIntervalMs);
    task.timer.unref();
  }

  private isFollowing(toolUseId: string, task: FollowedTask): boolean {
    return this.followed.get(toolUseId) === task;
  }

  private async poll(toolUseId: string, task: FollowedTask): Promise<void> {
    try {
      task.path ??= await this.locate(task);
      const text =
        task.path === undefined ? "" : await this.readNew(task, task.path);
      if (text.length > 0 && this.isFollowing(toolUseId, task)) {
        this.options.publish(toolUseId, text);
      }
    } catch {
      task.path = undefined;
    }
    if (this.isFollowing(toolUseId, task)) {
      this.schedule(toolUseId, task);
    }
  }

  private async locate(task: FollowedTask): Promise<string | undefined> {
    const fileName = `${task.taskId}.output`;
    for (const projectDir of await readdir(this.options.tempRoot)) {
      const tasksDir = join(
        this.options.tempRoot,
        projectDir,
        task.sessionId,
        "tasks",
      );
      const entries = await readdir(tasksDir).catch((): string[] => []);
      if (entries.includes(fileName)) {
        return join(tasksDir, fileName);
      }
    }
    return undefined;
  }

  private async readNew(task: FollowedTask, path: string): Promise<string> {
    const handle = await open(path, "r");
    try {
      const buffer = Buffer.alloc(MAX_READ_BYTES_PER_POLL);
      const { bytesRead } = await handle.read(
        buffer,
        0,
        MAX_READ_BYTES_PER_POLL,
        task.offset,
      );
      task.offset += bytesRead;
      return task.decoder.write(buffer.subarray(0, bytesRead));
    } finally {
      await handle.close();
    }
  }
}
