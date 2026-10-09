import { test, expect } from "@playwright/test";

test.describe("Registration Journey", () => {
  const uniqueId = Date.now();
  const apiBaseUrl = (process.env.PLAYWRIGHT_API_BASE_URL || "http://localhost:5000/api/v1")
    .replace(/\/+$/, "");

  test("can register as a learner and see success confirmation", async ({ page }) => {
    const email = `learner-${uniqueId}@example.com`;

    await page.goto("/register");
    await page.getByRole("tab", { name: "Học Sinh", exact: true }).click();
    await page.getByLabel("Họ và tên").fill("Nguyen Van Learner");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill("SecurePass123");
    await page.getByLabel("Xác nhận mật khẩu").fill("SecurePass123");

    await page.getByRole("button", { name: "Đăng ký" }).click();

    await expect(page.getByRole("status")).toContainText("Đăng ký thành công");
    await expect(page.getByRole("link", { name: "Đăng nhập" })).toBeVisible();
  });

  test("can register as a tutor", async ({ page }) => {
    const email = `tutor-${uniqueId}@example.com`;

    await page.goto("/register");
    await page.getByRole("tab", { name: "Gia sư", exact: true }).click();
    await page.getByLabel("Họ và tên").fill("Tran Thi Tutor");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill("SecurePass123");
    await page.getByLabel("Xác nhận mật khẩu").fill("SecurePass123");

    await page.getByRole("button", { name: "Đăng ký" }).click();

    await expect(page.getByRole("status")).toContainText("Đăng ký thành công");
  });

  test("shows conflict error on duplicate normalized email", async ({ page }) => {
    const email = `dup-${uniqueId}@example.com`;

    // 1st registration
    await page.goto("/register");
    await page.getByLabel("Họ và tên").fill("First Account");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill("SecurePass123");
    await page.getByLabel("Xác nhận mật khẩu").fill("SecurePass123");
    await page.getByRole("button", { name: "Đăng ký" }).click();
    await expect(page.getByRole("status")).toContainText("Đăng ký thành công");

    // 2nd registration with whitespace and uppercase
    await page.goto("/register");
    await page.getByLabel("Họ và tên").fill("Second Account");
    await page.getByLabel("Email").fill(`  ${email.toUpperCase()}  `);
    await page.getByLabel("Mật khẩu", { exact: true }).fill("SecurePass123");
    await page.getByLabel("Xác nhận mật khẩu").fill("SecurePass123");
    await page.getByRole("button", { name: "Đăng ký" }).click();

    await expect(page.getByText("Email này đã được sử dụng.")).toBeVisible();
  });

  test("validates required fields and password length", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Họ và tên").fill("Short Pass");
    await page.getByLabel("Email").fill(`short-${uniqueId}@example.com`);
    await page.getByLabel("Mật khẩu", { exact: true }).fill("short");
    await page.getByLabel("Xác nhận mật khẩu").fill("different");

    await page.getByRole("button", { name: "Đăng ký" }).click();

    await expect(page.getByText("Mật khẩu phải có ít nhất 8 ký tự.")).toBeVisible();
    await expect(page.getByText("Mật khẩu xác nhận không trùng khớp.")).toBeVisible();
  });

  test("rejects an administrator role injected into the registration request", async ({ page }) => {
    const email = `admin-tampering-${uniqueId}@example.com`;
    const csrfResponse = await page.request.get(`${apiBaseUrl}/auth/csrf`);
    expect(csrfResponse.ok()).toBeTruthy();
    const csrf = await csrfResponse.json() as { requestToken: string; headerName: string };
    const request = {
      fullName: "Injected Admin",
      email,
      password: "SecurePass123",
      passwordConfirmation: "SecurePass123",
    };

    const tamperedResponse = await page.request.post(`${apiBaseUrl}/auth/register`, {
      data: { ...request, role: "ADMIN" },
      headers: { [csrf.headerName]: csrf.requestToken },
    });
    expect(tamperedResponse.status()).toBe(422);

    const learnerResponse = await page.request.post(`${apiBaseUrl}/auth/register`, {
      data: { ...request, role: "LEARNER" },
      headers: { [csrf.headerName]: csrf.requestToken },
    });
    expect(learnerResponse.status()).toBe(201);
  });
});
