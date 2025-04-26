@group(0) @binding(0)
var<uniform> grid_size: vec2<u32>; // e.g., 100x100

@group(0) @binding(1)
var<storage, read> densities: array<f32>;

@fragment fn main(@builtin(position) cell: vec4f) -> @location(0) vec4f {
  // Convert float position to integer pixel coordinate
  let coord = vec2<u32>(cell.xy);

  // Bounds check to prevent overflow
  if (coord.x >= grid_size.x || coord.y >= grid_size.y) {
    return vec4f(0.0, 0.0, 0.0, 1.0);
  }

  // Compute 1D index into array (row-major order)
  let index = coord.y * grid_size.x + coord.x;
  let gray = densities[index];

  // Output grayscale as RGB (optional gamma correction could go here)
  return vec4f(gray, gray, gray, 1.0);
}