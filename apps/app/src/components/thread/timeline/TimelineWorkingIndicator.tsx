import { cn } from "@bb/shared-ui/lib/utils";
import { ExpandableTimelineRow } from "./ExpandableTimelineRow.js";
import { TimelineReasoningDetail } from "./TimelineReasoningDetail.js";
import { TimelineRowTime } from "./TimelineRowTime.js";
import { TimelineStatusIndicator } from "./TimelineStatusIndicator.js";

const INDICATOR_HEADER_CLASS_NAME = "min-h-7 items-center";

interface TimelineWorkingIndicatorProps {
  label?: string;
  isThinking?: boolean;
  details?: string;
  reasoningId?: string;
  startedAt?: number;
}

export function TimelineWorkingIndicator({
  label,
  isThinking = false,
  details,
  reasoningId,
  startedAt,
}: TimelineWorkingIndicatorProps) {
  const resolvedLabel = label ?? (isThinking ? "Thinking…" : "Working...");
  const hasDetails = (details?.trim().length ?? 0) > 0;

  if (isThinking || hasDetails) {
    return (
      <div className="mt-4">
        <ExpandableTimelineRow
          reasoningExpansionKey={reasoningId}
          expandable={hasDetails}
          headerClassName={INDICATOR_HEADER_CLASS_NAME}
          startedAt={startedAt}
          title={{
            segments: [
              { text: resolvedLabel, em: false, shimmer: true, truncate: true },
            ],
            decorations: [],
            tone: "default",
            action: null,
            plain: resolvedLabel,
          }}
          renderBody={() => <TimelineReasoningDetail text={details ?? ""} />}
        />
      </div>
    );
  }

  return (
    <TimelineStatusIndicator
      label={
        <span className="inline-flex items-center gap-1.5">
          {startedAt !== undefined ? (
            <TimelineRowTime timestamp={startedAt} />
          ) : null}
          <span className="animate-shine">{resolvedLabel}</span>
        </span>
      }
      className={cn("mt-4 flex", INDICATOR_HEADER_CLASS_NAME)}
    />
  );
}
