import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { evaluate, parse } from "groq-js";
import { demoProject } from "../src/content/demo";
import { showcaseQuery } from "../src/sanity/query";
import { Gallery } from "../src/components/Gallery";
import { Plans } from "../src/components/Plans";
import { contactUrl, mediaUrl } from "../src/lib/media";
test("demo seed resolves through the same GROQ as Studio content", async () => {
  const dataset = readFileSync(".qa/demo.ndjson", "utf8")
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line));
  const result = await (
    await evaluate(parse(showcaseQuery), { dataset })
  ).get();
  assert.equal(result.project.title, demoProject.title);
  assert.equal(result.project.hero.width, 1672);
  assert.equal(result.project.floors[0].hotspots.length, 3);
  assert.equal(result.project.interiors[0].roomId, "living");
  assert.equal(result.project.concept, demoProject.concept);
  assert.ok(result.project.video.url);
  assert.ok(result.project.model.url);
  const draft = structuredClone(dataset[1]);
  draft._id = "drafts.project";
  draft.title = "Unpublished";
  const resultWithDraft = await (
    await evaluate(parse(showcaseQuery), { dataset: [...dataset, draft] })
  ).get();
  assert.equal(resultWithDraft.project.title, demoProject.title);
  delete dataset[1].model;
  delete dataset[1].video;
  dataset[1].interiors = [];
  const empty = await (await evaluate(parse(showcaseQuery), { dataset })).get();
  assert.equal(empty.project.model, null);
  assert.equal(empty.project.video, null);
  assert.deepEqual(empty.project.interiors, []);
});
test("empty and single-image galleries expose usable controls", () => {
  assert.match(renderToStaticMarkup(<Gallery items={[]} />), /being prepared/);
  const single = renderToStaticMarkup(<Gallery items={[demoProject.hero]} />);
  assert.match(single, /Open image 1/);
  assert.doesNotMatch(single, /Next gallery image|Previous gallery image/);
});
test("zero, one, and many floors retain a text workflow and render-less rooms", () => {
  assert.match(
    renderToStaticMarkup(<Plans floors={[]} rooms={[]} />),
    /being prepared/,
  );
  const one = renderToStaticMarkup(
    <Plans floors={[demoProject.floors[0]]} rooms={[]} />,
  );
  assert.match(one, /Select a room/);
  const many = Array.from({ length: 12 }, (_, i) => ({
    ...demoProject.floors[0],
    floorId: "level-" + i,
    title: "Level " + i,
    hotspots: [],
  }));
  const markup = renderToStaticMarkup(
    <Plans
      floors={many}
      rooms={[
        { floorId: "level-0", roomId: "test", title: "Garden", images: [] },
      ]}
    />,
  );
  assert.match(markup, /Level 11/);
  assert.match(markup, /room-plan-preview/);
});
test("trusted assets and CTA protocols", () => {
  assert.equal(mediaUrl("http://unknown.invalid/x"), undefined);
  assert.equal(mediaUrl("//unknown.invalid/file.glb"), undefined);
  assert.equal(mediaUrl("/demo/ground.svg"), "/demo/ground.svg");
  assert.equal(contactUrl("javascript:void(0)"), undefined);
});
