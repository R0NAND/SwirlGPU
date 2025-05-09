@group(0) @binding(0) var<uniform> grid_size: vec2<u32>;
@group(0) @binding(1) var<uniform> dt: f32;
@group(0) @binding(2) var<uniform> visc: f32;
@group(0) @binding(3) var<uniform> diff: f32;
@group(0) @binding(4) var<uniform> decay: f32;

@group(1) @binding(0) var<storage> velocities_in: array<vec2<f32>>;
@group(1) @binding(1) var<storage, read_write> velocities_out: array<vec2<f32>>;
@compute @workgroup_size(16, 16)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {

  if(global_id.x > 0 && global_id.x < grid_size.x - 1 && global_id.y > 0 && global_id.y < grid_size.y - 1) {
    let cell_index: u32 = global_id.x + grid_size.x * global_id.y;
    let velocity: vec2<f32> = velocities_in[cell_index];
    let left_index: u32 = cell_index - 1;
    let right_index: u32 = cell_index + 1;
    let top_index: u32 = cell_index - grid_size.x;
    let bottom_index: u32 = cell_index + grid_size.x;
    velocities_out[cell_index] = velocity - visc * dt * (4.0 * velocity - velocities_in[left_index] - velocities_in[right_index] - velocities_in[top_index] - velocities_in[bottom_index]);
  }
}