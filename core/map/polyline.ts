export type RoutePoint = readonly [longitude: number, latitude: number];

/**
 * Decode the compact Google/Valhalla polyline format without pulling routing
 * concerns into the React layer. Valhalla uses six decimal places by default.
 */
export function decodePolyline(encoded: string, precision = 6): RoutePoint[] {
  const scale = 10 ** precision;
  const coordinates: RoutePoint[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  const nextDelta = (): number => {
    let result = 0;
    let shift = 0;
    let byte = 0;
    do {
      if (index >= encoded.length) throw new Error('Incomplete route geometry');
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      if (byte < 0 || byte > 63 || shift > 30) throw new Error('Invalid route geometry');
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
  };

  while (index < encoded.length) {
    latitude += nextDelta();
    longitude += nextDelta();
    coordinates.push([longitude / scale, latitude / scale]);
  }
  return coordinates;
}
