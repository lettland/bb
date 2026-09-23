import { LIST_HOVER_TRANSITION } from "@/components/ui/motion";
import { COARSE_POINTER_DOT_SIZE_CLASS, COARSE_POINTER_ROW_HEIGHT_CLASS } from "@/components/ui/coarse-pointer-sizing";
import { cn } from "@/lib/utils";

export const SIDEBAR_ROW_BASE_CLASS =
  "flex w-full items-center gap-2 rounded-md pr-0 text-sm transition-colors";

export const SIDEBAR_ROW_GLYPH_SLOT_CLASS =
  "inline-flex shrink-0 items-center justify-center text-subtle-foreground";

export const SIDEBAR_STATUS_ICON_CLASS = "size-4";

export const SIDEBAR_STATUS_GLYPH_BOX_CLASS = "h-4 w-4";

export const SIDEBAR_UNREAD_DOT_CLASS = `rounded-full bg-foreground ${COARSE_POINTER_DOT_SIZE_CLASS}`;

export const SIDEBAR_WORKING_STATUS_COLOR_CLASS = "text-muted-foreground/50";

export const SIDEBAR_SUCCESS_STATUS_COLOR_CLASS = "text-success-foreground";

export const SIDEBAR_SUCCESS_STATUS_DOT_CLASS =
  "size-1.5 rounded-full bg-success max-md:pointer-coarse:size-2";

export const SIDEBAR_WAITING_STATUS_COLOR_CLASS = "text-attention";

const SIDEBAR_THREAD_ROW_BASE_PADDING_PX = 8;
const SIDEBAR_THREAD_ROW_DEPTH_STEP_PX = 24;
const SIDEBAR_THREAD_ROW_GLYPH_CENTER_OFFSET_PX = 8;

export const SIDEBAR_STANDARD_ROW_PADDING_CLASS = "pl-2";

export const SIDEBAR_ROW_TEXT_CLASS = "text-sidebar-foreground";

export const SIDEBAR_CONTROL_TONE_CLASS =
  "text-subtle-foreground hover:text-muted-foreground data-[state=open]:text-muted-foreground";

export const SIDEBAR_CONTROL_STATE_CLASS = `${SIDEBAR_CONTROL_TONE_CLASS} hover:bg-state-hover active:bg-state-active data-[state=open]:bg-state-active data-[state=open]:hover:bg-state-active`;

export const SIDEBAR_ROW_INTERACTIVE_STATE_CLASS = `cursor-pointer ${SIDEBAR_ROW_TEXT_CLASS} hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`;

export const SIDEBAR_MORE_ACTION_TRIGGER_CLASS =
  "relative m-1 h-5 w-5 after:absolute after:left-1/2 after:top-1/2 after:h-7 after:w-7 after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] max-md:pointer-coarse:m-0 max-md:pointer-coarse:h-9 max-md:pointer-coarse:w-9 max-md:pointer-coarse:after:hidden";

export const PROJECT_LIST_ACTION_BUTTON_CLASS = cn(
  SIDEBAR_ROW_BASE_CLASS,
  LIST_HOVER_TRANSITION,
  SIDEBAR_STANDARD_ROW_PADDING_CLASS,
  SIDEBAR_ROW_INTERACTIVE_STATE_CLASS,
  COARSE_POINTER_ROW_HEIGHT_CLASS,
  "min-w-0 cursor-pointer justify-start overflow-hidden font-normal ring-sidebar-ring focus-visible:ring-2 disabled:cursor-default disabled:opacity-70 max-md:pointer-coarse:[&_[data-icon-root]]:size-5",
);
