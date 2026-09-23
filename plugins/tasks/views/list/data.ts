import {
  listAllTasks,
  patchTasks,
  signalTaskIds,
  useTasksQuery,
  type TaskSignal,
  type TasksRpc,
} from "../../shell/data.js";
import type {
  Label,
  Task,
  TaskPriority,
  TaskStatus,
  TaskThread,
} from "../../shared/contract.js";
import { isActiveThread } from "../detail/meta.js";

interface ListTaskFilters {
  statuses: readonly TaskStatus[];
  priorities: readonly TaskPriority[];
  labelIds: readonly string[] | null;
}

const FOCUS_STATUSES: readonly TaskStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
];
const RECENT_STATUSES: readonly TaskStatus[] = ["done", "canceled"];

export type ListTaskMode = "focus" | "recent" | "archive" | "active";

export function requestedStatuses(
  mode: ListTaskMode,
  selected: readonly TaskStatus[],
): readonly TaskStatus[] | undefined {
  const allowed =
    mode === "focus"
      ? FOCUS_STATUSES
      : mode === "recent"
        ? RECENT_STATUSES
        : null;
  if (allowed === null) return selected.length > 0 ? selected : undefined;
  if (selected.length === 0) return allowed;
  return allowed.filter((status) => selected.includes(status));
}

function belongsToList(
  task: Task,
  projectId: string | null,
  statuses: readonly TaskStatus[] | undefined,
  filters: ListTaskFilters,
): boolean {
  if (task.parentTaskId !== null) return false;
  if (task.archivedAt !== null) return false;
  if (projectId !== null && task.projectId !== projectId) return false;
  if (statuses !== undefined && !statuses.includes(task.status)) return false;
  if (
    filters.priorities.length > 0 &&
    !filters.priorities.includes(task.priority)
  ) {
    return false;
  }
  if (filters.labelIds !== null) {
    const wanted = new Set(filters.labelIds);
    if (!task.labelIds.some((labelId) => wanted.has(labelId))) return false;
  }
  return true;
}

export function useListTasks(
  projectId: string | null,
  mode: ListTaskMode,
  filters: ListTaskFilters,
) {
  const statuses = requestedStatuses(mode, filters.statuses);
  return useTasksQuery<Task[]>(
    async (rpc) =>
      listAllTasks(rpc, {
        ...(projectId === null ? {} : { projectId }),
        ...(statuses === undefined ? {} : { statuses: [...statuses] }),
        ...(filters.priorities.length > 0
          ? { priorities: [...filters.priorities] }
          : {}),
        ...(filters.labelIds !== null
          ? { labelIds: [...filters.labelIds] }
          : {}),
        activeOnly: mode === "active",
        archive: mode === "archive" ? "archived" : "active",
        parentTaskId: null,
      }),
    mode === "active"
      ? ["tasks:changed", "threads:changed"]
      : ["tasks:changed"],
    [
      projectId,
      mode,
      filters.statuses.join(),
      filters.priorities.join(),
      filters.labelIds === null ? "" : `active:${filters.labelIds.join()}`,
    ],
    mode === "active" || mode === "archive"
      ? {}
      : {
          applySignals: (rpc, current, signals) =>
            patchTasks(
              rpc,
              current,
              signalTaskIds(signals, "tasks:changed"),
              (task) => belongsToList(task, projectId, statuses, filters),
            ),
        },
  );
}

export function useLabels(projectIds: readonly string[]) {
  return useTasksQuery<Label[]>(
    async (rpc) => {
      const results = await Promise.all(
        projectIds.map((projectId) => rpc.call("listLabels", { projectId })),
      );
      return results.flatMap((result) => result.labels);
    },
    ["projects:changed"],
    [projectIds.join()],
  );
}

export interface TaskRowMeta {
  activeThreads: TaskThread[];
}

async function activeThreadsFor(
  rpc: TasksRpc,
  taskId: string,
): Promise<TaskThread[]> {
  const { taskThreads } = await rpc.call("listTaskThreads", { taskId });
  return taskThreads.filter(isActiveThread);
}

async function patchListMeta(
  rpc: TasksRpc,
  current: ReadonlyMap<string, TaskRowMeta>,
  signals: readonly TaskSignal[],
): Promise<Map<string, TaskRowMeta>> {
  const taskIds = new Set([
    ...signalTaskIds(signals, "threads:changed"),
    ...signalTaskIds(signals, "tasks:changed"),
  ]);
  const next = new Map(current);
  await Promise.all(
    [...taskIds].map(async (taskId) => {
      const activeThreads = await activeThreadsFor(rpc, taskId);
      if (activeThreads.length > 0) next.set(taskId, { activeThreads });
      else next.delete(taskId);
    }),
  );
  return next;
}

export function useTaskListMeta(projectId: string | null) {
  return useTasksQuery<Map<string, TaskRowMeta>>(
    async (rpc) => {
      const activeTasks = await listAllTasks(rpc, {
        ...(projectId === null ? {} : { projectId }),
        activeOnly: true,
        parentTaskId: null,
      });
      const entries = await Promise.all(
        activeTasks.map(
          async (task) =>
            [
              task.id,
              { activeThreads: await activeThreadsFor(rpc, task.id) },
            ] as const,
        ),
      );
      return new Map(
        entries.filter(([, meta]) => meta.activeThreads.length > 0),
      );
    },
    ["threads:changed", "tasks:changed"],
    [projectId],
    { applySignals: patchListMeta },
  );
}
