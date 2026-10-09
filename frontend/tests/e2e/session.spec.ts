import { test, expect } from "@playwright/test";

const api = process.env.PLAYWRIGHT_API_BASE_URL || "http://localhost:5014/api/v1";
test("login, private profile, logout, then reject a copied cookie", async ({ page, browser }) => {
  const email = `session-${Date.now()}@example.com`;
  const csrf = await (await page.request.get(`${api}/auth/csrf`)).json();
  const registered = await page.request.post(`${api}/auth/register`, {
    headers: { [csrf.headerName]: csrf.requestToken },
    data: { fullName: "Session Learner", email, password: "password", passwordConfirmation: "password", role: "LEARNER" },
  });
  expect(registered.status()).toBe(201);
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/learner\/dashboard/);
  await expect(page.getByRole("navigation", { name: "Tài khoản" })).toBeVisible();
  const cookies = await page.context().cookies();
  expect((await page.request.get(`${api}/users/me`)).status()).toBe(200);
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(page).toHaveURL(/login/);
  const replay = await browser.newContext();
  await replay.addCookies(cookies);
  expect((await replay.request.get(`${api}/users/me`)).status()).toBe(401);
  await replay.close();
});
