import { test, expect } from "@playwright/test";

test(
  "full-screen house, floor cutaways, room images and project history",
  { tag: ["@desktop", "@mobile"] },
  async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const files: string[] = [];
    page.on("request", (r) => {
      if (r.url().endsWith(".glb")) files.push(r.url());
    });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/#experience");
    const link = page.getByRole("link", { name: "View 3D model" });
    await link.scrollIntoViewIfNeeded();
    await page.evaluate(
      () => (document.documentElement.style.scrollBehavior = "auto"),
    );
    await link.focus();
    const before = await page.evaluate(() => scrollY);
    await link.press("Enter");
    const explorer = page.getByRole("dialog", { name: "House explorer" });
    await expect(explorer).toBeVisible();
    await expect(page).toHaveURL(/\/model$/);
    await expect(page.locator(".house-explorer")).toHaveAttribute(
      "data-mode",
      "furnished",
    );
    await explorer.getByRole("button", { name: "Ground floor" }).click();
    expect(files.some((u) => u.endsWith("massing.glb"))).toBe(false);
    const select = explorer.getByRole("combobox", { name: "Room" });
    await select.selectOption("living");
    const imageButton = explorer.getByRole("button", {
      name: /Open room image/,
    });
    await imageButton.click();
    const image = page.getByRole("dialog", { name: "Living room image" });
    await expect(image.locator("img")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(image).toHaveCount(0);
    await expect(imageButton).toBeFocused();
    await explorer.getByRole("button", { name: "Upper floor" }).click();
    await select.selectOption("bedroom");
    await expect(
      explorer.getByRole("button", { name: /Open room image/ }),
    ).toBeVisible();
    await select.selectOption("terrace");
    await expect(
      explorer.getByRole("button", { name: /Open room image/ }),
    ).toHaveCount(0);
    await explorer
      .getByRole("button", { name: "Massing", exact: true })
      .click();
    await expect
      .poll(() => files.some((u) => u.endsWith("massing.glb")))
      .toBeTruthy();
    await expect(select).toHaveCount(0);
    await explorer
      .getByRole("button", { name: "Furnished", exact: true })
      .click();
    await expect(
      explorer.getByRole("button", { name: "Ground floor" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.clientWidth >=
          document.documentElement.scrollWidth,
      ),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(explorer).toHaveCount(0);
    await expect(link).toBeFocused();
    expect(
      Math.abs((await page.evaluate(() => scrollY)) - before),
    ).toBeLessThan(5);
    await page.goForward();
    await expect(explorer).toBeVisible();
    await page.goBack();
    await expect(explorer).toHaveCount(0);
    expect(errors).toEqual([]);
  },
);

test(
  "direct model URL and return to Experience",
  { tag: "@desktop" },
  async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/model");
    await expect(
      page.getByRole("button", { name: "Ground floor" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Back to project" }).click();
    await expect(page).toHaveURL(/\/#experience$/);
    await expect(page.locator("#experience")).toBeInViewport();
  },
);
