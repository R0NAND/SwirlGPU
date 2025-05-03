@group(0) @binding(0)
var<uniform> grid_size: vec2<u32>; // e.g., 100x100

@group(0) @binding(1)
var<storage, read> densities: array<f32>;

@fragment fn main(@builtin(position) cell: vec4f) -> @location(0) vec4f {
  let coord = vec2<u32>(cell.xy);

  if (coord.x >= grid_size.x || coord.y >= grid_size.y) {
    return vec4f(0.0, 0.0, 0.0, 1.0);
  }

  let index = coord.y * grid_size.x + coord.x;
  //let gray = 100000 * (densities[index] + 0.000002); // currently used to plot pressure and divergence
  let density = densities[index];
  var r = density;
  var g = density * density * density;
  var b = density * density * density * density * density * density;

  // Output grayscale as RGB (optional gamma correction could go here)
  return vec4f(r, g, b, 1.0);
}