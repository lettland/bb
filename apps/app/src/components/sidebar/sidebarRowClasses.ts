import { LIST_HOVER_TRANSITION } from "@bb/shared-ui/motion";
import {
  COARSE_POINTER_ROW_HEIGHT_CLASS,
  COARSE_POINTER_CHILD_ICON_BUTTON_CLASS,
} from "@bb/shared-ui/coarse-pointer-sizing";
import { cn } from "@bb/shared-ui/lib/utils";

export const SIDEBAR_ROW_BASE_CLASS =
  "flex w-full items-center gap-2 rounded-md pr-0 text-sm transition-colors";

export const SIDEBAR_STATUS_ICON_CLASS = "size-4";

export const SIDEBAR_WORKING_STATUS_COLOR_CLASS = "text-muted-foreground/50";

export const SIDEBAR_SUCCESS_STATUS_COLOR_CLASS = "text-success-foreground";

export const SIDEBAR_SUCCESS_STATUS_DOT_CLASS =
  "size-1.5 rounded-full bg-success max-md:pointer-coarse:size-2";

export const SIDEBAR_WAITING_STATUS_COLOR_CLASS = "text-attention";

export const SIDEBAR_RUNTIME_STATUS_COLOR_CLASS = "text-working";

export const SIDEBAR_ACTIVITY_STATUS_COLOR_CLASSES = {
  workflow: "text-working-workflow",
  "background-agent": "text-working-agent",
  "background-command": "text-working-command",
  "plan-mode": "text-working-plan",
  goal: "text-working-goal",
} as const;

const SIDEBAR_THREAD_ROW_BASE_PADDING_PX = 8;
const SIDEBAR_THREAD_ROW_DEPTH_STEP_PX = 24;

export const SIDEBAR_STANDARD_ROW_PADDING_CLASS = "pl-2";

export const SIDEBAR_ROW_TEXT_CLASS = "text-sidebar-foreground";

export const SIDEBAR_CONTROL_TONE_CLASS =
  "text-subtle-foreground hover:text-muted-foreground data-[state=open]:text-muted-foreground";

export const SIDEBAR_CONTROL_STATE_CLASS = `${SIDEBAR_CONTROL_TONE_CLASS} hover:bg-state-hover active:bg-state-active data-[state=open]:bg-state-active data-[state=open]:hover:bg-state-active`;

export function getSidebarThreadRowPaddingLeft(depth: number): number {
  return (
    SIDEBAR_THREAD_ROW_BASE_PADDING_PX +
    depth * SIDEBAR_THREAD_ROW_DEPTH_STEP_PX
  );
}

export const SIDEBAR_ROW_INTERACTIVE_STATE_CLASS = `cursor-pointer ${SIDEBAR_ROW_TEXT_CLASS} hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`;

export const SIDEBAR_FOOTER_ACTION_CLASS = cn(
  COARSE_POINTER_ROW_HEIGHT_CLASS,
  COARSE_POINTER_CHILD_ICON_BUTTON_CLASS,
  "text-muted-foreground hover:text-sidebar-foreground [&>[data-icon-root]]:opacity-80",
);

export const PROJECT_LIST_ACTION_BUTTON_CLASS = cn(
  SIDEBAR_ROW_BASE_CLASS,
  LIST_HOVER_TRANSITION,
  SIDEBAR_STANDARD_ROW_PADDING_CLASS,
  SIDEBAR_ROW_INTERACTIVE_STATE_CLASS,
  COARSE_POINTER_ROW_HEIGHT_CLASS,
  "min-w-0 cursor-pointer justify-start overflow-hidden font-normal ring-sidebar-ring focus-visible:ring-2 disabled:cursor-default disabled:opacity-70 max-md:pointer-coarse:[&_[data-icon-root]]:size-5",
);
