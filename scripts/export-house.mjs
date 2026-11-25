// Build the demo house in metres, Y-up, with the garden on the +Z side.
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import {
  BoxGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  Matrix4,
  Quaternion,
  Vector3,
  Euler,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

let seed = 8097;
function random() {
  seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
  return seed / 4294967296;
}
const gltf = {
  asset: { version: "2.0", generator: "Fieldwork courtyard study" },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [],
  meshes: [],
  materials: [],
  textures: [],
  images: [],
  samplers: [{ wrapS: 10497, wrapT: 10497 }],
  accessors: [],
  bufferViews: [],
  buffers: [],
};
const parts = [];
let length = 0;
function buffer(data) {
  const bytes = Buffer.from(data.buffer, data.byteOffset, data.byteLength),
    n =
      gltf.bufferViews.push({
        buffer: 0,
        byteOffset: length,
        byteLength: bytes.length,
      }) - 1;
  const padding = (4 - (bytes.length % 4)) % 4;
  parts.push(bytes, Buffer.alloc(padding));
  length += bytes.length + padding;
  return n;
}
function pngChunk(type, data) {
  const name = Buffer.from(type);
  let crc = 0xffffffff;
  for (const b of Buffer.concat([name, data])) {
    crc ^= b;
    for (let i = 0; i < 8; i++)
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  const out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length);
  name.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE((crc ^ 0xffffffff) >>> 0, out.length - 4);
  return out;
}
function texture(kind, color) {
  const size = 256,
    raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const a = (2 * Math.PI * x) / size,
        b = (2 * Math.PI * y) / size,
        grain = random() - 0.5;
      let v = grain * 10;
      if (kind === "stone")
        v +=
          9 * Math.sin(b * 8 + 1.4 * Math.sin(a * 2) + 0.5 * Math.cos(a * 5)) +
          4 * Math.sin(b * 42 + 2 * Math.sin(a * 3)) -
          (random() > 0.985 ? 30 : 0);
      if (kind === "oak")
        v +=
          14 * Math.sin(b * 18 + 1.8 * Math.sin(a)) +
          7 * Math.cos(b * 69 + 3 * Math.sin(a * 2));
      if (kind === "weave") v += 5 * Math.cos(a * 64) + 6 * Math.cos(b * 64);
      for (let c = 0; c < 3; c++)
        raw[y * (size * 3 + 1) + 1 + x * 3 + c] = Math.max(
          0,
          Math.min(255, color[c] + v),
        );
    }
  const ih = Buffer.alloc(13);
  ih.writeUInt32BE(size);
  ih.writeUInt32BE(size, 4);
  ih[8] = 8;
  ih[9] = 2;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ih),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
  const source =
    gltf.images.push({
      name: kind,
      mimeType: "image/png",
      bufferView: buffer(png),
    }) - 1;
  return gltf.textures.push({ source, sampler: 0 }) - 1;
}
function mat(name, c, tex, rough = 0.85, alpha = 1) {
  const rgb = c.map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return (
    gltf.materials.push({
      name,
      pbrMetallicRoughness: {
        baseColorFactor: [...(tex !== undefined ? [1, 1, 1] : rgb), alpha],
        roughnessFactor: rough,
        metallicFactor: 0,
        ...(tex !== undefined ? { baseColorTexture: { index: tex } } : {}),
      },
      ...(alpha < 1 ? { alphaMode: "BLEND", doubleSided: true } : {}),
    }) - 1
  );
}
const stone = mat("Vein-cut travertine", [], texture("stone", [196, 173, 139])),
  oak = mat("Quarter-sawn oak", [], texture("oak", [139, 94, 57])),
  linen = mat("Woven linen", [], texture("weave", [215, 201, 177]));
const plaster = mat("Lime plaster", [222, 213, 188]),
  slate = mat("Bronze joinery", [63, 49, 37]),
  glass = mat("Clear glazing", [123, 171, 174], undefined, 0.15, 0.14),
  tile = mat("Honed stone floor", [188, 173, 150]),
  earth = mat("Garden soil", [110, 96, 66]),
  gravel = mat("Courtyard gravel", [], texture("gravel", [161, 151, 126])),
  bark = mat("Olive bark", [92, 78, 53]),
  leaf = [
    mat("Olive leaf", [103, 118, 76]),
    mat("Sage leaf", [138, 148, 101]),
    mat("Olive shade", [77, 98, 59]),
  ],
  copper = mat("Terracotta", [152, 94, 63]),
  fabric = mat("Olive wool", [108, 116, 86]),
  cream = mat("Ceramic", [231, 218, 184]),
  dark = mat("Obsidian", [50, 50, 45]);
const buckets = new Map();
function group(name, parent) {
  const n = gltf.nodes.push({ name, children: [] }) - 1;
  if (parent !== undefined) gltf.nodes[parent].children.push(n);
  return n;
}
const root = group("Courtyard_House"),
  site = group("Garden", root),
  ground = group("floor_ground", root),
  upper = group("floor_upper", root),
  roof = group("roof", root);
const living = group("room_living", ground),
  kitchen = group("room_kitchen", ground),
  court = group("room_courtyard", ground),
  bed = group("room_bedroom", upper),
  study = group("room_study", upper),
  terr = group("room_terrace", upper);
function shape(p, m, g, x, y, z, rx = 0, ry = 0, rz = 0) {
  if (g.index) g = g.toNonIndexed();
  g.applyMatrix4(
    new Matrix4().compose(
      new Vector3(x, y, z),
      new Quaternion().setFromEuler(new Euler(rx, ry, rz)),
      new Vector3(1, 1, 1),
    ),
  );
  const k = p + "/" + m;
  if (!buckets.has(k)) buckets.set(k, []);
  buckets.get(k).push(g);
}
function box(p, m, x, y, z, w, h, d, r = 0, ry = 0) {
  const g = r
    ? new RoundedBoxGeometry(w, h, d, 1, r)
    : new BoxGeometry(w, h, d);
  // Use world-scale repeats on planar walls and joinery.
  if (!r) {
    const uv = g.attributes.uv,
      n = g.attributes.normal;
    for (let i = 0; i < uv.count; i++) {
      const u = Math.abs(n.getX(i)) > 0.5 ? d : w,
        v = Math.abs(n.getY(i)) > 0.5 ? d : h;
      uv.setXY(i, (uv.getX(i) * u) / 1.8, (uv.getY(i) * v) / 1.8);
    }
  }
  shape(p, m, g, x, y, z, 0, ry);
}
function cyl(p, m, x, y, z, rt, rb, h, seg = 14) {
  shape(p, m, new CylinderGeometry(rt, rb, h, seg), x, y, z);
}
function orb(p, m, x, y, z, w, h, d) {
  const g = new IcosahedronGeometry(1, 1);
  g.scale(w, h, d);
  shape(p, m, g, x, y, z);
}
function twig(p, m, a, b, r) {
  const v = new Vector3(...b).sub(new Vector3(...a)),
    g = new CylinderGeometry(r * 0.65, r, v.length(), 8);
  g.applyQuaternion(
    new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), v.normalize()),
  );
  shape(p, m, g, ...a.map((x, i) => (x + b[i]) / 2));
}
function olive(p, x, z, base, scale) {
  const at = (a, b, c) => [x + a * scale, base + b * scale, z + c * scale];
  twig(p, bark, at(0, 0, 0), at(0.12, 1.9, 0.06), 0.15 * scale);
  for (let j = 0; j < 9; j++) {
    const a = j * 2.4,
      r = 0.8 + 0.55 * random(),
      cx = r * Math.cos(a),
      cz = r * Math.sin(a),
      cy = 2.45 + random() * 0.85;
    twig(p, bark, at(0.12, 1.3, 0.06), at(cx, cy, cz), 0.073 * scale);
    for (let k = 0; k < 35; k++) {
      const th = random() * 6.28,
        rr = Math.sqrt(random()) * 0.86;
      const [lx, ly, lz] = at(
        cx + rr * Math.cos(th),
        cy + (random() - 0.5) * 0.75,
        cz + rr * Math.sin(th),
      );
      const g = new IcosahedronGeometry(1, 0);
      g.scale(0.19 * scale, 0.1 * scale, 0.16 * scale);
      shape(p, leaf[k % 3], g, lx, ly, lz, random(), random() * 3);
    }
  }
}
function pane(p, x, y, z, length, height, side = false) {
  const w = side ? 0.035 : length,
    d = side ? length : 0.035;
  box(p, glass, x, y + height / 2, z, w, height, d);
  for (let i = 0, n = Math.ceil(length / 1.55); i <= n; i++) {
    const s = length * (i / n - 0.5);
    box(
      p,
      slate,
      x + (side ? 0 : s),
      y + height / 2,
      z + (side ? s : 0),
      0.066,
      height,
      0.066,
    );
  }
  for (const h of [0.04, height - 0.04])
    box(
      p,
      slate,
      x,
      y + h,
      z,
      side ? 0.075 : length,
      0.082,
      side ? length : 0.075,
    );
}
function slab(p, x, z, w, d, y) {
  box(p, stone, x, y - 0.13, z, w, 0.26, d);
  box(p, tile, x, y + 0.012, z, w - 0.05, 0.024, d - 0.05);
}
function wall(p, x, z, w, d, y, h) {
  box(p, stone, x, y + h / 2, z, w, h, d);
}
function stool(p, x, z, base) {
  cyl(p, oak, x, base + 0.45, z, 0.34, 0.34, 0.12);
  for (const dx of [-0.19, 0.19])
    for (const dz of [-0.18, 0.18])
      box(p, slate, x + dx, base + 0.21, z + dz, 0.05, 0.42, 0.05);
}
function books(p, x, y, z, n) {
  for (let i = 0; i < n; i++) {
    const h = 0.19 + random() * 0.14;
    box(
      p,
      [fabric, cream, slate, copper][i % 4],
      x + i * 0.081,
      y + h / 2,
      z,
      0.065,
      h,
      0.18,
    );
  }
}
function pot(p, x, y, z, s = 1) {
  cyl(p, copper, x, y + 0.18 * s, z, 0.22 * s, 0.14 * s, 0.36 * s);
  for (let i = 0; i < 8; i++)
    orb(
      p,
      leaf[i % 3],
      x + Math.sin(i) * 0.1 * s,
      y + (0.46 + random() * 0.1) * s,
      z + Math.cos(i) * 0.1 * s,
      0.09 * s,
      0.22 * s,
      0.09 * s,
    );
}

box(site, earth, 0, -0.36, 0, 22, 0.48, 15.5, 0.15);
box(site, gravel, 0, -0.112, 0, 21.9, 0.11, 15.4);
for (let i = 0; i < 4; i++)
  box(site, tile, 0, -0.04 + i * 0.035, 7.1 - i * 0.59, 7.1, 0.09, 0.68);
for (const x of [-9.75, 9.75]) {
  box(site, earth, x, -0.014, 0, 1.62, 0.12, 13.4, 0.06);
  for (let i = 0; i < 65; i++) {
    orb(
      site,
      leaf[i % 3],
      x + (random() - 0.5) * 1.26,
      0.15 + random() * 0.12,
      (random() - 0.5) * 12.9,
      0.17 + random() * 0.16,
      0.15 + random() * 0.17,
      0.26,
    );
  }
}
const G = 0.2,
  U = 3.21,
  H = 2.79;
for (const [p, x] of [
  [living, -5.85],
  [kitchen, 5.85],
]) {
  slab(p, x, 0, 5.45, 10.55, G);
  wall(p, x + Math.sign(x) * 2.62, 0, 0.21, 10.4, G, H);
  wall(p, x, -5.12, 5.35, 0.19, G, H);
  pane(p, x, G, 5.12, 5.16, H);
  pane(p, x - Math.sign(x) * 2.59, G, 1.1, 7.89, H, true);
}
slab(ground, 0, -3.99, 6.27, 2.61, G);
wall(ground, 0, -5.12, 6.22, 0.19, G, H);
pane(ground, 0, G, -2.75, 6.18, H);
for (let i = 0; i < 15; i++)
  box(
    ground,
    oak,
    1.85,
    G + 0.1 + i * 0.19,
    -2.98 - i * 0.142,
    1.07,
    0.19,
    0.33,
  );
slab(court, 0, 4.05, 6.25, 2.45, G);
box(court, gravel, 0, 0.09, -0.1, 6.16, 0.15, 5.45);
olive(court, -0.3, 0.1, 0.16, 1.25);
for (const [p, x, z, w, d] of [
  [bed, -5.85, 0, 5.55, 10.65],
  [study, 5.85, -1.56, 5.55, 7.53],
  [upper, 0, -3.99, 6.26, 2.68],
]) {
  slab(p, x, z, w, d, U);
  wall(p, x, z - d / 2 + 0.1, w, 0.21, U, 2.63);
  if (p !== upper) {
    wall(p, x + Math.sign(x) * (w / 2 - 0.13), z, 0.26, d, U, 2.63);
    pane(p, x - Math.sign(x) * (w / 2 - 0.12), U, z, d - 0.28, 2.4, true);
    const front = z + d / 2;
    wall(p, x, front - 0.3, w, 0.62, U + 2.17, 0.53);
    for (const sign of [-1, 1])
      wall(p, x + sign * (w / 2 - 0.27), front - 0.3, 0.54, 0.62, U, 2.25);
    pane(p, x, U, front - 0.57, w - 1.05, 2.19);
  } else pane(p, x, U, z + d / 2 - 0.11, w - 0.12, 2.54);
  box(roof, stone, x, U + 2.78, z, w + 0.18, 0.32, d + 0.2);
  box(roof, gravel, x, U + 2.965, z, w - 0.2, 0.05, d - 0.18);
}
slab(terr, 5.85, 3.67, 5.5, 3.25, U);
slab(terr, 0, 4.07, 6.25, 2.45, U);
for (const [x, z, w] of [
  [3, 5.27, 11.36],
  [0, 2.89, 6.14],
])
  pane(terr, x, U, z, w, 0.97);
pane(terr, 8.54, U, 3.71, 3.14, 0.97, true);
// Sectional, upholstered back cushions, low coffee table and woven rug.
box(living, fabric, -5.67, G + 0.04, 1.78, 3.8, 0.05, 3.2, 0.02);
box(living, oak, -6.65, G + 0.25, 1.45, 1.22, 0.4, 3.32, 0.1);
for (let i = 0; i < 3; i++) {
  box(living, linen, -6.57, G + 0.48, 0.43 + i, 1.05, 0.27, 0.95, 0.11);
  box(living, linen, -7.08, G + 0.8, 0.43 + i, 0.25, 0.63, 0.98, 0.1);
}
box(living, linen, -5.95, G + 0.4, 2.58, 1.6, 0.54, 0.95, 0.13);
box(living, oak, -5.1, G + 0.39, 1.06, 1.18, 0.13, 0.82, 0.05);
cyl(living, slate, -5.1, G + 0.19, 1.06, 0.24, 0.31, 0.37);
books(living, -5.29, G + 0.46, 1.15, 4);
pot(living, -4, G, -2.34, 1.65);
box(living, oak, -8.21, G + 0.43, -1.76, 0.47, 0.8, 3.05);
box(living, plaster, -8.22, G + 1.42, -1.74, 0.19, 1.03, 1.67);
for (let i = 0; i < 5; i++) {
  box(kitchen, oak, 8.18, G + 0.46, -3.4 + i * 0.9, 0.63, 0.9, 0.88);
  box(kitchen, slate, 7.854, G + 0.74, -3.39 + i * 0.9, 0.027, 0.035, 0.31);
}
box(kitchen, stone, 8.15, G + 0.95, -1.6, 0.78, 0.11, 4.57);
box(kitchen, oak, 5.85, G + 0.45, -1.42, 1.26, 0.9, 2.85);
box(kitchen, stone, 5.85, G + 0.95, -1.42, 1.43, 0.15, 3.03);
box(kitchen, dark, 5.85, G + 1.035, -1.88, 0.58, 0.025, 0.43);
cyl(kitchen, oak, 5.83, G + 0.82, 2.58, 1.06, 1.06, 0.09, 40);
cyl(kitchen, oak, 5.83, G + 0.4, 2.58, 0.26, 0.34, 0.8);
for (let i = 0; i < 4; i++) {
  const a = (i * Math.PI) / 2,
    x = 5.83 + Math.sin(a) * 1.25,
    z = 2.58 + Math.cos(a) * 1.25;
  stool(kitchen, x, z, G);
  box(
    kitchen,
    oak,
    x + Math.sin(a) * 0.27,
    G + 0.68,
    z + Math.cos(a) * 0.27,
    0.52,
    0.46,
    0.065,
    0.02,
    a,
  );
}
cyl(kitchen, cream, 5.83, G + 0.94, 2.58, 0.11, 0.17, 0.18);
// Upper rooms use the same slab datum for every furniture contact.
box(bed, oak, -6.14, U + 0.23, 0.23, 2.45, 0.4, 2.81, 0.09);
box(bed, linen, -6.14, U + 0.53, 0.23, 2.32, 0.31, 2.65, 0.12);
box(bed, oak, -6.14, U + 0.69, -1.12, 2.55, 1.26, 0.11, 0.04);
box(bed, linen, -6.14, U + 0.75, 0.71, 2.34, 0.18, 1.76, 0.09);
box(bed, fabric, -6.14, U + 0.865, 1.18, 2.34, 0.07, 0.51, 0.035);
for (const x of [-6.75, -5.53])
  box(bed, linen, x, U + 0.81, -0.67, 0.99, 0.22, 0.56, 0.1);
for (const x of [-7.93, -4.37]) {
  box(bed, oak, x, U + 0.27, -0.74, 0.53, 0.51, 0.52, 0.025);
  cyl(bed, slate, x, U + 0.68, -0.74, 0.045, 0.12, 0.27);
  cyl(bed, cream, x, U + 0.91, -0.74, 0.19, 0.24, 0.24);
}
box(study, oak, 5.82, U + 0.79, -0.53, 3.25, 0.11, 0.87, 0.03);
for (const x of [4.4, 7.25])
  box(study, oak, x, U + 0.39, -0.53, 0.11, 0.78, 0.78);
stool(study, 5.89, 0.27, U);
box(study, oak, 5.89, U + 0.77, 0.53, 0.54, 0.51, 0.08, 0.035);
for (let i = 0; i < 5; i++) {
  box(study, oak, 8.12, U + 0.14 + i * 0.48, -1.65, 0.47, 0.07, 4.1);
  if (i < 4)
    for (let j = 0; j < 9; j++)
      box(
        study,
        [linen, slate, fabric, copper][j % 4],
        8.09,
        U + 0.31 + i * 0.48,
        -3.25 + j * 0.12,
        0.25,
        0.27,
        0.081,
      );
}
pot(study, 6.89, U + 0.85, -0.6, 0.67);
pot(terr, 6.9, U, 3.67, 1.4);
box(terr, oak, 0.08, U + 0.36, 4.36, 2.0, 0.13, 0.57);
for (const x of [-0.78, 0.87])
  box(terr, slate, x, U + 0.17, 4.36, 0.06, 0.32, 0.45);

function accessor(values, size, bounds = false) {
  const arr = new Float32Array(values);
  const entry = {
    bufferView: buffer(new Uint8Array(arr.buffer)),
    componentType: 5126,
    count: arr.length / size,
    type: "VEC" + size,
  };
  if (bounds) {
    entry.min = Array(size).fill(Infinity);
    entry.max = Array(size).fill(-Infinity);
    for (let i = 0; i < arr.length; i++) {
      entry.min[i % size] = Math.min(entry.min[i % size], arr[i]);
      entry.max[i % size] = Math.max(entry.max[i % size], arr[i]);
    }
  }
  return gltf.accessors.push(entry) - 1;
}
for (const [key, geos] of buckets) {
  const [parent, material] = key.split("/").map(Number),
    g = mergeGeometries(geos);
  const attrs = g.attributes;
  const prim = {
    attributes: {
      POSITION: accessor(attrs.position.array, 3, true),
      NORMAL: accessor(attrs.normal.array, 3),
      TEXCOORD_0: accessor(attrs.uv.array, 2),
    },
    material,
  };
  const n = gltf.nodes[parent];
  if (n.mesh === undefined)
    n.mesh = gltf.meshes.push({ name: n.name, primitives: [] }) - 1;
  gltf.meshes[n.mesh].primitives.push(prim);
}
for (const n of gltf.nodes) if (!n.children.length) delete n.children;
gltf.buffers.push({ byteLength: length });
const json = Buffer.from(JSON.stringify(gltf)),
  jsonSize = (json.length + 3) & ~3,
  bin = Buffer.concat(parts),
  out = Buffer.alloc(28 + jsonSize + bin.length);
out.write("glTF");
out.writeUInt32LE(2, 4);
out.writeUInt32LE(out.length, 8);
out.writeUInt32LE(jsonSize, 12);
out.write("JSON", 16);
out.fill(32, 20, 20 + jsonSize);
json.copy(out, 20);
out.writeUInt32LE(bin.length, 20 + jsonSize);
out.write("BIN\0", 24 + jsonSize);
bin.copy(out, 28 + jsonSize);
writeFileSync(new URL("../public/demo/furnished.glb", import.meta.url), out);
console.log(
  "Furnished GLB:",
  out.length,
  "bytes,",
  gltf.meshes.length,
  "grouped meshes,",
  gltf.images.length,
  "embedded textures",
);
