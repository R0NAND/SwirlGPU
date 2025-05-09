@group(0) @binding(0) var<uniform> grid_size: vec2<u32>;
@group(0) @binding(1) var<uniform> dt: f32;
@group(0) @binding(2) var<uniform> visc: f32;
@group(0) @binding(3) var<uniform> diff: f32;
@group(0) @binding(4) var<uniform> decay: f32;

@group(1) @binding(0) var<storage> velocities: array<vec2<f32>>;

@group(2) @binding(0) var<storage, read_write> divergences_out: array<f32>;

@group(3) @binding(0) var<storage, read_write> pressures_out: array<f32>;

@compute @workgroup_size(16, 16)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
  if(global_id.x > 0 && global_id.x < grid_size.x - 1 && global_id.y > 0 && global_id.y < grid_size.y - 1) {
    let cell_index: u32 = global_id.x + grid_size.x * global_id.y;
    let h: f32 = 1.0 / f32((grid_size.x - 2) * (grid_size.y - 2));
    let left_index: u32 = cell_index - 1;
    let right_index: u32 = cell_index + 1;
    let top_index: u32 = cell_index - grid_size.x;
    let bottom_index: u32 = cell_index + grid_size.x;
    divergences_out[cell_index] = -0.5 * h * (velocities[right_index].x - velocities[left_index].x + velocities[bottom_index].y - velocities[top_index].y);
    pressures_out[cell_index] = 0.0;
  }
}