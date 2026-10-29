import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

// Launched only by --hire-response-browser, with synthetic accounts and an isolated PostgreSQL container.
test("learner creates two requests, tutor reviews list, accepts first and rejects second with reason", async ({
  page,
  context,
}) => {
  const api = process.env.PLAYWRIGHT_API_BASE_URL;
  const password = process.env.DISCOVERY_FIXTURE_PASSWORD;
  const output = process.env.DISCOVERY_FIXTURE_OUTPUT;
  if (!api || !password || !output)
    throw new Error("Use the isolated --hire-response-browser fixture.");
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

  // 2. Learner sends First Hire Request (Monday slot)
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

  // 3. Learner sends Second Hire Request (Wednesday slot)
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

  // 4. Learner logs out
  await page.goto("/login");
  await context.clearCookies();

  // 5. Tutor logs in
  await page.goto("/login");
  await page.getByLabel("Email").fill("tutor@example.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);

  // 6. Tutor navigates to /tutor/requests
  await page.goto("/tutor/requests");
  await expect(page.getByText("Yêu cầu thuê gia sư")).toBeVisible();

  // Both requests must be visible in the list
  const detailLinks = page.getByRole("button", { name: "Xem chi tiết →" });
  await expect(detailLinks).toHaveCount(2);

  // 7. Tutor reviews & ACCEPTS the first request
  await detailLinks.first().click();
  await expect(page).toHaveURL(/\/tutor\/requests\/[a-f0-9-]+/);
  await expect(page.getByText("Chi tiết yêu cầu thuê gia sư")).toBeVisible();
  await expect(page.getByRole("status", { name: "Trạng thái yêu cầu" })).toHaveText("Chờ phản hồi");

  // Click accept button
  const acceptButton = page.getByRole("button", { name: "Chấp nhận yêu cầu" });
  await expect(acceptButton).toBeVisible();
  await acceptButton.click();

  // Verify accepted state: final agreement shown, status updated to "Đã chấp nhận"
  await expect(page.getByText("Thỏa thuận đã thống nhất (Final Agreement)")).toBeVisible();
  await expect(page.getByRole("status", { name: "Trạng thái yêu cầu" })).toHaveText("Đã chấp nhận");
  await expect(acceptButton).not.toBeVisible();
  await page.reload();
  await expect(page.getByRole("status", { name: "Trạng thái yêu cầu" })).toHaveText("Đã chấp nhận");
  await expect(page.getByText("Thỏa thuận đã thống nhất (Final Agreement)")).toBeVisible();

  // 8. Tutor returns to list and REJECTS the second request
  await page.getByRole("link", { name: "← Quay lại danh sách yêu cầu" }).click();
  await expect(page).toHaveURL(/\/tutor\/requests$/);

  // The second request is still PENDING
  const remainingDetailButtons = page.getByRole("button", { name: "Xem chi tiết →" });
  await remainingDetailButtons.nth(1).click();
  await expect(page).toHaveURL(/\/tutor\/requests\/[a-f0-9-]+/);
  await expect(page.getByRole("status", { name: "Trạng thái yêu cầu" })).toHaveText("Chờ phản hồi");

  // Open reject form
  const rejectOpenButton = page.getByRole("button", { name: "Từ chối yêu cầu..." });
  await expect(rejectOpenButton).toBeVisible();
  await rejectOpenButton.click();

  const rejectionReason = "Lịch dạy vào thời gian này tôi đã kín chỗ, hẹn bạn dịp khác.";
  const textarea = page.getByPlaceholder(/Nhập lý do từ chối/);
  await textarea.fill(rejectionReason);

  const confirmRejectButton = page.getByRole("button", { name: "Xác nhận từ chối" });
  await confirmRejectButton.click();

  // Verify rejected state: status badge updated to "Đã từ chối"
  await expect(page.getByRole("status", { name: "Trạng thái yêu cầu" })).toHaveText("Đã từ chối");
  await expect(page.getByText(rejectionReason, { exact: false })).toBeVisible();

  // 9. Verify persistence across page reload
  await page.reload();
  await expect(page.getByText("Chi tiết yêu cầu thuê gia sư")).toBeVisible();
  await expect(page.getByRole("status", { name: "Trạng thái yêu cầu" })).toHaveText("Đã từ chối");
  await expect(page.getByText(rejectionReason, { exact: false })).toBeVisible();

  const elapsedMs = Date.now() - started;
  await page.screenshot({
    path: join(output, "hire-response-completed.png"),
    fullPage: true,
  });

  writeFileSync(
    join(output, "hire-response-timing.json"),
    JSON.stringify({
      elapsedMs,
      completed: true,
      accepted: true,
      rejected: true,
    })
  );
});
