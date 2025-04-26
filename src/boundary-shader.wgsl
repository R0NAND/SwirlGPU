@group(0) @binding(0) var<uniform> grid_size: vec2<u32>;
@group(0) @binding(1) var<storage> velocities_in: array<vec2<f32>>;
@group(0) @binding(2) var<storage> densities_in: array<f32>;
@group(0) @binding(3) var<storage, read_write> velocities_out: array<vec2<f32>>;
@group(0) @binding(4) var<storage, read_write> densities_out: array<f32>;
@compute @workgroup_size(16, 16)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
  if(global_id.x == 0){
    let index: u32 = global_id.x + grid_size.x * global_id.y;
    densities_out[index] = densities_in[index + 1];
    velocities_out[index].x = -velocities_in[index + 1].x;
    velocities_out[index].y = velocities_in[index + 1].y; 
  }
  if(global_id.x == grid_size.x - 1){
    let index: u32 = global_id.x + grid_size.x * global_id.y;
    densities_out[index] = densities_in[index - 1];
    velocities_out[index].x = -velocities_in[index - 1].x;
    velocities_out[index].y = velocities_in[index - 1].y; 
  }
  if(global_id.y == 0){
    let index: u32 = global_id.x + grid_size.x * global_id.y;
    densities_out[index] = densities_in[index + grid_size.x];
    velocities_out[index].x = velocities_in[index + grid_size.x].x;
    velocities_out[index].y = -velocities_in[index + grid_size.x].y; 
  }
  if(global_id.y == grid_size.y - 1){
    let index: u32 = global_id.x + grid_size.x * global_id.y;
    densities_out[index] = densities_in[index - grid_size.x];
    velocities_out[index].x = velocities_in[index - grid_size.x].x;
    velocities_out[index].y = -velocities_in[index - grid_size.x].y; 
  }
}
