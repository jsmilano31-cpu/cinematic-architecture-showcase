import { expect, test, type Page } from "@playwright/test";
const source = "/demo/sequence/";
async function jump(page: Page, position: number) {
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "instant" }),
    position,
  );
}
async function frame(page: Page) {
  return Number(
    (await page.locator(".film-screen").getAttribute("data-frame")) ?? -1,
  );
}
test(
  "film scrubs in both directions, holds during chapters, and defers downloads",
  { tag: "@desktop" },
  async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes(source)) requests.push(r.url());
    });
    await page.goto("/");
    const main = page.locator("#main");
    await expect(main).toHaveAttribute("data-film-state", "scroll");
    expect(requests).toEqual([]);
    await page.getByRole("link", { name: "Explore the project" }).focus();
    await jump(page, 720);
    await expect.poll(() => frame(page)).toBeGreaterThan(0);
    await expect(page.locator(".hero-inner")).toHaveCSS("opacity", "1");
    await page
      .getByRole("link", { name: "Explore the project" })
      .evaluate((el) => el.blur());
    await expect(page.locator(".hero-actions")).toHaveAttribute("inert", "");
    const y = await page
      .locator(".film-interlude")
      .nth(2)
      .evaluate((el) => el.getBoundingClientRect().top + scrollY);
    await jump(page, y);
    await expect.poll(() => frame(page)).toBeGreaterThan(100);
    const later = await frame(page);
    await jump(page, 420);
    await expect.poll(() => frame(page)).toBeLessThan(later);
    await jump(page, 0);
    await expect(main).not.toHaveAttribute("data-film-drawn", "true");
    await expect(page.locator(".hero-inner")).toHaveCSS("opacity", "1");
    await page.getByRole("link", { name: "Explore the project" }).click();
    await expect(page).toHaveURL(/#vision$/);
    await page
      .getByRole("navigation", { name: "Main chapters" })
      .getByRole("link", { name: "Plans" })
      .click();
    await page.getByRole("tab", { name: "Upper floor" }).click();
    await page.getByRole("button", { name: "Select Study, room 02" }).click();
    await expect(page.locator(".room-detail h3")).toHaveText("Study");
    expect(requests.length).toBeLessThan(180);
  },
);
test(
  "portrait frames and rotation preserve the scroll presentation",
  { tag: "@mobile" },
  async ({ page }) => {
    await page.goto("/");
    await jump(page, 540);
    const screen = page.locator(".film-screen");
    await expect(screen).toHaveAttribute("data-variant", "portrait");
    await expect.poll(() => frame(page)).toBeGreaterThan(0);
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(screen).toHaveAttribute("data-variant", "landscape");
    await expect.poll(() => frame(page)).toBeGreaterThan(0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator("#main")).toHaveAttribute(
      "data-film-state",
      "stills",
    );
    await expect(screen).toBeHidden();
  },
);
test(
  "data saving bypasses frames; a failed frame falls back in place",
  { tag: "@desktop" },
  async ({ page }) => {
    await page.addInitScript(() =>
      Object.defineProperty(navigator, "connection", {
        configurable: true,
        value: Object.assign(new EventTarget(), { saveData: true }),
      }),
    );
    const urls: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes(source)) urls.push(r.url());
    });
    await page.goto("/");
    await jump(page, 500);
    await expect(page.locator("#main")).toHaveAttribute(
      "data-film-state",
      "stills",
    );
    expect(urls).toEqual([]);
    await page.evaluate(() => {
      const c = (
        navigator as Navigator & {
          connection: EventTarget & { saveData: boolean };
        }
      ).connection;
      c.saveData = false;
      c.dispatchEvent(new Event("change"));
    });
    await page.route("**/sequence/landscape/*.webp", (r) => r.abort());
    await jump(page, 1000);
    await expect(page.locator("#main")).toHaveAttribute(
      "data-film-state",
      "failed",
    );
    await expect(page.locator(".film-screen")).toBeHidden();
    await expect(page.locator(".film-opening")).toHaveCSS(
      "min-height",
      "1800px",
    );
  },
);
