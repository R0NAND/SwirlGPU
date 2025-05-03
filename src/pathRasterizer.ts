type Point = { x: number; y: number };

/**
 * Returns integer (x, y) pairs forming a thick line between (x0, y0) and (x1, y1)
 * @param x0 Start x
 * @param y0 Start y
 * @param x1 End x
 * @param y1 End y
 * @param radius Radius of thickness in pixels (>= 0)
 */
export const rasterizeLine = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number
): Point[] => {
  const points = new Set<string>();

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;

  let err = dx - dy;
  let x = x0;
  let y = y0;

  while (true) {
    // Add a filled circle around the current point to simulate thickness
    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        if (i * i + j * j <= radius * radius) {
          points.add(`${x + i},${y + j}`);
        }
      }
    }

    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }

  // Convert Set<string> to Point[]
  return Array.from(points).map((str) => {
    const [px, py] = str.split(",").map(Number);
    return { x: px, y: py };
  });
};
