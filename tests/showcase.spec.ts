import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});
test(
  "chapters, room selection, image dialog and focus",
  { tag: "@shared" },
  async ({ page }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.locator("main section[id]")).toHaveCount(8);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Courtyard",
    );
    await page.getByRole("button", { name: "Next exterior view" }).click();
    await expect(page.locator(".slide-count")).toContainText("02");
    if (info.project.use.isMobile) {
      const open = page.getByRole("button", { name: "Open chapter menu" });
      await open.click();
      await page
        .getByRole("navigation", { name: "All chapters" })
        .getByRole("link", { name: "Plans", exact: true })
        .click();
    }
    const upper = page.getByRole("tab", { name: "Upper floor" });
    await upper.click();
    await expect(upper).toBeFocused();
    const study = page.getByRole("button", {
      name: "Select Study, room 02",
      exact: true,
    });
    await study.focus();
    await study.press("Enter");
    await expect(page.locator(".room-detail h3")).toHaveText("Study");
    await expect(
      page.locator(".room-list button[aria-pressed=true]"),
    ).toContainText("Study");
    await page
      .getByRole("button", { name: /03Roof terrace|03 Roof terrace/ })
      .click();
    await expect(page.locator(".room-plan-preview img")).toBeVisible();
    await upper.focus();
    await upper.press("ArrowLeft");
    await expect(page.locator(".room-detail h3")).toHaveText("Living room");
    await page.getByRole("button", { name: "Zoom in plan" }).click();
    await expect(page.locator(".drawing")).toHaveAttribute("style", /150%/);
    await page.getByRole("button", { name: "Reset plan zoom" }).click();
    const btn = page.locator("#interiors .image-button").first();
    await btn.click();
    const dialog = page.getByRole("dialog", { name: "Image gallery" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(dialog).toContainText("Kitchen & dining");
    await dialog.getByRole("button", { name: "Previous image" }).click();
    await expect(dialog).toContainText("Living room");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(btn).toBeFocused();
    expect(errors).toEqual([]);
  },
);
test(
  "deferred media, film playback and model interaction",
  { tag: "@desktop" },
  async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (r) => requests.push(r.url()));
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const manifest: Record<string, { files: string[] }> = JSON.parse(
      readFileSync(".next/react-loadable-manifest.json", "utf8"),
    );
    const viewer = Object.entries(manifest).find(([key]) =>
      key.endsWith(" -> ./ModelViewer"),
    );
    expect(viewer).toBeDefined();
    const deferredFiles = viewer![1].files.filter(
      (f) => f.endsWith(".js") && !requests.some((url) => url.endsWith(f)),
    );
    expect(deferredFiles.length).toBeGreaterThan(0);
    expect(
      requests.some((u) => u.includes("massing.glb") || u.includes("film.mp4")),
    ).toBeFalsy();
    await page
      .getByRole("button", { name: "Watch film", exact: true })
      .first()
      .click();
    await expect
      .poll(() =>
        page
          .locator("dialog video")
          .evaluate((v: HTMLVideoElement) => v.currentTime),
      )
      .toBeGreaterThan(0);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "View 3D model" }).click();
    await expect(page.locator("canvas")).toBeVisible();
    await expect
      .poll(() => requests.some((u) => u.endsWith("massing.glb")))
      .toBeTruthy();
    expect(
      deferredFiles.every((file) => requests.some((url) => url.endsWith(file))),
    ).toBeTruthy();
    await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    await page.getByRole("button", { name: "Rotate left" }).click();
    await page.getByRole("button", { name: "Reset view" }).click();
  },
);
test(
  "media failure and unconfigured preview",
  { tag: "@desktop" },
  async ({ page, request }) => {
    await page.route("**/film.mp4", (r) => r.abort());
    await page.route("**/massing.glb", (r) => r.abort());
    await page.goto("/");
    await page
      .locator("#experience")
      .getByRole("button", { name: "Watch film" })
      .click();
    await expect(page.getByText(/The film is unavailable/)).toBeVisible();
    await page.getByRole("button", { name: "View 3D model" }).click();
    await expect(
      page.getByText(/The interactive model is unavailable/),
    ).toBeVisible();
    const res = await request.get("/api/draft-mode/enable");
    expect(res.status()).toBe(503);
    expect(res.headers()["set-cookie"]).toBeUndefined();
    await page.goto("/studio");
    await expect(
      page.getByRole("heading", { name: "Project Studio" }),
    ).toBeVisible();
    expect((await request.get("/unknown-chapter")).status()).toBe(404);
  },
);
test(
  "responsive geometry and overflow",
  { tag: "@desktop" },
  async ({ page }) => {
    await page.goto("/");
    for (const width of [360, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      for (const name of ["Upper floor", "Ground floor"]) {
        await page.getByRole("tab", { name }).click();
        const drawing = await page.locator(".drawing").boundingBox();
        const hotspot = page.locator(".hotspot").first();
        const box = await hotspot.boundingBox();
        const pct = await hotspot.evaluate((el) => [
          parseFloat((el as HTMLElement).style.left),
          parseFloat((el as HTMLElement).style.top),
        ]);
        expect(
          Math.abs(
            box!.x +
              box!.width / 2 -
              drawing!.x -
              (drawing!.width * pct[0]) / 100,
          ),
        ).toBeLessThan(2);
        expect(
          Math.abs(
            box!.y +
              box!.height / 2 -
              drawing!.y -
              (drawing!.height * pct[1]) / 100,
          ),
        ).toBeLessThan(2);
      }
    }
  },
);
