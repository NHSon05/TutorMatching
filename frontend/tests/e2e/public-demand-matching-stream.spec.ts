import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

/**
 * T056 — End-to-end journey for feature 006 (public demand matching + realtime SSE):
 *   1. An APPROVED tutor logs in, configures a matching profile and opens the dashboard live feed (SSE).
 *   2. An anonymous visitor submits a natural-language request on the public /tutors page.
 *   3. The visitor sees extracted criteria + matched tutors; the tutor receives the post via SSE (< 2 s target).
 *
 * Runs only against an isolated backend fixture. Required env:
 *   PLAYWRIGHT_API_BASE_URL       e.g. http://localhost:5014/api/v1
 *   E2E_APPROVED_TUTOR_EMAIL      APPROVED + ACTIVE tutor seeded in the fixture database
 *   E2E_APPROVED_TUTOR_PASSWORD
 * Never point this at developer or production accounts.
 */
const api = process.env.PLAYWRIGHT_API_BASE_URL;
const tutorEmail = process.env.E2E_APPROVED_TUTOR_EMAIL;
const tutorPassword = process.env.E2E_APPROVED_TUTOR_PASSWORD;

test.skip(
  !api || !tutorEmail || !tutorPassword,
  "Set PLAYWRIGHT_API_BASE_URL, E2E_APPROVED_TUTOR_EMAIL and E2E_APPROVED_TUTOR_PASSWORD (isolated fixture only).",
);

async function mutate(request: APIRequestContext, path: string, data: unknown, method = "POST") {
  const csrfResponse = await request.get(`${api}/auth/csrf`);
  expect(csrfResponse.ok()).toBeTruthy();
  const csrf = await csrfResponse.json();
  const response = await request.fetch(`${api}${path}`, {
    method,
    headers: { [csrf.headerName]: csrf.requestToken },
    data,
  });
  expect(response.ok(), `${method} ${path}: ${response.status()} ${await response.text()}`).toBeTruthy();
  return response;
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

test("public natural-language demand → matched tutors → tutor receives realtime SSE post", async ({ browser }) => {
  test.setTimeout(120_000);
  const tutorContext = await browser.newContext();
  const publicContext = await browser.newContext({ viewport: { width: 390, height: 844 } });

  try {
    // 1. Tutor: login, widen matching profile so the demand below always matches, open live feed.
    const tutorPage = await tutorContext.newPage();
    await login(tutorPage, tutorEmail!, tutorPassword!);

    await mutate(
      tutorContext.request,
      "/tutors/me/matching-profile",
      {
        preferredSubjects: [],
        preferredGrades: [],
        minTuitionFeeVnd: 0,
        maxTuitionFeeVnd: null,
        preferredProvinceCode: null,
        preferredDistrictCodes: [],
        receiveAllDistricts: true,
        teachingModes: ["ONLINE", "OFFLINE", "HYBRID"],
        isActive: true,
      },
      "PUT",
    );

    await tutorPage.goto("/tutor");
    await expect(
      tutorPage.getByRole("heading", { name: "Yêu cầu tìm gia sư phù hợp theo thời gian thực" }),
    ).toBeVisible();
    await expect(tutorPage.getByText("Đang nhận thông báo trực tuyến")).toBeVisible({ timeout: 15_000 });

    // 2. Visitor: submit a unique natural-language request on the public discovery page.
    const marker = `E2E-${Date.now()}`;
    const queryText = `Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 tại Quận Cầu Giấy Hà Nội, học phí 500k/buổi tuần 2 buổi ${marker}`;

    const publicPage = await publicContext.newPage();
    await publicPage.goto("/tutors");
    await publicPage.getByLabel("Nhập nhu cầu tìm gia sư bằng câu tự nhiên").fill(queryText);

    const matchResponse = publicPage.waitForResponse(
      (res) => res.url().includes("/public/tutor-demands/match") && res.request().method() === "POST",
    );
    const submittedAt = Date.now();
    await publicPage.getByRole("button", { name: "Tìm & Khớp nối gia sư" }).click();

    // 3a. Public response: < 2.5 s, extracted criteria rendered, no private tutor data exposed.
    const response = await matchResponse;
    expect(response.status()).toBe(200);
    expect(Date.now() - submittedAt).toBeLessThan(2_500);
    const body = await response.json();
    expect(body.extractedCriteria.subjectName).toMatch(/Toán/);
    expect(body.extractedCriteria.gradeLevel).toBe(9);
    expect(body.extractedCriteria.tuitionFeeVnd).toBe(500_000);
    const raw = JSON.stringify(body);
    expect(raw).not.toMatch(/"(email|phoneNumber|dateOfBirth)"/i);
    await expect(publicPage.getByRole("status")).toBeVisible();

    // 3b. Tutor dashboard: the same demand arrives over SSE without reload (< 2 s target, 5 s CI budget).
    await expect(tutorPage.getByText(marker, { exact: false })).toBeVisible({ timeout: 5_000 });
    await expect(tutorPage.getByText(/Toán.*Lớp 9/).first()).toBeVisible();
  } finally {
    await tutorContext.close();
    await publicContext.close();
  }
});
