import { test, expect } from "@playwright/test";

const api = process.env.PLAYWRIGHT_API_BASE_URL || "http://localhost:5014/api/v1";
test("visitor and wrong role cannot open protected workspaces or another profile", async ({ page }) => {
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/login/);
  expect((await page.request.get(`${api}/users/me`)).status()).toBe(401);
  const email = `authorization-${Date.now()}@example.com`;
  const csrf = await (await page.request.get(`${api}/auth/csrf`)).json();
  expect((await page.request.post(`${api}/auth/register`, {
    headers: { [csrf.headerName]: csrf.requestToken },
    data: { fullName: "Authorization Learner", email, password: "password", passwordConfirmation: "password", role: "LEARNER" },
  })).status()).toBe(201);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/learner\/dashboard/);
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/forbidden/);
  expect((await page.request.get(`${api}/users/me/access/ADMIN`)).status()).toBe(403);
  const foreign = "00000000-0000-0000-0000-000000000001";
  const me = await (await page.request.get(`${api}/users/me?userId=${foreign}`)).json();
  expect(me.id).not.toBe(foreign);
  expect((await page.request.get(`${api}/users/${foreign}`)).status()).toBe(404);
});
