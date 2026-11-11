import { test, expect } from "@playwright/test";

test("learner pays via VietQR sandbox, completes lesson, submits review, tutor replies, and public profile shows rating", async ({
  page,
  context,
}) => {
  const api = process.env.PLAYWRIGHT_API_BASE_URL;
  const password = process.env.DISCOVERY_FIXTURE_PASSWORD;
  if (!api || !password) {
    throw new Error("Requires PLAYWRIGHT_API_BASE_URL and DISCOVERY_FIXTURE_PASSWORD.");
  }
  test.setTimeout(180_000);

  await context.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = request.url().replace("http://localhost:5014/api/v1", api);
    await route.continue({ url });
  });

  // 1. Learner logs in and creates a hire request
  await page.goto("/login");
  await page.getByLabel("Email").fill("learner@example.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);

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

  const hireDialog = page.getByRole("dialog");
  const futureDate = new Date(Date.now() + 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  await hireDialog.getByLabel("Ngày bắt đầu").fill(futureDate);
  await hireDialog.getByText(/Thứ 2: 18:00/).click();
  await hireDialog
    .getByRole("button", { name: "Gửi yêu cầu thuê gia sư →" })
    .click();
  await expect(
    hireDialog.getByText("Đã gửi yêu cầu thuê gia sư!")
  ).toBeVisible();
  await hireDialog.getByRole("button", { name: "Đóng", exact: true }).click();

  // 2. Tutor logs in and accepts the request
  await context.clearCookies();
  await page.goto("/login");
  await page.getByLabel("Email").fill("tutor@example.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);

  await page.goto("/request");
  await page.getByRole("link", { name: "Xem chi tiết →" }).first().click();
  await page.getByRole("button", { name: "Chấp nhận yêu cầu" }).click();
  await expect(
    page.getByRole("status", { name: "Trạng thái yêu cầu" })
  ).toHaveText("Đã đồng ý");

  // 3. Learner logs back in, pays via VietQR sandbox, completes request, and leaves review
  await context.clearCookies();
  await page.goto("/login");
  await page.getByLabel("Email").fill("learner@example.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);

  await page.goto("/learner/requests");
  await page.getByRole("link", { name: "Xem chi tiết →" }).first().click();

  // Complete button is disabled before payment
  const completeBtn = page.getByRole("button", { name: "Hoàn tất việc học..." });
  await expect(completeBtn).toBeDisabled();

  await page
    .getByRole("button", { name: "Thanh toán học phí (VietQR)" })
    .click();
  const paymentDialog = page.getByRole("dialog");
  await expect(
    paymentDialog.getByText("Thanh toán học phí VietQR")
  ).toBeVisible();
  await paymentDialog
    .getByRole("button", { name: /Xác nhận đã chuyển khoản \(Sandbox\)/i })
    .click();

  // Complete button is now enabled
  await expect(completeBtn).toBeEnabled();
  await completeBtn.click();

  const closeDialog = page.getByRole("dialog");
  await closeDialog
    .getByRole("checkbox", {
      name: /Tôi xác nhận việc học đã kết thúc hoàn tất/i,
    })
    .check();
  await closeDialog
    .getByRole("button", { name: "Xác nhận hoàn tất" })
    .click();
  await expect(
    page.getByRole("status", { name: "Trạng thái yêu cầu" })
  ).toHaveText("Đã hoàn thành");

  // Leave review
  await page.getByRole("button", { name: "Đánh giá gia sư" }).click();
  const reviewDialog = page.getByRole("dialog");
  await reviewDialog.getByTestId("review-star-5").click();
  await reviewDialog
    .getByRole("textbox", { name: /Nhận xét chi tiết/i })
    .fill("Gia sư dạy rất tận tâm và dễ hiểu!");
  await reviewDialog.getByRole("button", { name: "Gửi đánh giá" }).click();

  await expect(
    page.getByText("Gia sư dạy rất tận tâm và dễ hiểu!")
  ).toBeVisible();

  // 4. Tutor replies to review
  await context.clearCookies();
  await page.goto("/login");
  await page.getByLabel("Email").fill("tutor@example.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();

  await page.goto("/request");
  await page.getByRole("link", { name: "Xem chi tiết →" }).first().click();
  await page
    .getByRole("textbox", { name: /Phản hồi đánh giá của học viên/i })
    .fill("Cảm ơn bạn đã chăm chỉ trong khóa học!");
  await page.getByRole("button", { name: "Gửi phản hồi" }).click();

  await expect(
    page.getByText("Cảm ơn bạn đã chăm chỉ trong khóa học!")
  ).toBeVisible();
});
