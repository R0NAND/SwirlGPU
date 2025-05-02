const diff: f32 = 0.07;
const visc: f32 = 0.9975;
const dt: f32 = 0.01666667;
@group(0) @binding(0) var<uniform> grid_size: vec2<u32>;
@group(0) @binding(1) var<storage> velocities_in: array<vec2<f32>>;
@group(0) @binding(2) var<storage, read_write> velocities_out: array<vec2<f32>>;
@compute @workgroup_size(16, 16)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
  if(global_id.x > 0 && global_id.x < grid_size.x - 1 && global_id.y > 0 && global_id.y < grid_size.y - 1) {
    let index: u32 = global_id.x + grid_size.x * global_id.y;
    var advectedFrom: vec2<f32> = vec2<f32>(f32(global_id.x), f32(global_id.y)) - dt * velocities_in[index];
    if (advectedFrom.x < 0.5) {
      advectedFrom.x = 0.5;
    }
    if (advectedFrom.x > f32(grid_size.x) - 1.5) {
      advectedFrom.x = f32(grid_size.x) - 1.5;
    }
    if (advectedFrom.y < 0.5) {
      advectedFrom.y = 0.5;
    }
    if (advectedFrom.y > f32(grid_size.y) - 1.5) {
      advectedFrom.y = f32(grid_size.y) - 1.5;
    }
    let i0: u32 = u32(advectedFrom.x);
    let j0: u32 = u32(advectedFrom.y);
    let i1: u32 = i0 + 1;
    let j1: u32 = j0 + 1;
    let s1: f32 = advectedFrom.x - f32(i0);
    let s0: f32 = 1.0 - s1;
    let t1: f32 = advectedFrom.y - f32(j0);
    let t0: f32 = 1.0 - t1;
    velocities_out[index] = s0 * (t0 * velocities_in[i0 + grid_size.x * j0] + t1 * velocities_in[i0 + grid_size.x * j1]) + 
                             s1 * (t0 * velocities_in[i1 + grid_size.x * j0] + t1 * velocities_in[i1 + grid_size.x * j1]); 
	}
}
