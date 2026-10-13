import { render as testingRender, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { QueryProvider } from "@/providers/query-provider";

export function render(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return testingRender(ui, { wrapper: QueryProvider, ...options });
}
