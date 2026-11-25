# Demo imagery

Courtyard House is a fictional architectural study. The seven views in `public/demo` were generated with the built-in ImageGen tool for this prototype. They share a design brief and illustrate a concept. Replace them with the architect’s approved renders for client presentation. No images or code were taken from the visual reference site.

## Image inventory

| WebP            | Dimensions  | Subject                               |
| --------------- | ----------- | ------------------------------------- |
| hero.webp       | 1672 × 941  | Dusk exterior and glowing living wing |
| exterior-1.webp | 1536 × 1024 | Central olive courtyard               |
| exterior-2.webp | 1536 × 1024 | Travertine entry passage              |
| living.webp     | 1536 × 1024 | Living room facing the courtyard      |
| kitchen.webp    | 1536 × 1024 | Kitchen island and dining room        |
| bedroom.webp    | 1536 × 1024 | Upper bedroom facing treetops         |
| study.webp      | 1536 × 1024 | Oak study facing the olive canopy     |

The portrait hero uses a locally cropped, 535 ? 941 AVIF derivative of the dusk render.

## Film

The rebuilt **15.5-second silent film** moves from the dusk facade through the entry passage, central court, living room, study, and bedroom. Each shot uses a fixed camera center and a 4.5% push-in sampled with subpixel affine transforms. The five dissolves last 12 frames each. The downloadable player uses a 1280 ? 720 H.264 MP4 at 24 fps.

Run `npm run film:export` from the repository root with Python 3, NumPy, opencv-python, and FFmpeg on PATH. The exporter renders both orientations directly from the six source images. It writes the MP4, 372 landscape WebPs, 372 individually framed portrait WebPs at 540 ? 950, and `public/demo/sequence/manifest.json`. Regular site builds use the checked-in assets. Add captions and a transcript when replacing the silent film with speech.

The manifest supplies `fps`, `count`, and the width, height, and filename pattern for each orientation. Frame numbers start at zero and use at least three digits. The pattern is relative to the manifest, for example `portrait/{frame}.webp`. For remotely hosted assets, allowlist the HTTPS host and enable CORS for the manifest and frames. Set the manifest URL in the Project singleton and update the walkthrough MP4 and poster there as well.

## ImageGen prompts

Each output used the following shared prompt followed by its shot description.

> Photorealistic-natural. Architectural editorial photograph from one fictional project, Courtyard House: two rectilinear storeys, pale vein-cut travertine masonry slabs, deeply recessed full-height oak-framed glazing, slim flat roofs, central gravel courtyard with a single mature olive tree, warm oak ceilings, tucked into a Mediterranean wooded hillside. Understated, spare, low-key organic palette, tactile stone, rich complex light. Tilt-shift professional architecture photography, precisely vertical lines, beautiful architectural magazine composition. Natural color, no humans, logos, typography, captions, borders or watermark. Landscape format.

**hero.webp**

Cinematic 16:9 hero photograph. Stand in garden looking at the entire facade obliquely across a low stone terrace. Warm golden interior lamps contrast the cool blue dusk, bronze-lit upper volume cantilevers over a floor-to-ceiling glass living wing. The beautiful house fills center and right from within surrounding mature trees, left edge and bottom composed of darker foliage and forecourt for a text overlay. See both floors, roofline and gardens clearly; sky in upper quarter, soft warm cloud streak on horizon.

**exterior-1.webp**

Intimate 3:2 eye-level view across the gravel courtyard, mature olive tree centered, two low wings enclose the courtyard, glimpse the upper volume. Late afternoon sun makes delicate leaf shadows on travertine and a wood slatted screen.

**exterior-2.webp**

3:2 detail photograph at the entry portico looking along a narrow travertine passage to the courtyard, thick stone jamb at left, glowing oak soffit, honest masonry joints, a sliver of olive foliage beyond. Evening sidelight exposes texture.

**living.webp**

3:2 wide interior of the ground-floor living room opening on the courtyard. Low oatmeal linen sectional and a dark oak table sit on natural travertine, long oak wall and ceiling, full height oak-framed glass looking at the olive tree in pale courtyard. Editorial architectural photo at golden hour.

**kitchen.webp**

3:2 interior of the ground-floor kitchen and dining room. Broad vein-cut travertine island, flush oak joinery wall, simple round oak table, built-in oak benches overlooking the courtyard. Soft daylight. Stillness of a real lived-in interior.

**bedroom.webp**

3:2 interior of the upper primary bedroom. An oak platform bed with soft rumpled ivory linen, single reading light, recessed floor-to-ceiling oak-framed window overlooking treetops, gentle morning light, quiet and private.

**study.webp**

3:2 interior of upstairs study. Long oak desk built into a broad window overlooking the central olive canopy, single timber chair, wall of shelves with sparse books, high sidelight lays a precise shadow across the desk.
