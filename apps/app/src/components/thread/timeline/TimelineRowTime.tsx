const CLOCK_FORMAT = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const FULL_FORMAT = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "medium",
});

export function formatTimelineRowClock(timestamp: number): string {
  return CLOCK_FORMAT.format(timestamp);
}

export function TimelineRowTime({ timestamp }: { timestamp: number }) {
  return (
    <time
      dateTime={new Date(timestamp).toISOString()}
      title={FULL_FORMAT.format(timestamp)}
      className="shrink-0 text-xs tabular-nums text-subtle-foreground"
    >
      {formatTimelineRowClock(timestamp)}
    </time>
  );
}
