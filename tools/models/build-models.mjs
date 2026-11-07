// Generates schematic 3D models of monuments as glTF, with the manifest the app
// reads. Schematic means built from simple shapes from photographs and published
// descriptions. Proportions are approximate and nothing is measured, and the app
// says so beside every model.
//
//   node tools/models/build-models.mjs
//
// Output: landing/public/models/<id>.gltf (served by the website, downloaded on
// demand by the app) and data/generated/models.ts.
import { mkdirSync, writeFileSync } from 'node:fs';

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// GLTFExporter embeds buffers through FileReader, which Node doesn't have.
globalThis.FileReader = class {
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(buffer).toString('base64')}`;
      this.onloadend?.();
      this.onload?.({ target: this });
    });
  }
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
      this.onload?.({ target: this });
    });
  }
};

const ROOT = new URL('../../', import.meta.url);
const OUT = new URL('landing/public/models/', ROOT);

const COLOUR = {
  whitewash: '#F2EFE6',
  gold: '#D9A62E',
  brick: '#9C4A33',
  stone: '#A7A196',
  darkStone: '#6E6A62',
  wood: '#4A2E1F',
  copper: '#7A4A2A',
  blue: '#2F5FA8',
  ground: '#C9C1AC',
};

const materials = new Map();
function material(hex) {
  if (!materials.has(hex)) {
    materials.set(hex, new THREE.MeshStandardMaterial({ color: hex, roughness: 0.85, metalness: hex === COLOUR.gold ? 0.6 : 0 }));
  }
  return materials.get(hex);
}

function mesh(geometry, colour, x = 0, y = 0, z = 0, name) {
  const m = new THREE.Mesh(geometry, material(colour));
  m.position.set(x, y, z);
  if (name) m.name = name;
  return m;
}

/** Square stepped plinth. Returns the height of its top. */
function plinth(group, { levels, width, stepHeight, shrink, colour, y = 0 }) {
  let top = y;
  for (let i = 0; i < levels; i += 1) {
    const w = width - i * shrink;
    group.add(mesh(new THREE.BoxGeometry(w, stepHeight, w), colour, 0, top + stepHeight / 2));
    top += stepHeight;
  }
  return top;
}

/** A sloping four-sided roof, eaves projecting past the walls below. */
function roof(group, { width, height, y, colour }) {
  const g = new THREE.CylinderGeometry(width * 0.08, width * 0.72, height, 4, 1);
  g.rotateY(Math.PI / 4);
  group.add(mesh(g, colour, 0, y + height / 2));
}

function pagoda(group, { roofs, base, bodyHeight, roofHeight, roofColour, bodyColour, y }) {
  let top = y;
  for (let i = 0; i < roofs; i += 1) {
    const w = base * (1 - i * 0.18);
    group.add(mesh(new THREE.BoxGeometry(w * 0.7, bodyHeight, w * 0.7), bodyColour, 0, top + bodyHeight / 2));
    top += bodyHeight;
    roof(group, { width: w, height: roofHeight, y: top, colour: roofColour });
    top += roofHeight * 0.75;
  }
  // The gilded finial.
  group.add(mesh(new THREE.ConeGeometry(base * 0.06, base * 0.25, 12), COLOUR.gold, 0, top + base * 0.12));
  return top + base * 0.25;
}

function stupa(group, { platformRadius, domeRadius, harmika, spireTiers, spireHeight, y, square = false, eyes = true }) {
  const platform = square
    ? new THREE.BoxGeometry(platformRadius * 2, 1.5, platformRadius * 2)
    : new THREE.CylinderGeometry(platformRadius, platformRadius * 1.04, 1.5, 48);
  group.add(mesh(platform, COLOUR.whitewash, 0, y + 0.75));
  const domeBase = y + 1.5;
  const dome = new THREE.SphereGeometry(domeRadius, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  group.add(mesh(dome, COLOUR.whitewash, 0, domeBase, 0, 'dome'));
  const harmikaY = domeBase + domeRadius;
  group.add(mesh(new THREE.BoxGeometry(harmika, harmika * 0.8, harmika), COLOUR.gold, 0, harmikaY + harmika * 0.4, 0, 'harmika'));
  if (eyes) {
    // The painted eyes, on all four faces of the harmika.
    for (let side = 0; side < 4; side += 1) {
      const angle = (side * Math.PI) / 2;
      const face = new THREE.Group();
      for (const offset of [-harmika * 0.18, harmika * 0.18]) {
        face.add(mesh(new THREE.BoxGeometry(harmika * 0.16, harmika * 0.08, 0.05), COLOUR.blue, offset, 0, 0));
      }
      face.position.set(Math.sin(angle) * (harmika / 2 + 0.03), harmikaY + harmika * 0.45, Math.cos(angle) * (harmika / 2 + 0.03));
      face.rotation.y = angle;
      group.add(face);
    }
  }
  let top = harmikaY + harmika * 0.8;
  const tierHeight = spireHeight / spireTiers;
  for (let i = 0; i < spireTiers; i += 1) {
    const r = harmika * 0.55 * (1 - i / (spireTiers + 2));
    group.add(mesh(new THREE.CylinderGeometry(r * 0.92, r, tierHeight * 0.9, 24), COLOUR.gold, 0, top + tierHeight / 2));
    top += tierHeight;
  }
  group.add(mesh(new THREE.ConeGeometry(harmika * 0.35, harmika * 0.6, 24), COLOUR.gold, 0, top + harmika * 0.3));
  return top;
}

/** A stone shikhara: a curved tower crowned by smaller pinnacles. */
function shikhara(group, { base, height, pinnacles, colour, y }) {
  const courses = 12;
  for (let i = 0; i < courses; i += 1) {
    const t = i / courses;
    const w = base * (1 - Math.pow(t, 1.6) * 0.75);
    group.add(mesh(new THREE.BoxGeometry(w, height / courses, w), colour, 0, y + (i + 0.5) * (height / courses)));
  }
  group.add(mesh(new THREE.ConeGeometry(base * 0.12, base * 0.3, 12), COLOUR.gold, 0, y + height + base * 0.15));
  // The surrounding pinnacles, in rings around the main tower.
  for (let i = 0; i < pinnacles - 1; i += 1) {
    const ring = i < 8 ? 0 : 1;
    const count = ring === 0 ? 8 : pinnacles - 9;
    const index = ring === 0 ? i : i - 8;
    const angle = (index / count) * Math.PI * 2 + (ring ? Math.PI / count : 0);
    const radius = base * (ring === 0 ? 0.62 : 0.45);
    const h = height * (ring === 0 ? 0.32 : 0.5);
    const p = mesh(new THREE.ConeGeometry(base * 0.09, h, 8), colour, Math.cos(angle) * radius, y + h / 2, Math.sin(angle) * radius);
    group.add(p);
  }
  return y + height;
}

/** Each model: how to build it, which app records it belongs to, and what to point out. */
const MODELS = [
  {
    id: 'swayambhunath',
    title: 'Swayambhunath',
    targets: ['wd-Q12946982'],
    free: true,
    sources: [{ title: 'Swayambhunath, Wikipedia', url: 'https://en.wikipedia.org/wiki/Swayambhunath' }],
    build(g) {
      const top = stupa(g, { platformRadius: 22, domeRadius: 15, harmika: 6, spireTiers: 13, spireHeight: 12, y: 0 });
      return [
        { label: 'The dome', note: 'A white hemisphere, the body of the stupa.', position: [0, 13, 12] },
        { label: 'The painted eyes', note: 'Eyes on each face of the harmika look out in all four directions.', position: [0, 18.5, 3.2] },
        { label: 'Thirteen tiers', note: 'The gilded spire rises in thirteen rings.', position: [0, top - 5, 2.4] },
      ];
    },
  },
  {
    id: 'boudhanath',
    title: 'Boudhanath',
    targets: ['wd-Q889902'],
    sources: [{ title: 'Boudhanath, Wikipedia', url: 'https://en.wikipedia.org/wiki/Boudhanath' }],
    build(g) {
      const top = plinth(g, { levels: 3, width: 90, stepHeight: 2.5, shrink: 14, colour: COLOUR.whitewash });
      const spire = stupa(g, { platformRadius: 32, domeRadius: 24, harmika: 8, spireTiers: 13, spireHeight: 14, y: top, square: false });
      return [
        { label: 'Terraced platform', note: 'Three stepped terraces form a mandala you can walk around.', position: [38, 6, 38] },
        { label: 'The dome', note: 'One of the largest stupa domes in Nepal.', position: [0, top + 18, 20] },
        { label: 'The painted eyes', note: 'Eyes on each face of the harmika.', position: [0, top + 27, 4.3] },
        { label: 'Thirteen tiers', note: 'The stepped golden spire.', position: [0, spire - 6, 3] },
      ];
    },
  },
  {
    id: 'peace-pagoda-lumbini',
    title: 'World Peace Pagoda, Lumbini',
    targets: ['world-peace-pagoda', 'wd-Q100989576'],
    sources: [{ title: 'World Peace Pagoda, Lumbini, Wikipedia', url: 'https://en.wikipedia.org/wiki/World_Peace_Pagoda,_Lumbini' }],
    build(g) {
      const top = plinth(g, { levels: 2, width: 40, stepHeight: 2, shrink: 8, colour: COLOUR.whitewash });
      g.add(mesh(new THREE.CylinderGeometry(13, 13, 6, 48), COLOUR.whitewash, 0, top + 3));
      g.add(mesh(new THREE.BoxGeometry(3, 4, 1), COLOUR.gold, 0, top + 3, 13.2, 'buddha'));
      stupa(g, { platformRadius: 13, domeRadius: 11, harmika: 3.5, spireTiers: 6, spireHeight: 6, y: top + 6, eyes: false });
      return [{ label: 'Golden Buddha', note: 'A gilded Buddha in a niche in the drum.', position: [0, top + 3, 14] }];
    },
  },
  {
    id: 'peace-pagoda-pokhara',
    title: 'World Peace Pagoda, Pokhara',
    targets: ['osm-way-596603713'],
    sources: [{ title: 'Shanti Stupa, Pokhara, Wikipedia', url: 'https://en.wikipedia.org/wiki/Shanti_Stupa,_Pokhara' }],
    build(g) {
      const top = plinth(g, { levels: 2, width: 36, stepHeight: 2, shrink: 8, colour: COLOUR.whitewash });
      g.add(mesh(new THREE.CylinderGeometry(12, 12, 6, 48), COLOUR.whitewash, 0, top + 3));
      for (let side = 0; side < 4; side += 1) {
        const a = (side * Math.PI) / 2;
        g.add(mesh(new THREE.BoxGeometry(2.6, 3.6, 1), COLOUR.gold, Math.sin(a) * 12.2, top + 3, Math.cos(a) * 12.2));
      }
      stupa(g, { platformRadius: 12, domeRadius: 10, harmika: 3.2, spireTiers: 6, spireHeight: 5, y: top + 6, eyes: false });
      return [{ label: 'Four Buddhas', note: 'Golden Buddhas face the four directions.', position: [0, top + 3, 13] }];
    },
  },
  {
    id: 'nyatapola',
    title: 'Nyatapola Temple',
    targets: ['wd-Q1513892'],
    sources: [{ title: 'Nyatapola, Wikipedia', url: 'https://en.wikipedia.org/wiki/Nyatapola' }],
    build(g) {
      const top = plinth(g, { levels: 5, width: 22, stepHeight: 1.7, shrink: 2.6, colour: COLOUR.brick });
      pagoda(g, { roofs: 5, base: 10, bodyHeight: 2.2, roofHeight: 1.8, roofColour: COLOUR.wood, bodyColour: COLOUR.brick, y: top });
      return [
        { label: 'Five plinths', note: 'Five stepped plinths, with pairs of guardian figures on each stair.', position: [9, 5, 9] },
        { label: 'Five roofs', note: 'Among the tallest pagodas in Nepal.', position: [0, top + 12, 5] },
      ];
    },
  },
  {
    id: 'pashupatinath',
    title: 'Pashupatinath Temple',
    targets: ['wd-Q380384'],
    sources: [{ title: 'Pashupatinath Temple, Wikipedia', url: 'https://en.wikipedia.org/wiki/Pashupatinath_Temple' }],
    build(g) {
      const top = plinth(g, { levels: 1, width: 26, stepHeight: 1.5, shrink: 0, colour: COLOUR.stone });
      pagoda(g, { roofs: 2, base: 18, bodyHeight: 4.5, roofHeight: 3.2, roofColour: COLOUR.gold, bodyColour: COLOUR.wood, y: top });
      return [{ label: 'Two gilded roofs', note: 'A two-tiered pagoda with gold-covered roofs.', position: [0, top + 9, 9] }];
    },
  },
  {
    id: 'changu-narayan',
    title: 'Changu Narayan Temple',
    targets: ['changu-narayan'],
    sources: [{ title: 'Changu Narayan, Wikipedia', url: 'https://en.wikipedia.org/wiki/Changunarayan_Temple' }],
    build(g) {
      const top = plinth(g, { levels: 2, width: 16, stepHeight: 1.2, shrink: 2, colour: COLOUR.stone });
      pagoda(g, { roofs: 2, base: 12, bodyHeight: 3.5, roofHeight: 2.6, roofColour: COLOUR.copper, bodyColour: COLOUR.brick, y: top });
      return [{ label: 'Two-tiered roof', note: 'A pagoda roof in two tiers over carved struts.', position: [0, top + 7, 6] }];
    },
  },
  {
    id: 'patan-krishna-mandir',
    title: 'Krishna Mandir, Patan',
    targets: ['patan-krishna-mandir'],
    sources: [{ title: 'Krishna Mandir, Wikipedia', url: 'https://en.wikipedia.org/wiki/Krishna_Mandir' }],
    build(g) {
      const top = plinth(g, { levels: 3, width: 14, stepHeight: 1, shrink: 1.5, colour: COLOUR.darkStone });
      shikhara(g, { base: 9, height: 16, pinnacles: 21, colour: COLOUR.stone, y: top });
      return [{ label: 'Twenty-one pinnacles', note: 'A stone shikhara crowned by twenty-one pinnacles.', position: [0, top + 12, 3] }];
    },
  },
  {
    id: 'ashokan-pillar',
    title: 'Ashokan Pillar',
    targets: ['ashokan-pillar'],
    sources: [{ title: 'Lumbini pillar inscription, Wikipedia', url: 'https://en.wikipedia.org/wiki/Lumbini_pillar_inscription' }],
    build(g) {
      g.add(mesh(new THREE.CylinderGeometry(3, 3, 0.4, 8), COLOUR.ground, 0, 0.2));
      for (let i = 0; i < 16; i += 1) {
        const a = (i / 16) * Math.PI * 2;
        g.add(mesh(new THREE.BoxGeometry(0.08, 1.1, 0.08), COLOUR.darkStone, Math.cos(a) * 2.8, 0.95, Math.sin(a) * 2.8));
      }
      g.add(mesh(new THREE.CylinderGeometry(0.35, 0.42, 6, 32), COLOUR.stone, 0, 3.4, 0, 'pillar'));
      return [{ label: 'The inscription', note: 'An inscription on the shaft records the emperor Ashoka\'s visit.', position: [0, 2.2, 0.45] }];
    },
  },
];

const exporter = new GLTFExporter();
mkdirSync(OUT, { recursive: true });
const manifest = [];

for (const model of MODELS) {
  const group = new THREE.Group();
  const hotspots = model.build(group);
  // Ground just wider than the monument, so the camera frames the monument, not a field.
  const size = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
  const groundRadius = Math.max(size.x, size.z) * 0.75;
  group.add(mesh(new THREE.CylinderGeometry(groundRadius, groundRadius, 0.1, 64), COLOUR.ground, 0, -0.05));
  const scene = new THREE.Scene();
  scene.add(group);
  const gltf = await exporter.parseAsync(scene, { binary: false });
  gltf.asset.extras = {
    kind: 'schematic',
    note: 'Schematic model built from simple shapes. Proportions are approximate and nothing here is measured.',
  };
  const text = JSON.stringify(gltf);
  writeFileSync(new URL(`${model.id}.gltf`, OUT), text);
  manifest.push({
    id: model.id,
    title: model.title,
    targets: model.targets,
    free: Boolean(model.free),
    kind: 'schematic',
    bytes: Buffer.byteLength(text),
    sources: model.sources,
    hotspots: hotspots.map((h) => ({ ...h, position: h.position.map((n) => Number(n.toFixed(2))) })),
  });
  console.log(`${model.id}: ${(Buffer.byteLength(text) / 1024).toFixed(0)} KB, ${hotspots.length} points of interest`);
}

writeFileSync(
  new URL('data/generated/models.ts', ROOT),
  `// GENERATED by tools/models/build-models.mjs. Do not edit.\nimport type { MonumentModel } from '@/types';\n\nexport const MODELS: MonumentModel[] = ${JSON.stringify(manifest, null, 1)};\n`,
);
