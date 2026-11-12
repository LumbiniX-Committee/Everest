// Generates schematic 3D models of monuments as glTF, with the manifest the app
// reads. Schematic means built from simple shapes from photographs and published
// descriptions. Proportions are approximate and nothing is measured, and the app
// says so beside every model.
//
//   node tools/models/build-models.mjs
//
// Output: landing/public/models/<id>.gltf (served by the website, downloaded on
// demand by the app) and data/generated/models.ts.
import { Buffer } from 'node:buffer';
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
  silver: '#C9CCCF',
  limewash: '#EFE6D2',
  timber: '#3E261A',
  river: '#6E8F8A',
  paving: '#B5876A',
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


/**
 * A Newar tiered temple, in more detail than `pagoda`: a door on each face,
 * carved struts (tundal) under every eave, flared hipped roofs whose upper
 * walls rise out of the roof below, and a stacked gilt finial (gajur).
 *
 * `tiers` lists each storey bottom up: wall side and height, and the roof's
 * eave side and rise. With `totalHeight`, the finial is sized so the whole
 * stands at that height, which is how a sourced overall height is honoured
 * when the parts in between are only estimated.
 */
function newarTemple(group, { tiers, y, wallColour, roofColour, doorColour, strutColour = COLOUR.timber, totalHeight }) {
  let base = y;
  let top = y;
  tiers.forEach((tier, index) => {
    const { side, height, eave, rise } = tier;
    group.add(mesh(new THREE.BoxGeometry(side, height, side), wallColour, 0, base + height / 2));
    // A door centred on each face. Only the ground storey's doors are full height.
    const doorH = index === 0 ? height * 0.62 : height * 0.4;
    const doorW = side * (index === 0 ? 0.26 : 0.18);
    for (let face = 0; face < 4; face += 1) {
      const a = (face * Math.PI) / 2;
      const d = mesh(new THREE.BoxGeometry(doorW, doorH, 0.18), doorColour, Math.sin(a) * (side / 2 + 0.05), base + doorH / 2 + (index === 0 ? 0.1 : height * 0.25), Math.cos(a) * (side / 2 + 0.05));
      d.rotation.y = a;
      group.add(d);
    }
    // Struts: angled timbers from the wall head out to the eave, evenly along each face.
    const wallTop = base + height;
    const count = Math.max(3, Math.round(side / 1.7));
    const reach = (eave - side) / 2;
    for (let face = 0; face < 4; face += 1) {
      const a = (face * Math.PI) / 2;
      for (let i = 0; i < count; i += 1) {
        const along = -side / 2 + ((i + 0.5) * side) / count;
        const length = Math.hypot(reach, rise * 0.55);
        const strut = new THREE.Mesh(new THREE.BoxGeometry(0.22, length, 0.3), material(strutColour));
        const out = side / 2 + reach / 2;
        const lx = along, lz = out;
        strut.position.set(Math.cos(a) * lx + Math.sin(a) * lz, wallTop - rise * 0.3, -Math.sin(a) * lx + Math.cos(a) * lz);
        strut.rotation.order = 'YXZ';
        strut.rotation.y = a;
        strut.rotation.x = Math.atan2(reach, rise * 0.55);
        group.add(strut);
      }
    }
    // The hipped roof: a four-sided frustum, its corners on the eave square.
    const roofGeo = new THREE.CylinderGeometry((side * 0.5) / Math.SQRT2 * 1.05, eave / Math.SQRT2, rise, 4, 1);
    roofGeo.rotateY(Math.PI / 4);
    group.add(mesh(roofGeo, roofColour, 0, wallTop + rise / 2));
    // A thin eave board, so the roof edge reads as a projecting lip.
    group.add(mesh(new THREE.BoxGeometry(eave * 1.01, 0.18, eave * 1.01), roofColour, 0, wallTop + 0.09));
    top = wallTop + rise;
    // The next storey rises out of this roof, just above its midpoint.
    base = wallTop + rise * 0.55;
  });
  // Gajur: a gilt stack of drum, bell and spike.
  const finial = Math.max(1.5, totalHeight ? y + totalHeight - top : tiers[tiers.length - 1].side * 0.35);
  group.add(mesh(new THREE.CylinderGeometry(finial * 0.12, finial * 0.16, finial * 0.18, 16), COLOUR.gold, 0, top + finial * 0.09));
  group.add(mesh(new THREE.SphereGeometry(finial * 0.15, 16, 12), COLOUR.gold, 0, top + finial * 0.32));
  group.add(mesh(new THREE.ConeGeometry(finial * 0.1, finial * 0.6, 16), COLOUR.gold, 0, top + finial * 0.7));
  return top + finial;
}

/** A low wall round a square courtyard, with an opening on the given side. */
function courtyardWall(group, { side, height, thickness, colour, gate = 'west', gateWidth = 4 }) {
  const half = side / 2;
  const walls = {
    north: { x: 0, z: -half, w: side, d: thickness },
    south: { x: 0, z: half, w: side, d: thickness },
    east: { x: half, z: 0, w: thickness, d: side },
    west: { x: -half, z: 0, w: thickness, d: side },
  };
  for (const [name, wall] of Object.entries(walls)) {
    if (name !== gate) {
      group.add(mesh(new THREE.BoxGeometry(wall.w, height, wall.d), colour, wall.x, height / 2, wall.z));
      continue;
    }
    // Two lengths either side of the gate.
    const along = wall.w > wall.d ? 'x' : 'z';
    const piece = (side - gateWidth) / 2;
    for (const sign of [-1, 1]) {
      const offset = sign * (gateWidth / 2 + piece / 2);
      const g = along === 'x' ? new THREE.BoxGeometry(piece, height, thickness) : new THREE.BoxGeometry(thickness, height, piece);
      group.add(mesh(g, colour, wall.x + (along === 'x' ? offset : 0), height / 2, wall.z + (along === 'z' ? offset : 0)));
    }
  }
}

/** A recumbent bull, built from simple volumes. Faces +x. */
function bull(group, { x, z, length, colour, plinthColour }) {
  const s = length / 3;
  group.add(mesh(new THREE.BoxGeometry(length * 1.15, 0.9 * s, length * 0.55), plinthColour, x, 0.45 * s, z));
  const top = 0.9 * s;
  group.add(mesh(new THREE.BoxGeometry(length * 0.78, 1.1 * s, length * 0.36), colour, x - 0.1 * s, top + 0.55 * s, z));
  group.add(mesh(new THREE.SphereGeometry(0.42 * s, 16, 12), colour, x + 0.55 * s, top + 1.2 * s, z)); // hump
  group.add(mesh(new THREE.BoxGeometry(0.62 * s, 0.7 * s, 0.5 * s), colour, x + 1.35 * s, top + 1.25 * s, z)); // head
  for (const side of [-1, 1]) {
    const horn = mesh(new THREE.ConeGeometry(0.08 * s, 0.45 * s, 8), colour, x + 1.3 * s, top + 1.75 * s, z + side * 0.2 * s);
    horn.rotation.x = side * 0.5;
    group.add(horn);
  }
}

/** A palace tower of stacked storeys, each with a short eave. */
function storeyTower(group, { x, z, side, storeys, storeyHeight, wallColour, roofColour, y = 0 }) {
  let top = y;
  for (let i = 0; i < storeys; i += 1) {
    const w = side * (1 - i * 0.035);
    group.add(mesh(new THREE.BoxGeometry(w, storeyHeight, w), wallColour, x, top + storeyHeight / 2, z));
    top += storeyHeight;
    group.add(mesh(new THREE.BoxGeometry(w * 1.25, 0.25, w * 1.25), roofColour, x, top - 0.12, z));
  }
  const cap = new THREE.CylinderGeometry(0.2, (side * 0.75) / Math.SQRT2, side * 0.45, 4, 1);
  cap.rotateY(Math.PI / 4);
  group.add(mesh(cap, roofColour, x, top + side * 0.225, z));
  group.add(mesh(new THREE.ConeGeometry(side * 0.06, side * 0.35, 12), COLOUR.gold, x, top + side * 0.45 + side * 0.17, z));
  return top + side * 0.8;
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
    sources: [
      { title: 'Pashupatinath Temple, Wikipedia (height about 23.7 m)', url: 'https://en.wikipedia.org/wiki/Pashupatinath_Temple' },
      { title: 'Pashupati Area Development Trust', url: 'https://pashupati.org.np/' },
    ],
    // Sourced: overall height about 23.7 m, square two-tiered pagoda on one
    // whitewashed brick plinth, gilded copper roofs and gajur, a silver-clad
    // door on each side, carved struts, the gilded Nandi before the west door,
    // Vasuki in the north-east corner, Unmatta Bhairav to the south, and the
    // fifteen Pandra Shivalaya shrines across the Bagmati to the east.
    // Estimated from photographs: every footprint, every storey and roof
    // height, the courtyard, and the Nandi's size. No measured drawing is online.
    build(g) {
      courtyardWall(g, { side: 62, height: 2.8, thickness: 0.8, colour: COLOUR.limewash, gate: 'west', gateWidth: 5 });
      const top = plinth(g, { levels: 1, width: 22, stepHeight: 1.4, shrink: 0, colour: COLOUR.limewash });
      newarTemple(g, {
        y: top,
        totalHeight: 23.7 - top,
        wallColour: COLOUR.brick,
        roofColour: COLOUR.gold,
        doorColour: COLOUR.silver,
        tiers: [
          { side: 13, height: 7.5, eave: 21, rise: 4 },
          { side: 9.5, height: 5, eave: 15, rise: 3.5 },
        ],
      });
      // The Nandi, gilded, before the west door and facing it.
      bull(g, { x: -19, z: 0, length: 3, colour: COLOUR.gold, plinthColour: COLOUR.darkStone });
      // Vasuki, a small pagoda in the north-east corner of the courtyard.
      g.add(mesh(new THREE.BoxGeometry(5, 0.8, 5), COLOUR.limewash, 23, 0.4, -23));
      const vasuki = new THREE.Group();
      vasuki.position.set(23, 0, -23);
      newarTemple(vasuki, { y: 0.8, wallColour: COLOUR.brick, roofColour: COLOUR.copper, doorColour: COLOUR.timber, tiers: [{ side: 3, height: 2.6, eave: 5, rise: 1.4 }, { side: 2.2, height: 1.4, eave: 3.6, rise: 1.1 }] });
      g.add(vasuki);
      // Unmatta Bhairav, a small shrine to the south.
      const bhairav = new THREE.Group();
      bhairav.position.set(0, 0, 22);
      newarTemple(bhairav, { y: 0.5, wallColour: COLOUR.brick, roofColour: COLOUR.copper, doorColour: COLOUR.timber, tiers: [{ side: 2.6, height: 2.2, eave: 4.2, rise: 1.2 }] });
      g.add(bhairav);
      // The Bagmati, then the east bank's row of fifteen small lingam shrines.
      g.add(mesh(new THREE.BoxGeometry(9, 0.12, 90), COLOUR.river, 38, 0.06, 0));
      for (let i = 0; i < 15; i += 1) {
        const z = -28 + i * 4;
        g.add(mesh(new THREE.BoxGeometry(2.2, 2.4, 2.2), COLOUR.limewash, 47, 1.2, z));
        const dome = new THREE.CylinderGeometry(0.1, 1.5, 1.1, 4, 1);
        dome.rotateY(Math.PI / 4);
        g.add(mesh(dome, COLOUR.stone, 47, 2.95, z));
      }
      return [
        { label: 'Two gilded roofs', note: 'A two-tiered pagoda with gilded copper roofs, about 23.7 m to the tip of its gilt finial. The present form dates from 1692. Storey and roof sizes here are estimates from photographs.', position: [0, 17, 9] },
        { label: 'Four silver doors', note: 'A silver-clad door on each of the four sides. Only Hindus may enter the courtyard; others view the temple from the east bank.', position: [0, 5, 7] },
        { label: 'Carved struts', note: 'Carved wooden struts (tundal) hold up the eaves on every side.', position: [7, 10, 7] },
        { label: 'Nandi', note: 'The gilded bull Nandi faces the west door. Its size here is an estimate.', position: [-19, 3, 0] },
        { label: 'Vasuki', note: 'A small shrine in the north-east corner of the courtyard.', position: [23, 6, -23] },
        { label: 'Pandra Shivalaya', note: 'Fifteen small shrines facing the temple across the Bagmati, on the bank where visitors stand.', position: [47, 4, 0] },
      ];
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
    id: 'basantapur-tower',
    title: 'Basantapur Tower and Lohan Chowk',
    targets: ['ktm-basantapur-durbar'],
    sources: [
      { title: 'Hanuman Dhoka, Wikipedia', url: 'https://en.wikipedia.org/wiki/Hanuman_Dhoka' },
      { title: 'Kathmandu Durbar Square, UNESCO Kathmandu Valley', url: 'https://whc.unesco.org/en/list/121' },
    ],
    // Sourced: nine storeys, at the south-west corner of the four-storey Lohan
    // Chowk, with a tower at each corner; built by Prithvi Narayan Shah (1768
    // or 1770); top storeys fell in 2015 and were rebuilt (handed over 2024).
    // Estimated: the tower's height (no source gives one; nine storeys put it
    // near 30 m), the courtyard size, and the other three towers' storey counts.
    build(g) {
      const side = 38;
      const wing = 9;
      const h = 13;
      for (const [x, z, w, d] of [[0, -side / 2 + wing / 2, side, wing], [0, side / 2 - wing / 2, side, wing], [-side / 2 + wing / 2, 0, wing, side - wing * 2], [side / 2 - wing / 2, 0, wing, side - wing * 2]]) {
        g.add(mesh(new THREE.BoxGeometry(w, h, d), COLOUR.brick, x, h / 2, z));
        g.add(mesh(new THREE.BoxGeometry(w + 1.6, 0.3, d + 1.6), COLOUR.copper, x, h + 0.15, z));
      }
      g.add(mesh(new THREE.BoxGeometry(side - wing * 2, 0.1, side - wing * 2), COLOUR.paving, 0, 0.05, 0));
      const c = side / 2 - wing / 2;
      storeyTower(g, { x: -c, z: c, side: 9, storeys: 9, storeyHeight: 3.2, wallColour: COLOUR.brick, roofColour: COLOUR.copper });
      for (const [x, z] of [[c, c], [c, -c], [-c, -c]]) {
        storeyTower(g, { x, z, side: 7.5, storeys: 5, storeyHeight: 3.1, wallColour: COLOUR.brick, roofColour: COLOUR.copper });
      }
      return [
        { label: 'Basantapur Tower', note: 'Nine storeys, built by Prithvi Narayan Shah around 1770. Its top storeys fell in 2015 and were rebuilt. No source gives its height; about 30 m here is an estimate.', position: [-c, 33, c] },
        { label: 'Lohan Chowk', note: 'The four-storey courtyard the towers stand around. Its size here is an estimate.', position: [0, 14, 0] },
        { label: 'Three more towers', note: 'Kirtipur, Bhaktapur and Lalitpur towers stand at the other corners. Their storey counts here are estimates.', position: [c, 19, -c] },
      ];
    },
  },
  {
    id: 'taleju-temple',
    title: 'Taleju Temple, Kathmandu',
    targets: ['ktm-taleju-temple'],
    sources: [{ title: 'Taleju Temple, Wikipedia (35 m, twelve plinths, three roofs)', url: 'https://en.wikipedia.org/wiki/Taleju_Temple' }],
    // Sourced: about 35 m tall, on twelve plinths, three roofs. Estimated:
    // the plinth widths and steps, and each storey's size.
    build(g) {
      const top = plinth(g, { levels: 12, width: 34, stepHeight: 1.05, shrink: 1.4, colour: COLOUR.brick });
      newarTemple(g, {
        y: top,
        totalHeight: 35 - top,
        wallColour: COLOUR.brick,
        roofColour: COLOUR.gold,
        doorColour: COLOUR.timber,
        tiers: [
          { side: 11, height: 4.5, eave: 17, rise: 3 },
          { side: 8.5, height: 3.2, eave: 13, rise: 2.6 },
          { side: 6.2, height: 2.4, eave: 9.5, rise: 2.2 },
        ],
      });
      return [
        { label: 'Twelve plinths', note: 'The temple stands on twelve stepped plinths. Their widths here are estimates.', position: [14, 7, 14] },
        { label: 'Three gilded roofs', note: 'About 35 m to the finial, one of the tallest temples in the square.', position: [0, 28, 6] },
      ];
    },
  },
  {
    id: 'kasthamandap',
    title: 'Kasthamandap',
    targets: ['ktm-kasthamandap'],
    sources: [{ title: 'Kasthamandap, Wikipedia (Slusser, after Korn: about 20 m wide and tall)', url: 'https://en.wikipedia.org/wiki/Kasthamandap' }],
    // Sourced: about 20 m wide and about as tall (Slusser 1974, after Korn's
    // drawings; another survey gives 18.7 m and 16.3 m), three storeys, four
    // central pillars about 6 m tall, 32 outer columns, a stair on each side, a
    // gilt finial. Rebuilt 2017 to 2021 from Korn's drawings.
    build(g) {
      const top = plinth(g, { levels: 1, width: 22, stepHeight: 1, shrink: 0, colour: COLOUR.darkStone });
      // Stairs on all four sides.
      for (let face = 0; face < 4; face += 1) {
        const a = (face * Math.PI) / 2;
        const st = mesh(new THREE.BoxGeometry(4, 0.5, 1.6), COLOUR.darkStone, Math.sin(a) * 11.6, 0.25, Math.cos(a) * 11.6);
        st.rotation.y = a;
        g.add(st);
      }
      // The open ground floor: 32 outer columns round the edge, four great pillars inside.
      const ring = 9.2;
      for (let i = 0; i < 32; i += 1) {
        const t = (i / 32) * 4;
        const sideIndex = Math.floor(t);
        const f = t - sideIndex;
        const p = -ring + f * ring * 2;
        const [x, z] = [[p, -ring], [ring, p], [-p, ring], [-ring, -p]][sideIndex];
        g.add(mesh(new THREE.BoxGeometry(0.4, 4.2, 0.4), COLOUR.timber, x, top + 2.1, z));
      }
      for (const [x, z] of [[-2.2, -2.2], [2.2, -2.2], [2.2, 2.2], [-2.2, 2.2]]) {
        g.add(mesh(new THREE.BoxGeometry(0.4, 6, 0.4), COLOUR.timber, x, top + 3, z));
      }
      newarTemple(g, {
        y: top + 4.2,
        totalHeight: 20 - top - 4.2,
        wallColour: COLOUR.timber,
        roofColour: COLOUR.copper,
        doorColour: COLOUR.wood,
        tiers: [
          { side: 19, height: 0.6, eave: 23, rise: 2.6 },
          { side: 14, height: 3.2, eave: 18, rise: 2.4 },
          { side: 9, height: 2.6, eave: 12.5, rise: 2.2 },
        ],
      });
      return [
        { label: 'An open pavilion', note: 'A public rest house: an open ground floor on 32 outer columns, with four great pillars at its centre.', position: [0, 3, 10] },
        { label: 'Three roofs', note: 'About 20 m wide and as tall, after Korn\'s measured drawings; another survey gives 18.7 m by 16.3 m. Rebuilt 2017 to 2021.', position: [0, 16, 6] },
      ];
    },
  },
  {
    id: 'maju-dega',
    title: 'Maju Dega',
    targets: ['ktm-maju-dega'],
    sources: [
      { title: 'Maju Dega, Wikipedia (1692, nine-step plinth, three roofs)', url: 'https://en.wikipedia.org/wiki/Maju_Dega' },
      { title: 'Kathmandu Post: reconstruction begins (2018)', url: 'https://kathmandupost.com/valley/2018/10/29/mayor-shakya-inaugurates-reconstruction-of-maju-dega-temple-20181029144058' },
    ],
    // Sourced: built 1692, a nine-step brick plinth about 28 m square (from
    // OpenStreetMap's outline), three roofs; destroyed in 2015 and rebuilt
    // from 2018, with travel sources saying it reopened around 2022 (no
    // official handover found). Estimated: every step and storey height, and
    // so the overall height.
    build(g) {
      const top = plinth(g, { levels: 9, width: 28, stepHeight: 0.85, shrink: 1.9, colour: COLOUR.brick });
      newarTemple(g, {
        y: top,
        wallColour: COLOUR.brick,
        roofColour: COLOUR.copper,
        doorColour: COLOUR.timber,
        tiers: [
          { side: 8, height: 3.6, eave: 12.5, rise: 2.4 },
          { side: 6.2, height: 2.6, eave: 9.5, rise: 2 },
          { side: 4.6, height: 2, eave: 7, rise: 1.7 },
        ],
      });
      return [
        { label: 'Nine steps', note: 'A nine-step brick plinth, about 28 m square at its base. People sit on these steps to watch the square. Step heights here are estimates.', position: [12, 4, 12] },
        { label: 'Three roofs', note: 'Built in 1692, destroyed in 2015 and rebuilt from 2018. Its overall height here is an estimate; check its condition on site.', position: [0, 16, 5] },
      ];
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
  const ground = mesh(new THREE.CylinderGeometry(groundRadius, groundRadius, 0.1, 64), COLOUR.ground, 0, -0.05);
  // Named so the map, which has ground of its own, can leave it out.
  ground.name = 'ground';
  group.add(ground);
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
