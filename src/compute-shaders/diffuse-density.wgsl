const diff: f32 = 0.3;
const visc: f32 = 0.997;
const dt: f32 = 0.01666667;
@group(0) @binding(0) var<uniform> grid_size: vec2<u32>;
@group(0) @binding(1) var<storage> densities_in: array<f32>;
@group(0) @binding(2) var<storage, read_write> densities_out: array<f32>;
@compute @workgroup_size(16, 16)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {

  if(global_id.x > 0 && global_id.x < grid_size.x - 1 && global_id.y > 0 && global_id.y < grid_size.y - 1) {
    let cell_index: u32 = global_id.x + grid_size.x * global_id.y;
    let density: f32 = densities_in[cell_index];
    let left_index: u32 = cell_index - 1;
    let right_index: u32 = cell_index + 1;
    let top_index: u32 = cell_index - grid_size.x;
    let bottom_index: u32 = cell_index + grid_size.x;
    densities_out[cell_index] = density - visc * dt * (4.0 * density - densities_in[left_index] - densities_in[right_index] - densities_in[top_index] - densities_in[bottom_index]);
  }
}