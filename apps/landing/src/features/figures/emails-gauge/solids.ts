import {
  cameraOf,
  iso,
  pathOf,
  SHADES,
  type Flat,
  type Point3,
  type Projection,
  type SolidPaths,
} from "@/components/iso/iso-kit";

/**
 * Convex solids in any orientation, painted by the kit's rules: a paper fill over the hull,
 * visible faces bucketed into the four shades by the kit's floor light, faces that point up
 * as the lighter top, creases where two visible faces meet, and the hull as the outline.
 * The floor-prism kit can't lay a roller along y or swing a flag, so these do.
 */

const nth = <T>(list: readonly T[], index: number): T => list[index] as T;
const sub = (a: Point3, b: Point3): Point3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Point3, b: Point3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const cross = (o: Flat, a: Flat, b: Flat) =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
const add = (...list: Point3[]): Point3 =>
  list.reduce<Point3>(
    (sum, point) => [sum[0] + point[0], sum[1] + point[1], sum[2] + point[2]],
    [0, 0, 0],
  );

function hull(points: Flat[]): Flat[] {
  const sorted = points.toSorted((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (sorted.length < 3) return sorted;
  const lower: Flat[] = [];
  for (const point of sorted) {
    while (
      lower.length >= 2 &&
      cross(nth(lower, lower.length - 2), nth(lower, lower.length - 1), point) <= 0
    )
      lower.pop();
    lower.push(point);
  }
  const upper: Flat[] = [];
  for (let index = sorted.length - 1; index >= 0; index--) {
    const point = nth(sorted, index);
    while (
      upper.length >= 2 &&
      cross(nth(upper, upper.length - 2), nth(upper, upper.length - 1), point) <= 0
    )
      upper.pop();
    upper.push(point);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

function normalOf(face: Point3[]): Point3 {
  let nx = 0;
  let ny = 0;
  let nz = 0;
  for (let index = 0; index < face.length; index++) {
    const [ax, ay, az] = nth(face, index);
    const [bx, by, bz] = nth(face, (index + 1) % face.length);
    nx += (ay - by) * (az + bz);
    ny += (az - bz) * (ax + bx);
    nz += (ax - bx) * (ay + by);
  }
  const length = Math.hypot(nx, ny, nz) || 1;
  return [nx / length, ny / length, nz / length];
}

export function viewOf(projection: Projection): Point3 {
  const { sinA, cosA, sinE, cosE } = cameraOf(projection);
  return [cosA * cosE, sinA * cosE, sinE];
}

export function polyOf(
  vertices: Point3[],
  faces: number[][],
  projection: Projection,
  { creases = true } = {},
): SolidPaths {
  const view = viewOf(projection);
  const { sinA, cosA } = cameraOf(projection);
  const light: [number, number] = [-sinA, cosA];
  const centre = vertices
    .reduce<Point3>(
      (sum, point) => [sum[0] + point[0], sum[1] + point[1], sum[2] + point[2]],
      [0, 0, 0],
    )
    .map((value) => value / vertices.length) as Point3;
  const flat = vertices.map((point) => iso(point, projection));
  const buckets: string[][] = Array.from({ length: SHADES }, () => []);
  const tops: string[] = [];
  const visible: boolean[] = [];
  const normals: Point3[] = [];
  faces.forEach((face, index) => {
    const points = face.map((at) => nth(vertices, at));
    let normal = normalOf(points);
    const mid = points
      .reduce<Point3>(
        (sum, point) => [sum[0] + point[0], sum[1] + point[1], sum[2] + point[2]],
        [0, 0, 0],
      )
      .map((value) => value / points.length) as Point3;
    if (dot(normal, sub(mid, centre)) < 0) normal = [-normal[0], -normal[1], -normal[2]];
    normals[index] = normal;
    visible[index] = dot(normal, view) > 1e-6;
    if (!visible[index]) return;
    const d = pathOf(
      face.map((at) => nth(flat, at)),
      true,
    );
    if (normal[2] > 0.72) {
      tops.push(d);
      return;
    }
    const level = Math.hypot(normal[0], normal[1]);
    const lit =
      level > 1e-6 ? ((normal[0] * light[0] + normal[1] * light[1]) / level + 1) / 2 : 0.5;
    const lifted = Math.min(1, lit + Math.max(0, normal[2]) * 0.35);
    nth(buckets, Math.min(SHADES - 1, Math.max(0, Math.floor(lifted * SHADES)))).push(d);
  });
  const creaseLines: string[] = [];
  if (creases) {
    const owners = new Map<string, number[]>();
    faces.forEach((face, index) => {
      face.forEach((from, at) => {
        const to = nth(face, (at + 1) % face.length);
        const key = from < to ? `${from}:${to}` : `${to}:${from}`;
        const list = owners.get(key) ?? [];
        list.push(index);
        owners.set(key, list);
      });
    });
    for (const [key, list] of owners) {
      if (list.length !== 2) continue;
      const [a, b] = list as [number, number];
      if (!visible[a] || !visible[b]) continue;
      if (dot(nth(normals, a), nth(normals, b)) > 0.9) continue;
      const [from, to] = key.split(":").map(Number) as [number, number];
      creaseLines.push(pathOf([nth(flat, from), nth(flat, to)]));
    }
  }
  const outline = pathOf(hull(flat), true);
  return {
    fill: outline,
    outline,
    crease: creaseLines.join(""),
    top: tops.join(""),
    shades: buckets.map((list) => list.join("")),
  };
}

/** A box from an origin and three edge vectors. */
export function boxOf(origin: Point3, a: Point3, b: Point3, c: Point3, projection: Projection) {
  const vertices: Point3[] = [
    origin,
    add(origin, a),
    add(origin, a, b),
    add(origin, b),
    add(origin, c),
    add(origin, a, c),
    add(origin, a, b, c),
    add(origin, b, c),
  ];
  const faces = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [1, 2, 6, 5],
    [2, 3, 7, 6],
    [3, 0, 4, 7],
  ];
  return polyOf(vertices, faces, projection);
}

/** A round bar lying along y: a roller, a wheel, an end cap. */
export function barY(
  cx: number,
  cz: number,
  radius: number,
  y0: number,
  y1: number,
  projection: Projection,
  steps = 28,
) {
  const ring = Array.from({ length: steps }, (_, step) => {
    const angle = (step / steps) * Math.PI * 2;
    return [cx + radius * Math.cos(angle), cz + radius * Math.sin(angle)] as const;
  });
  const vertices: Point3[] = [
    ...ring.map(([x, z]): Point3 => [x, y0, z]),
    ...ring.map(([x, z]): Point3 => [x, y1, z]),
  ];
  const faces: number[][] = ring.map((_, index) => {
    const next = (index + 1) % steps;
    return [index, next, steps + next, steps + index];
  });
  faces.push(ring.map((_, index) => index));
  faces.push(ring.map((_, index) => steps + index));
  const paths = polyOf(vertices, faces, projection, { creases: false });
  const cap = pathOf(
    ring.map(([x, z]) => iso([x, y1, z], projection)),
    true,
  );
  return { ...paths, crease: cap };
}

/** A point on the visible end face of a bar along y, at `angle` from +x toward +z. */
export const onCap = (cx: number, cz: number, radius: number, y: number, angle: number): Point3 => [
  cx + radius * Math.cos(angle),
  y,
  cz + radius * Math.sin(angle),
];

/** A round bar lying along x: a pin out of a vertical face that faces +x. */
export function barX(
  cy: number,
  cz: number,
  radius: number,
  x0: number,
  x1: number,
  projection: Projection,
  steps = 20,
) {
  const ring = Array.from({ length: steps }, (_, step) => {
    const angle = (step / steps) * Math.PI * 2;
    return [cy + radius * Math.cos(angle), cz + radius * Math.sin(angle)] as const;
  });
  const vertices: Point3[] = [
    ...ring.map(([y, z]): Point3 => [x0, y, z]),
    ...ring.map(([y, z]): Point3 => [x1, y, z]),
  ];
  const faces: number[][] = ring.map((_, index) => {
    const next = (index + 1) % steps;
    return [index, next, steps + next, steps + index];
  });
  faces.push(ring.map((_, index) => index));
  faces.push(ring.map((_, index) => steps + index));
  const paths = polyOf(vertices, faces, projection, { creases: false });
  const cap = pathOf(
    ring.map(([y, z]) => iso([x1, y, z], projection)),
    true,
  );
  return { ...paths, crease: cap };
}
