@group(0) @binding(0) var<uniform> grid_size: vec2<u32>;
@group(0) @binding(1) var<storage> divergences: array<f32>;
@group(0) @binding(2) var<storage> pressures_in: array<f32>;
@group(0) @binding(3) var<storage, read_write> pressures_out: array<f32>;
@compute @workgroup_size(16, 16)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
  if(global_id.x > 0 && global_id.x < grid_size.x - 1 && global_id.y > 0 && global_id.y < grid_size.y - 1) {
    let cell_index: u32 = global_id.x + grid_size.x * global_id.y;
    let divergence = divergences[cell_index];
    let left_index: u32 = cell_index - 1;
    let right_index: u32 = cell_index + 1;
    let top_index: u32 = cell_index - grid_size.x;
    let bottom_index: u32 = cell_index + grid_size.x;
    pressures_out[cell_index] = (divergence + pressures_in[left_index] + pressures_in[right_index] + pressures_in[top_index] + pressures_in[bottom_index]) / 4.0;
  }
}