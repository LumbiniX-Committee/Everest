/**
 * Web Mercator tile maths for saving a map area to the phone.
 *
 * Pure, so the download plan and its size estimate are tested, not trusted.
 */
export type Bounds = { west: number; south: number; east: number; north: number };
export type TileId = { z: number; x: number; y: number };

export function lonToTileX(lon: number, z: number): number {
  return Math.floor(((lon + 180) / 360) * 2 ** z);
}

export function latToTileY(lat: number, z: number): number {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z);
}

/** Every tile covering the bounds at each zoom from minZoom to maxZoom inclusive. */
export function tilesForBounds(bounds: Bounds, minZoom: number, maxZoom: number): TileId[] {
  const out: TileId[] = [];
  for (let z = minZoom; z <= maxZoom; z += 1) {
    const max = 2 ** z - 1;
    const x0 = Math.max(0, lonToTileX(bounds.west, z));
    const x1 = Math.min(max, lonToTileX(bounds.east, z));
    // Tile rows count down from the north.
    const y0 = Math.max(0, latToTileY(bounds.north, z));
    const y1 = Math.min(max, latToTileY(bounds.south, z));
    for (let x = x0; x <= x1; x += 1) for (let y = y0; y <= y1; y += 1) out.push({ z, x, y });
  }
  return out;
}

/** The bounds of a line of [longitude, latitude] pairs, widened by a margin in degrees. */
export function boundsOfLine(line: readonly (readonly [number, number])[], marginDeg = 0.02): Bounds | null {
  if (!line.length) return null;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const [lon, lat] of line) {
    west = Math.min(west, lon);
    east = Math.max(east, lon);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }
  return { west: west - marginDeg, south: south - marginDeg, east: east + marginDeg, north: north + marginDeg };
}
