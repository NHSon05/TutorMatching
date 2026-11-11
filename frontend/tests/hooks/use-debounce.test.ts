import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useDebounce } from "@/hooks/use-debounce";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it("emits the latest value only after it stops changing for the delay", () => {
  const { result, rerender } = renderHook(
    ({ value }) => useDebounce(value, 300),
    { initialProps: { value: "a" } }
  );
  expect(result.current).toBe("a");

  rerender({ value: "ab" });
  act(() => vi.advanceTimersByTime(200));
  rerender({ value: "abc" });
  act(() => vi.advanceTimersByTime(200));
  expect(result.current).toBe("a");

  act(() => vi.advanceTimersByTime(100));
  expect(result.current).toBe("abc");
});
