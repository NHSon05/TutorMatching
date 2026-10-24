import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const api = process.env.PLAYWRIGHT_API_BASE_URL;
const password = process.env.DISCOVERY_FIXTURE_PASSWORD;
const output = process.env.DISCOVERY_FIXTURE_OUTPUT;
const name = "Discovery Browser Tutor";
const math = "02000000-0000-0000-0000-000000000001";

test.beforeAll(() => {
  if (!api || !password || !output) throw new Error("Run discovery E2E through the isolated backend fixture (--browser); never use developer accounts.");
});

async function mutate(request: APIRequestContext, path: string, data: unknown, method = "POST") {
  const csrfResponse = await request.get(`${api}/auth/csrf`);
  expect(csrfResponse.ok()).toBeTruthy();
  const csrf = await csrfResponse.json();
  const response = await request.fetch(`${api}${path}`, {
    method, headers: { [csrf.headerName]: csrf.requestToken }, data,
  });
  expect(response.ok(), `${path}: ${response.status()} ${await response.text()}`).toBeTruthy();
  return response;
}
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password!);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

test("tutor submission, admin changes/reject/approve, public search/detail, lock and mobile keyboard", async ({ browser }) => {
  test.setTimeout(180_000);
  const tutor = await browser.newContext();
  const admin = await browser.newContext();
  const publicContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  for (const ctx of [tutor, admin, publicContext]) {
    await ctx.route("**/api/v1/**", async route => {
      const url = route.request().url().replace("localhost:5014", "localhost:5108");
      await route.continue({ url });
    });
  }
  const tutorPage = await tutor.newPage();
  tutorPage.on("console", msg => console.log("PAGE LOG:", msg.type(), msg.text()));
  tutorPage.on("pageerror", err => console.log("PAGE ERROR:", err));
  tutorPage.on("requestfailed", req => console.log("REQ FAILED:", req.url(), req.failure()?.errorText));
  tutorPage.on("response", async res => {
    if (res.status() >= 400) console.log("RESP ERROR:", res.status(), res.url(), await res.text().catch(() => ""));
  });
  const adminPage = await admin.newPage();
  const publicPage = await publicContext.newPage();
  try {
    await login(tutorPage, "tutor@example.test");
    const initial = await (await tutor.request.get(`${api}/tutor/onboarding/me`)).json();
    const saved = await mutate(tutor.request, "/tutor/onboarding/draft", {
      expectedVersion: initial.version,
      about: { fullName: name, dateOfBirth: "1995-01-01", phoneNumber: "+84911111111", languages: ["Vietnamese"] },
      avatarUrl: "/uploads/avatars/fixture.jpg",
      education: { educationType: "GRADUATED", degree: "Bachelor" },
      description: { bio: "Browser discovery fixture", experienceYears: 2 },
      pricing: { sessionRateVnd: 150000, isNegotiable: false },
      discovery: { subjects: [{ subjectId: math, levelCodes: ["HIGH_SCHOOL"] }], teachingModes: ["ONLINE"] },
    }, "PUT");
    expect((await saved.json()).status).toBe("DRAFT");
    await mutate(tutor.request, "/tutor/availability", { dayOfWeek: 1, startTime: "18:00", endTime: "20:00" });
    await mutate(tutor.request, "/tutor/courses", { subjectId: math, name: "Browser mathematics", content: "Synthetic lessons", sessionCount: 8, pricePerSessionVnd: 150000, status: "ACTIVE" });
    await tutorPage.goto("/tutor/profile-edit");
    await tutorPage.getByRole("button", { name: "Gửi duyệt hồ sơ" }).click();
    await expect(tutorPage.getByText("Đã gửi hồ sơ chờ duyệt.")).toBeVisible();
    expect((await (await publicContext.request.get(`${api}/tutors?name=Discovery%20Browser`)).json()).totalCount).toBe(0);
    await login(adminPage, "admin@example.test");

    for (const [action, status, reason] of [
      ["Yêu cầu sửa", "DRAFT", "Please clarify the teaching approach"],
      ["Từ chối", "REJECTED", "Please revise the professional introduction"],
      ["Phê duyệt", "APPROVED", ""],
    ]) {
      await adminPage.goto("/admin/tutor-approvals");
      await adminPage.getByRole("button", { name: `Xem hồ sơ ${name}`, exact: true }).click();
      if (reason) await adminPage.getByLabel("Lý do / ghi chú duyệt").fill(reason);
      await adminPage.getByRole("button", { name: action, exact: true }).click();
      await expect(adminPage.getByRole("button", { name: `Xem hồ sơ ${name}`, exact: true })).toHaveCount(0);
      const owner = await (await tutor.request.get(`${api}/tutor/onboarding/me`)).json();
      expect(owner.status).toBe(status);
      const history = await (await tutor.request.get(`${api}/tutor/reviews`)).json();
      if (reason) expect(history[0].note).toBe(reason);
      if (status !== "APPROVED") {
        expect((await (await publicContext.request.get(`${api}/tutors?name=Discovery%20Browser`)).json()).totalCount).toBe(0);
        await tutorPage.goto("/tutor/profile-edit");
        await tutorPage.getByRole("button", { name: "Gửi duyệt hồ sơ" }).click();
        await expect(tutorPage.getByText("Đã gửi hồ sơ chờ duyệt.")).toBeVisible();
      }
    }

    await publicPage.goto("/tutors");
    const search = publicPage.getByLabel("Tên gia sư", { exact: true });
    await search.fill(name);
    await search.press("Enter");
    await expect(publicPage).toHaveURL(/name=Discovery/);
    const link = publicPage.getByRole("link", { name: `Xem hồ sơ ${name}`, exact: true });
    await expect(link).toBeVisible();
    await link.focus();
    await expect(link).toBeFocused();
    await publicPage.keyboard.press("Enter");
    await expect(publicPage.getByRole("heading", { name, exact: true })).toBeVisible();
    await expect(publicPage.getByText("Browser mathematics", { exact: true })).toBeVisible();
    expect(await publicPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await publicPage.screenshot({ path: join(output!, "discovery-mobile.png"), fullPage: true });
    const id = new URL(publicPage.url()).pathname.split("/").pop();
    const detail = await (await publicContext.request.get(`${api}/tutors/${id}`)).json();
    for (const field of ["email", "phoneNumber", "dateOfBirth", "userId", "certifications", "version"]) expect(detail).not.toHaveProperty(field);
    writeFileSync(join(output!, "lock-account"), "lock synthetic fixture only");
    await expect.poll(() => existsSync(join(output!, "account-locked"))).toBeTruthy();
    await publicPage.getByRole("button", { name: "Kiểm tra lại hồ sơ" }).click();
    await expect(publicPage.getByRole("heading", { name: "Hồ sơ gia sư không còn khả dụng" })).toBeVisible();
    await expect(publicPage.getByRole("heading", { name, exact: true })).toHaveCount(0);
    expect((await publicContext.request.get(`${api}/tutors/${id}`)).status()).toBe(404);
    expect((await (await publicContext.request.get(`${api}/tutors?name=Discovery%20Browser`)).json()).totalCount).toBe(0);
  } finally {
    await tutor.close();
    await admin.close();
    await publicContext.close();
  }
});
