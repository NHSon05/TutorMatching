import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { Button } from "../src/components";

describe("Photonix Button Component Clone & Design System Enhancements", () => {
  it("renders default button with text and primary variant", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-gray-900"); // primary
    expect(button).toHaveClass("h-11"); // medium default
    expect(button).toHaveClass("rounded-xl"); // rounded default
  });

  it("supports all standard and role-based variants", () => {
    const { rerender } = render(<Button variant="primary">Test</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-gray-900");

    rerender(<Button variant="secondary">Test</Button>);
    expect(screen.getByRole("button")).toHaveClass("border-border-default");

    rerender(<Button variant="tertiary">Test</Button>);
    expect(screen.getByRole("button")).toHaveClass("border-transparent");

    rerender(<Button variant="brand">Test</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-brand");

    rerender(<Button variant="tutor">Test</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-role-tutor");

    rerender(<Button variant="danger">Test</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-status-error");

    rerender(<Button variant="success">Test</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-status-success");
  });

  it("supports all sizes", () => {
    const { rerender } = render(<Button size="small">Small</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-9");

    rerender(<Button size="medium">Medium</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-11");

    rerender(<Button size="large">Large</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-12");
  });

  it("supports shape variations", () => {
    const { rerender } = render(<Button shape="rounded">Rounded</Button>);
    expect(screen.getByRole("button")).toHaveClass("rounded-xl");

    rerender(<Button shape="pill">Pill</Button>);
    expect(screen.getByRole("button")).toHaveClass("rounded-full");
  });

  it("supports full width", () => {
    render(<Button isFullWidth>Full Width</Button>);
    expect(screen.getByRole("button")).toHaveClass("w-full");
  });

  it("renders leading and trailing icons", () => {
    render(
      <Button
        leadingIcon={<span data-testid="lead-icon">IconA</span>}
        trailingIcon={<span data-testid="trail-icon">IconB</span>}
      >
        Actions
      </Button>
    );
    expect(screen.getByTestId("lead-icon")).toBeInTheDocument();
    expect(screen.getByTestId("trail-icon")).toBeInTheDocument();
  });

  it("renders badge count/text", () => {
    render(
      <Button variant="secondary" badge={5}>
        Messages
      </Button>
    );
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("handles loading state properly", () => {
    const handleClick = vi.fn();
    render(
      <Button
        isLoading
        leadingIcon={<span data-testid="lead-icon">Lead</span>}
        onClick={handleClick}
      >
        Saving
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("data-loading", "true");
    // leading icon hidden while loading
    expect(screen.queryByTestId("lead-icon")).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("handles disabled state properly with cursor-not-allowed", () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled Button
      </Button>
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("cursor-not-allowed");
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("supports asChild pattern and forwards ref", () => {
    const ref = React.createRef<HTMLAnchorElement>();
    render(
      <Button
        ref={ref as unknown as React.Ref<HTMLButtonElement>}
        asChild
        variant="brand"
        shape="pill"
      >
        <a href="/test" data-testid="custom-link">
          Link Content
        </a>
      </Button>
    );

    const link = screen.getByTestId("custom-link");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/test");
    expect(link).toHaveClass("bg-brand");
    expect(link).toHaveClass("rounded-full");
    expect(screen.getByText("Link Content")).toBeInTheDocument();
    expect(ref.current).toBe(link);
  });
});
