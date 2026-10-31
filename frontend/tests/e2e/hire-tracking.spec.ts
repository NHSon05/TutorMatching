import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

test("both participants track six states, pagination and history; outsiders see no private data", async ({
  page,
  context,
}) => {
  const api = process.env.PLAYWRIGHT_API_BASE_URL;
  const password = process.env.DISCOVERY_FIXTURE_PASSWORD;
  const output = process.env.DISCOVERY_FIXTURE_OUTPUT;
  if (!api || !password || !output)
    throw new Error("Use --hire-tracking-browser with isolated fixtures.");
  test.setTimeout(180000);
  await context.route("**/api/v1/**", (route) => {
    const url = new URL(route.request().url());
    return route.continue({
      url: `${api}${url.pathname.slice("/api/v1".length)}${url.search}`,
    });
  });
  async function login(email: string) {
    await context.clearCookies();
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(password!);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page).not.toHaveURL(/\/login/);
  }
  const labels = [
    "Chờ phản hồi",
    "Đang thương lượng",
    "Đã chấp nhận",
    "Đã từ chối",
    "Đã hủy",
    "Đã hoàn thành",
  ];
  let privateId = "";
  const started = Date.now();
  for (const role of ["learner", "tutor"]) {
    await login(`${role}@example.test`);
    await page.goto(`/${role}/requests`);
    const list = page.getByRole("list", { name: "Danh sách yêu cầu" });
    await expect(list.getByRole("link")).toHaveCount(20);
    const firstLinks = await list
      .getByRole("link")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    privateId = firstLinks[0]!.split("/").at(-1)!;
    await page.getByRole("button", { name: "Tải trang tiếp theo" }).click();
    await expect(page.getByText("Trang 2", { exact: true })).toBeVisible();
    await expect(list.getByRole("link")).toHaveCount(4);
    const nextLinks = await list
      .getByRole("link")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(nextLinks.some((link) => firstLinks.includes(link))).toBe(false);
    for (const label of labels) {
      await page.getByText(label, { exact: true }).first().click();
      await expect(
        page.getByRole("tab", { name: label, exact: true })
      ).toHaveAttribute("aria-selected", "true");
      await expect(page.getByText("Trang 1", { exact: true })).toBeVisible();
      await expect(list.getByRole("link")).toHaveCount(4);
      await expect(list.getByText(label, { exact: true })).toHaveCount(4);
      await list.getByRole("link").first().click();
      await expect(
        page.getByRole("status", { name: "Trạng thái yêu cầu" })
      ).toHaveText(label);
      await expect(
        page.getByRole("heading", { name: "Lịch sử yêu cầu" })
      ).toBeVisible();
      await expect(
        page
          .getByRole("region", { name: "Lịch sử trạng thái" })
          .getByText(/Người thực hiện:/)
          .first()
      ).toBeVisible();
      if (
        ["Đang thương lượng", "Đã chấp nhận", "Đã hoàn thành"].includes(label)
      ) {
        await expect(
          page.getByRole("list", { name: "Lịch sử đề xuất" })
        ).toContainText("175.000");
        await expect(
          page.getByText("Điều khoản ban đầu", { exact: true })
        ).toBeVisible();
      }
      if (["Đã chấp nhận", "Đã hoàn thành"].includes(label))
        await expect(
          page.getByText("Thỏa thuận đã thống nhất (Final Agreement)")
        ).toBeVisible();
      await page
        .getByRole("link", { name: "← Quay lại danh sách yêu cầu" })
        .click();
    }
  }
  for (const role of ["learner", "tutor"]) {
    await login(`other-${role}@example.test`);
    await page.goto(`/${role}/requests`);
    await expect(page.getByText("Không có yêu cầu nào phù hợp.")).toBeVisible();
    const response = page.waitForResponse((r) =>
      r.url().endsWith(`/hire-requests/${privateId}`)
    );
    await page.goto(`/${role}/requests/${privateId}`);
    expect((await response).status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "Lịch sử yêu cầu" })
    ).toHaveCount(0);
  }
  writeFileSync(
    join(output, "tracking-browser.json"),
    JSON.stringify({
      elapsedMs: Date.now() - started,
      states: 6,
      participantRoles: 2,
      unrelatedRoles: 2,
      firstPage: 20,
      secondPage: 4,
    })
  );
});
