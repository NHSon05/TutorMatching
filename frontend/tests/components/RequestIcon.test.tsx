import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import * as React from "react";
import { RequestIcon, HireRequestIcon } from "@/components/icons";

describe("RequestIcon Component", () => {
  it("renders with default clipboard variant and default classes", () => {
    const { container } = render(<RequestIcon />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("w-5", "h-5");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    expect(container.querySelector("rect")).toBeInTheDocument();
  });

  it("supports custom className", () => {
    const { container } = render(<RequestIcon className="w-6 h-6 text-brand" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("w-6", "h-6", "text-brand");
  });

  it("supports git variant", () => {
    const { container } = render(<RequestIcon variant="git" />);
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(2);
  });

  it("supports inbox variant", () => {
    const { container } = render(<RequestIcon variant="inbox" />);
    const polyline = container.querySelector("polyline");
    expect(polyline).toBeInTheDocument();
  });

  it("exports HireRequestIcon as an alias", () => {
    expect(HireRequestIcon).toBe(RequestIcon);
  });
});
