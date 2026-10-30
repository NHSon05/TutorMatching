import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

// Launched only by --hire-close-browser, with synthetic accounts and an isolated PostgreSQL container.
test("learner creates request, tutor accepts, learner completes; learner creates second, tutor accepts, learner cancels with reason", async ({
  page,
  context,
}) => {
  const api = process.env.PLAYWRIGHT_API_BASE_URL;
  const password = process.env.DISCOVERY_FIXTURE_PASSWORD;
  const output = process.env.DISCOVERY_FIXTURE_OUTPUT;
  if (!api || !password || !output)
    throw new Error("Use the isolated --hire-close-browser fixture.");
  test.setTimeout(180_000);

  // Proxy frontend API requests to the isolated test fixture backend
  await context.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = request.url().replace("http://localhost:5014/api/v1", api);
    await route.continue({ url });
  });

  const started = Date.now();

  // 1. Learner logs in
  await page.goto("/login");
  await page.getByLabel("Email").fill("learner@example.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);

  // 2. Learner creates Request #1 (Monday slot)
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

  const dialog1 = page.getByRole("dialog");
  const future1 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  await dialog1.getByLabel("Ngày bắt đầu").fill(future1);
  await dialog1.getByText(/Thứ 2: 18:00/).click();
  await expect(dialog1.getByLabel(/Thứ 2: 18:00/)).toBeChecked();
  await dialog1
    .getByRole("button", { name: "Gửi yêu cầu thuê gia sư →" })
    .click();
  await expect(dialog1.getByText("Đã gửi yêu cầu thuê gia sư!")).toBeVisible();
  await dialog1.getByRole("button", { name: "Đóng", exact: true }).click();

  // 3. Learner creates Request #2 (Wednesday slot)
  await page
    .getByRole("button", { name: /Thuê gia sư|Đăng ký học|Gửi yêu cầu/ })
    .first()
    .click();
  const dialog2 = page.getByRole("dialog");
  const future2 = new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10);
  await dialog2.getByLabel("Ngày bắt đầu").fill(future2);
  await dialog2.getByText(/Thứ 4: 18:00/).click();
  await expect(dialog2.getByLabel(/Thứ 4: 18:00/)).toBeChecked();
  await dialog2
    .getByRole("button", { name: "Gửi yêu cầu thuê gia sư →" })
    .click();
  await expect(dialog2.getByText("Đã gửi yêu cầu thuê gia sư!")).toBeVisible();
  await dialog2.getByRole("button", { name: "Đóng", exact: true }).click();

  // 4. Tutor logs in to accept both requests
  await page.goto("/login");
  await context.clearCookies();
  await page.goto("/login");
  await page.getByLabel("Email").fill("tutor@example.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);

  await page.goto("/tutor/requests");
  await expect(page.getByText("Yêu cầu thuê gia sư")).toBeVisible();
  const detailLinks = page.getByRole("link", { name: "Xem chi tiết →" });
  await expect(detailLinks).toHaveCount(2);

  // Accept Request #1
  await detailLinks.first().click();
  await expect(page).toHaveURL(/\/tutor\/requests\/[a-f0-9-]+/);
  await page.getByRole("button", { name: "Chấp nhận yêu cầu" }).click();
  await expect(page.getByRole("status", { name: "Trạng thái yêu cầu" })).toHaveText("Đã chấp nhận");

  // Accept Request #2
  await page.goto("/tutor/requests");
  await page.getByRole("link", { name: "Xem chi tiết →" }).nth(1).click();
  await expect(page).toHaveURL(/\/tutor\/requests\/[a-f0-9-]+/);
  await page.getByRole("button", { name: "Chấp nhận yêu cầu" }).click();
  await expect(page.getByRole("status", { name: "Trạng thái yêu cầu" })).toHaveText("Đã chấp nhận");

  // 5. Learner logs in to Complete Request #1 and Cancel Request #2
  await page.goto("/login");
  await context.clearCookies();
  await page.goto("/login");
  await page.getByLabel("Email").fill("learner@example.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);

  await page.goto("/learner/requests");
  await expect(page.getByText("Yêu cầu thuê gia sư")).toBeVisible();
  const learnerLinks = page.getByRole("link", { name: "Xem chi tiết →" });
  await expect(learnerLinks).toHaveCount(2);

  // Complete Request #1
  await learnerLinks.first().click();
  await expect(page).toHaveURL(/\/learner\/requests\/[a-f0-9-]+/);
  await expect(page.getByRole("status", { name: "Trạng thái yêu cầu" })).toHaveText("Đã chấp nhận");

  await page.getByRole("button", { name: "Hoàn tất việc học..." }).click();
  const completeDialog = page.getByRole("dialog");
  await expect(completeDialog.getByText("Xác nhận hoàn tất việc học")).toBeVisible();
  await completeDialog.getByText(/Tôi xác nhận việc học đã kết thúc hoàn tất/i).click();
  await completeDialog.getByRole("button", { name: "Xác nhận hoàn tất" }).click();

  await expect(page.getByRole("status", { name: "Trạng thái yêu cầu" })).toHaveText("Đã hoàn thành");
  await expect(page.getByRole("button", { name: "Hoàn tất việc học..." })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Hủy yêu cầu..." })).not.toBeVisible();

  // Cancel Request #2 with Reason
  await page.goto("/learner/requests");
  await page.getByRole("link", { name: "Xem chi tiết →" }).nth(1).click();
  await expect(page).toHaveURL(/\/learner\/requests\/[a-f0-9-]+/);
  await expect(page.getByRole("status", { name: "Trạng thái yêu cầu" })).toHaveText("Đã chấp nhận");

  await page.getByRole("button", { name: "Hủy yêu cầu..." }).click();
  const cancelDialog = page.getByRole("dialog");
  await expect(cancelDialog.getByText("Xác nhận hủy yêu cầu đã đồng ý")).toBeVisible();
  await cancelDialog.getByText(/Tôi xác nhận muốn hủy thỏa thuận đã chốt/i).click();

  const cancelReason = "Học viên thay đổi nơi ở đột xuất, không thể tiếp tục khóa học.";
  await cancelDialog.getByPlaceholder(/Nhập lý do hủy thỏa thuận/).fill(cancelReason);
  await cancelDialog.getByRole("button", { name: "Xác nhận hủy" }).click();

  await expect(page.getByRole("status", { name: "Trạng thái yêu cầu" })).toHaveText("Đã hủy");
  await expect(page.getByRole("button", { name: "Hoàn tất việc học..." })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Hủy yêu cầu..." })).not.toBeVisible();

  // 6. Reload to verify persistence
  await page.reload();
  await expect(page.getByRole("status", { name: "Trạng thái yêu cầu" })).toHaveText("Đã hủy");

  const elapsedMs = Date.now() - started;
  await page.screenshot({
    path: join(output, "hire-close-completed.png"),
    fullPage: true,
  });

  writeFileSync(
    join(output, "hire-close-timing.json"),
    JSON.stringify({
      elapsedMs,
      completed: true,
      cancelled: true,
    })
  );
});
