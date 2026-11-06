import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePostMatchStream } from "@/hooks/usePostMatchStream";

class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  withCredentials: boolean;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;
  private listeners: Record<string, Array<(event: MessageEvent) => void>> = {};

  constructor(url: string, init?: EventSourceInit) {
    this.url = url;
    this.withCredentials = Boolean(init?.withCredentials);
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    this.listeners[type] ??= [];
    this.listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void) {
    this.listeners[type] = (this.listeners[type] ?? []).filter(
      (l) => l !== listener
    );
  }

  emitOpen() {
    this.onopen?.();
  }

  emitEvent(type: string, data: unknown, lastEventId = "1730721600000") {
    const event = new MessageEvent(type, {
      data: JSON.stringify(data),
      lastEventId,
    });
    for (const listener of this.listeners[type] ?? []) {
      listener(event);
    }
  }

  emitError() {
    this.onerror?.();
  }

  close() {
    this.closed = true;
  }
}

describe("usePostMatchStream", () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    vi.useFakeTimers();
    vi.stubGlobal("EventSource", MockEventSource);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("connects to SSE endpoint, receives post_matched events, and prepends to items", () => {
    const { result } = renderHook(() => usePostMatchStream({ enabled: true }));

    expect(MockEventSource.instances).toHaveLength(1);
    const source = MockEventSource.instances[0];
    expect(source.withCredentials).toBe(true);

    act(() => {
      source.emitOpen();
    });
    expect(result.current.status).toBe("connected");

    act(() => {
      source.emitEvent(
        "post_matched",
        {
          notificationId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          demandPostId: "d290f1ee-6c54-4b01-90e6-d701748f0851",
          subjectName: "Toán",
          gradeLevel: 9,
          tuitionFeeVnd: 250000,
          feePeriod: "PER_SESSION",
          teachingMode: "OFFLINE",
          provinceName: "Hà Nội",
          districtName: "Quận Cầu Giấy",
          rawAddress: "Cầu Giấy",
          rawContent: "Tìm gia sư Toán lớp 9 Cầu Giấy 250k/buổi",
          isLocationAmbiguous: false,
          matchScore: 0.95,
          createdAt: "2026-11-06T10:00:00Z",
          isRead: false,
        },
        "1001"
      );
    });

    expect(result.current.liveItems).toHaveLength(1);
    expect(result.current.liveItems[0].subjectName).toBe("Toán");
    expect(result.current.lastEventId).toBe("1001");
  });

  it("schedules exponential backoff reconnect when SSE stream errors", () => {
    const { result } = renderHook(() => usePostMatchStream({ enabled: true }));
    const firstSource = MockEventSource.instances[0];

    act(() => {
      firstSource.emitOpen();
      firstSource.emitError();
    });

    expect(result.current.status).toBe("reconnecting");
    expect(firstSource.closed).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(MockEventSource.instances.length).toBeGreaterThanOrEqual(2);
  });
});
