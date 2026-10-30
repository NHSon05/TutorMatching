import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

test("tutor and learner negotiate price and schedule; recipient accepts latest", async ({
  page,
  context,
}) => {
  const api = process.env.PLAYWRIGHT_API_BASE_URL;
  const password = process.env.DISCOVERY_FIXTURE_PASSWORD;
  const output = process.env.DISCOVERY_FIXTURE_OUTPUT;
  if (!api || !password || !output)
    throw new Error(
      "Use --hire-negotiation-browser with an isolated database."
    );
  test.setTimeout(180000);
  await context.route("**/api/v1/**", (route) => {
    const url = new URL(route.request().url());
    return route.continue({
      url: `${api}${url.pathname.slice("/api/v1".length)}${url.search}`,
    });
  });
  const started = Date.now();
  async function login(email: string) {
    await context.clearCookies();
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(password!);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page).not.toHaveURL(/\/login/);
  }
  await login("learner@example.test");
  await page.goto("/tutors");
  await page
    .getByRole("link", {
      name: "Xem hồ sơ Discovery Browser Tutor",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Thuê gia sư", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Ngày bắt đầu")
    .fill(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  await dialog.getByText(/Thứ 2: 18:00/).click();
  const created = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().endsWith("/hire-requests")
  );
  await dialog
    .getByRole("button", { name: "Gửi yêu cầu thuê gia sư →" })
    .click();
  const { id } = await (await created).json();
  await expect(dialog.getByText("Đã gửi yêu cầu thuê gia sư!")).toBeVisible();
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();

  await login("tutor@example.test");
  await page.goto(`/tutor/requests/${id}`);
  await page.getByLabel("Giá thương lượng (VND/buổi)").fill("175000");
  await page.getByLabel("Ghi chú đề xuất").fill("Mức giá đề xuất của gia sư");
  await page.getByRole("button", { name: "Gửi đề xuất", exact: true }).click();
  await expect(page.getByText("Đã gửi đề xuất.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Chấp nhận đề xuất mới nhất" })
  ).toHaveCount(0);
  await expect(
    page.getByRole("list", { name: "Lịch sử đề xuất" })
  ).toContainText("Đề xuất #1");

  await login("learner@example.test");
  await page.goto(`/learner/requests/${id}`);
  await expect(
    page.getByRole("button", { name: "Chấp nhận đề xuất mới nhất" })
  ).toBeVisible();
  await page.getByText("Đề xuất lịch mới", { exact: true }).click();
  await expect(page.getByLabel("Đề xuất lịch mới")).toBeChecked();
  await page.getByLabel("Giờ bắt đầu 1").fill("19:00");
  await page.getByLabel("Giờ kết thúc 1").fill("20:00");
  await page.getByLabel("Ghi chú đề xuất").fill("Học viên muốn học muộn hơn");
  await page.getByRole("button", { name: "Gửi đề xuất", exact: true }).click();
  await expect(page.getByText("Đã gửi đề xuất.")).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Lịch sử đề xuất" })
  ).toContainText("Đề xuất #2");
  await expect(
    page.getByRole("button", { name: "Chấp nhận đề xuất mới nhất" })
  ).toHaveCount(0);

  await login("tutor@example.test");
  await page.goto(`/tutor/requests/${id}`);
  await page
    .getByRole("button", { name: "Chấp nhận đề xuất mới nhất" })
    .click();
  await expect(
    page.getByRole("status", { name: "Trạng thái yêu cầu" })
  ).toHaveText("Đã chấp nhận");
  await expect(
    page.getByText("Thỏa thuận đã thống nhất (Final Agreement)")
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("status", { name: "Trạng thái yêu cầu" })
  ).toHaveText("Đã chấp nhận");
  await expect(
    page.getByRole("button", { name: "Gửi đề xuất", exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole("list", { name: "Lịch sử đề xuất" })
  ).toContainText("175.000");
  writeFileSync(
    join(output, "hire-negotiation-browser.json"),
    JSON.stringify({
      elapsedMs: Date.now() - started,
      requestId: id,
      proposals: 2,
      acceptedSequence: 2,
    })
  );
});
