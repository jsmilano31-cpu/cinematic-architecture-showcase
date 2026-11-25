import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test(
  "keyboard dialogs, reduced motion, and accessibility",
  { tag: "@desktop" },
  async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    const opener = page.locator("#interiors .image-button").first();
    await opener.focus();
    await opener.press("Space");
    const d = page.getByRole("dialog");
    await expect(d).toBeVisible();
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      expect(
        await d.evaluate((el) => el.contains(document.activeElement)),
      ).toBeTruthy();
    }
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
    await expect(page.locator("#main")).not.toHaveClass(/motion-ready/);
  },
);
test(
  "mobile gallery controls and bounded plan pan",
  { tag: "@mobile" },
  async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const controls = page.locator("#interiors .gallery-mobile-controls");
    for (let i = 1; i < 4; i++) {
      await controls.getByRole("button", { name: "Next gallery image" }).tap();
      await expect(controls.locator("span")).toHaveText(i + 1 + " / 4");
    }
    await expect(
      controls.getByRole("button", { name: "Next gallery image" }),
    ).toBeDisabled();
    await controls
      .getByRole("button", { name: "Previous gallery image" })
      .tap();
    await expect(controls.locator("span")).toHaveText("3 / 4");
    await page.getByRole("button", { name: "Zoom in plan" }).tap();
    const viewport = page.locator(".drawing-scroll");
    await viewport.evaluate((el) => el.scrollTo(el.scrollWidth, 0));
    await expect
      .poll(() => viewport.evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(0);
    await page.getByRole("button", { name: "Reset plan zoom" }).tap();
    await expect
      .poll(() => viewport.evaluate((el) => el.scrollLeft))
      .toEqual(0);
  },
);
test(
  "desktop motion cleans up on resize and reduced motion",
  { tag: "@desktop" },
  async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#main")).toHaveClass(/motion-ready/);
    await page.locator("#exterior").scrollIntoViewIfNeeded();
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator("#main")).not.toHaveClass(/motion-ready/);
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator("#main")).toHaveClass(/motion-ready/);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator("#main")).not.toHaveClass(/motion-ready/);
  },
);
test(
  "document stays readable without JavaScript and long titles fit on phones",
  { tag: "@desktop" },
  async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 360, height: 740 },
    });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:" + (process.env.TEST_PORT || 3100));
    await expect(page.locator("#vision h2")).toBeVisible();
    await expect(page.locator("main section")).toHaveCount(8);
    await page.locator("h1").evaluate((el) => {
      el.textContent = "Garden Observatory and Courtyard Pavilion";
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await context.close();
  },
);
