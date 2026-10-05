import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { IconButton } from "../src/components";

describe("IconButton Component - Design System & Photonix Alignment", () => {
  it("renders default icon button with aria-label and primary variant", () => {
    render(
      <IconButton aria-label="Tìm kiếm" icon={<span data-testid="search-icon">🔍</span>} />
    );
    const button = screen.getByRole("button", { name: "Tìm kiếm" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-gray-900"); // primary
    expect(button).toHaveClass("w-11"); // medium default width
    expect(button).toHaveClass("h-11"); // medium default height
    expect(button).toHaveClass("rounded-xl"); // rounded default
    expect(screen.getByTestId("search-icon")).toBeInTheDocument();
  });

  it("supports all variants including ghost and role variants", () => {
    const { rerender } = render(
      <IconButton aria-label="Action" variant="primary" icon={<span>★</span>} />
    );
    expect(screen.getByRole("button")).toHaveClass("bg-gray-900");

    rerender(<IconButton aria-label="Action" variant="secondary" icon={<span>★</span>} />);
    expect(screen.getByRole("button")).toHaveClass("border-border-default");

    rerender(<IconButton aria-label="Action" variant="tertiary" icon={<span>★</span>} />);
    expect(screen.getByRole("button")).toHaveClass("border-transparent");

    rerender(<IconButton aria-label="Action" variant="ghost" icon={<span>★</span>} />);
    expect(screen.getByRole("button")).toHaveClass("text-gray-600");

    rerender(<IconButton aria-label="Action" variant="brand" icon={<span>★</span>} />);
    expect(screen.getByRole("button")).toHaveClass("bg-brand");

    rerender(<IconButton aria-label="Action" variant="tutor" icon={<span>★</span>} />);
    expect(screen.getByRole("button")).toHaveClass("bg-role-tutor");

    rerender(<IconButton aria-label="Action" variant="danger" icon={<span>★</span>} />);
    expect(screen.getByRole("button")).toHaveClass("bg-status-error");

    rerender(<IconButton aria-label="Action" variant="success" icon={<span>★</span>} />);
    expect(screen.getByRole("button")).toHaveClass("bg-status-success");
  });

  it("supports all size scales: xsmall, small, medium, large", () => {
    const { rerender } = render(
      <IconButton aria-label="Size Test" size="xsmall" icon={<span>★</span>} />
    );
    expect(screen.getByRole("button")).toHaveClass("w-7");
    expect(screen.getByRole("button")).toHaveClass("h-7");

    rerender(<IconButton aria-label="Size Test" size="small" icon={<span>★</span>} />);
    expect(screen.getByRole("button")).toHaveClass("w-9");
    expect(screen.getByRole("button")).toHaveClass("h-9");

    rerender(<IconButton aria-label="Size Test" size="medium" icon={<span>★</span>} />);
    expect(screen.getByRole("button")).toHaveClass("w-11");
    expect(screen.getByRole("button")).toHaveClass("h-11");

    rerender(<IconButton aria-label="Size Test" size="large" icon={<span>★</span>} />);
    expect(screen.getByRole("button")).toHaveClass("w-12");
    expect(screen.getByRole("button")).toHaveClass("h-12");
  });

  it("supports shape variations: rounded and circle", () => {
    const { rerender } = render(
      <IconButton aria-label="Shape Test" shape="rounded" icon={<span>★</span>} />
    );
    expect(screen.getByRole("button")).toHaveClass("rounded-xl");

    rerender(<IconButton aria-label="Shape Test" shape="circle" icon={<span>★</span>} />);
    expect(screen.getByRole("button")).toHaveClass("rounded-full");
  });

  it("renders notification dot and count badges correctly", () => {
    const { rerender } = render(
      <IconButton aria-label="Thông báo" badge={true} icon={<span>🔔</span>} />
    );
    const dot = screen.getByRole("button").querySelector(".bg-status-error.rounded-full");
    expect(dot).toBeInTheDocument();

    rerender(
      <IconButton aria-label="Tin nhắn" badge={9} icon={<span>💬</span>} />
    );
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("renders tooltip and maps to title attribute for browser hover", () => {
    render(
      <IconButton aria-label="Cài đặt" tooltip="Mở bảng cài đặt" icon={<span>⚙</span>} />
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("title", "Mở bảng cài đặt");
  });

  it("handles loading state properly", () => {
    const handleClick = vi.fn();
    render(
      <IconButton
        aria-label="Đang đồng bộ"
        isLoading
        icon={<span data-testid="icon">⚙</span>}
        onClick={handleClick}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("data-loading", "true");
    // icon is replaced by spinner during loading
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("handles disabled state properly", () => {
    const handleClick = vi.fn();
    render(
      <IconButton
        aria-label="Vô hiệu"
        disabled
        icon={<span>⚙</span>}
        onClick={handleClick}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("supports asChild slot pattern with Link element", () => {
    render(
      <IconButton asChild aria-label="Liên kết cài đặt" variant="brand" shape="circle">
        <a href="/settings" data-testid="custom-link">
          <span>⚙</span>
        </a>
      </IconButton>
    );

    const link = screen.getByTestId("custom-link");
    expect(link).toBeInTheDocument();
    expect(link.tagName.toLowerCase()).toBe("a");
    expect(link).toHaveAttribute("href", "/settings");
    expect(link).toHaveAttribute("aria-label", "Liên kết cài đặt");
    expect(link).toHaveClass("bg-brand");
    expect(link).toHaveClass("rounded-full");
  });
});
