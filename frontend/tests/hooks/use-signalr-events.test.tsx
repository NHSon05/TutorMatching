import { StrictMode } from "react";
import { act, render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSignalREvents } from "@/hooks/use-signalr-events";

const hub = vi.hoisted(() => {
  const connections: Array<{
    state: string;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    resolveStart: () => void;
  }> = [];
  class Builder {
    withUrl() { return this; }
    withAutomaticReconnect() { return this; }
    configureLogging() { return this; }
    build() {
      let resolveStart = () => {};
      const connection = {
        state: "Connecting",
        on: vi.fn(),
        onreconnected: vi.fn(),
        onreconnecting: vi.fn(),
        onclose: vi.fn(),
        start: vi.fn(() => new Promise<void>((resolve) => {
          resolveStart = () => { connection.state = "Connected"; resolve(); };
        })),
        stop: vi.fn(async () => { connection.state = "Disconnected"; }),
        resolveStart: () => resolveStart(),
      };
      connections.push(connection);
      return connection;
    }
  }
  return { connections, Builder };
});

vi.mock("@microsoft/signalr", () => ({
  HubConnectionBuilder: hub.Builder,
  HubConnectionState: { Disconnected: "Disconnected", Connected: "Connected" },
  LogLevel: { Warning: 3 },
}));
const session = { id: "user-1" as string | undefined };
vi.mock("@/hooks/use-session", () => ({ useSession: () => ({ data: session.id ? { id: session.id } : undefined }) }));

function Consumer() {
  useSignalREvents();
  return null;
}

function renderConsumers(count: number) {
  const client = new QueryClient();
  return render(
    <StrictMode>
      <QueryClientProvider client={client}>
        {Array.from({ length: count }, (_, i) => <Consumer key={i} />)}
      </QueryClientProvider>
    </StrictMode>
  );
}

const tick = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

describe("useSignalREvents", () => {
  beforeEach(() => {
    hub.connections.length = 0;
    session.id = "user-1";
  });

  it("does not stop a negotiating connection on a Strict Mode remount", async () => {
    const view = renderConsumers(2);
    await tick();
    expect(hub.connections).toHaveLength(1);
    expect(hub.connections[0].stop).not.toHaveBeenCalled();
    view.unmount();
    await tick();
    await act(async () => hub.connections[0].resolveStart());
    expect(hub.connections[0].stop).toHaveBeenCalledTimes(1);
  });

  it("stops only after start settles when the last consumer unmounts", async () => {
    const view = renderConsumers(1);
    view.unmount();
    await tick();
    const [connection] = hub.connections;
    expect(connection.stop).not.toHaveBeenCalled();
    await act(async () => connection.resolveStart());
    expect(connection.stop).toHaveBeenCalledTimes(1);
  });
});
