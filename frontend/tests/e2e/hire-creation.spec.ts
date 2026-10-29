import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

// Launched only by --hire-browser, with synthetic accounts and an isolated PostgreSQL container.
test("learner submits and recovers a lost response without duplicate creation", async ({
  page,
  context,
}) => {
  const api = process.env.PLAYWRIGHT_API_BASE_URL;
  const password = process.env.DISCOVERY_FIXTURE_PASSWORD;
  const output = process.env.DISCOVERY_FIXTURE_OUTPUT;
  if (!api || !password || !output)
    throw new Error("Use the isolated --hire-browser fixture.");
  test.setTimeout(180_000);
  const keys: string[] = [];
  let first = true;
  await context.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = request.url().replace("http://localhost:5014/api/v1", api);
    if (
      request.method() === "POST" &&
      request.url().endsWith("/hire-requests")
    ) {
      keys.push(request.headers()["idempotency-key"]);
      if (first) {
        first = false;
        const response = await route.fetch({ url });
        expect(response.status()).toBe(201);
        await route.abort("failed"); // Commit succeeded, browser never receives the result.
        return;
      }
    }
    await route.continue({ url });
  });
  await page.goto("/login");
  await page.getByLabel("Email").fill("learner@example.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
  const started = Date.now();
  await page.goto("/tutors");
  await page
    .getByRole("link", {
      name: "Xem hồ sơ Discovery Browser Tutor",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: /Thuê gia sư|Đăng ký học|Gửi yêu cầu/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  await dialog.getByLabel("Ngày bắt đầu").fill(future);
  await dialog.getByText(/Thứ 2: 18:00/).click();
  await expect(dialog.getByLabel(/Thứ 2: 18:00/)).toBeChecked();
  await dialog
    .getByRole("button", { name: "Gửi yêu cầu thuê gia sư →" })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Chưa nhận được xác nhận"
  );
  await expect(dialog.getByText("Đã gửi yêu cầu thuê gia sư!")).toHaveCount(0);
  await dialog
    .getByRole("button", { name: "Gửi yêu cầu thuê gia sư →" })
    .click();
  await expect(dialog.getByText("Đã gửi yêu cầu thuê gia sư!")).toBeVisible();
  expect(keys).toHaveLength(2);
  expect(keys[1]).toBe(keys[0]);
  const elapsedMs = Date.now() - started;
  expect(elapsedMs).toBeLessThanOrEqual(180000);
  await page.screenshot({
    path: join(output, "hire-created.png"),
    fullPage: true,
  });
  writeFileSync(
    join(output, "hiring-timing.json"),
    JSON.stringify({
      elapsedMs,
      submissions: 2,
      uniqueKeys: new Set(keys).size,
    })
  );
});
