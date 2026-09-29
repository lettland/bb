// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { ActiveThinking } from "@bb/domain";
import { BottomAnchorContext } from "@/components/ui/bottom-anchored-scroll-body.js";
import { commandRow } from "@/test/fixtures/thread-timeline-rows";
import { ThreadTimelineSurface } from "./ThreadTimelineSurface";

vi.mock("@/hooks/queries/system-queries", () => ({
  useSystemConfig: () => ({ data: undefined }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ThreadTimelineSurface load-older control", () => {
  it("resumes auto-loading after a context boundary replaces a timeline whose older page failed", async () => {
    const intersectionCallbacks: IntersectionObserverCallback[] = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          intersectionCallbacks.push(callback);
        }
        observe(): void {}
        disconnect(): void {}
      },
    );
    const emitLatestSentinelIntersection = () => {
      act(() => {
        intersectionCallbacks.at(-1)?.(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );
      });
    };
    const scrollElement = document.createElement("div");
    vi.spyOn(scrollElement, "getBoundingClientRect").mockReturnValue(
      new DOMRect(0, 0, 100, 500),
    );
    const anchor = {
      captureScrollAnchor: vi.fn(),
      getScrollElement: () => scrollElement,
      isAtBottom: false,
      scrollElementIntoView: vi.fn(),
      scrollElementIntoViewClampedToMaxScroll: vi.fn(),
      scrollToBottom: vi.fn(),
    };
    const onLoadOlderRows = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("Server error"))
      .mockReturnValue(new Promise(() => {}));
    const surface = (contextBoundarySeq: number | null) => (
      <BottomAnchorContext.Provider value={anchor}>
        <ThreadTimelineSurface
          activeThinking={null}
          contextBoundarySeq={contextBoundarySeq}
          hasOlderTimelineRows
          isThreadTimelinePending={false}
          onLoadOlderRows={onLoadOlderRows}
          showOngoingIndicator={false}
          threadId="thread-1"
          threadRuntimeDisplayStatus="idle"
          timelineError={false}
          timelineRows={[]}
          workspaceRootPath={undefined}
        />
      </BottomAnchorContext.Provider>
    );
    const view = render(surface(null));

    emitLatestSentinelIntersection();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Load older messages" }),
      ).not.toBeNull();
    });

    view.rerender(surface(10));
    expect(screen.getByRole("status")).not.toBeNull();

    emitLatestSentinelIntersection();
    expect(onLoadOlderRows).toHaveBeenCalledTimes(2);
  });
});

describe("ThreadTimelineSurface ongoing indicator time", () => {
  const commandStartedAt = new Date(2026, 9, 1, 9, 5, 0).getTime();
  const commandCompletedAt = new Date(2026, 9, 1, 9, 17, 0).getTime();
  const thinkingStartedAt = new Date(2026, 9, 1, 9, 21, 0).getTime();

  function renderSurface(activeThinking: ActiveThinking | null) {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <ThreadTimelineSurface
            activeThinking={activeThinking}
            contextBoundarySeq={null}
            isThreadTimelinePending={false}
            showOngoingIndicator
            threadId="thread-1"
            threadRuntimeDisplayStatus="active"
            timelineError={false}
            timelineRows={[
              commandRow({
                command: "pnpm test",
                startedAt: commandStartedAt,
                durationMs: commandCompletedAt - commandStartedAt,
              }),
            ]}
            workspaceRootPath={undefined}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  it("dates Working... from when the last row finished", () => {
    renderSurface(null);

    expect(screen.getByText("09:17").tagName).toBe("TIME");
  });

  it("dates Thinking... from when the reasoning started", () => {
    renderSurface({
      id: "reasoning-1",
      text: "",
      startedAt: thinkingStartedAt,
      updatedAt: thinkingStartedAt + 60_000,
    });

    expect(screen.getByText("09:21").tagName).toBe("TIME");
    expect(screen.queryByText("09:17")).toBeNull();
  });
});
